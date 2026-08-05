# ============================================================
#  LMS-ESP32 게이트웨이 + SSD1306 OLED 상태 화면 (main.py로 저장)
#
#  역할:
#   1) 시계(ESP32-S3)의 ESP-NOW 신호 수신 (낙상/SOS/하트비트)
#   2) 스파이크 허브(C포트)에 PUPRemote로 이벤트 전달
#   3) OLED에 상태 표시:
#      - WATCH OK / WATCH LOST (연결 상태)
#      - 마지막 이벤트, 로봇 상태, 시계 배터리
#      - 낙상/SOS 수신 시 화면 반전 깜빡임 (경보)
#
#  준비:
#   - ssd1306.py 를 보드에 업로드
#   - 이 파일을 main.py 로 저장
#   - 배선: SDA=GPIO13, SCL=GPIO14, VCC=3V3, GND=GND
#
#  ※ OLED가 없거나 초기화 실패해도 게이트웨이 기능은 계속 동작
# ============================================================
import network
import espnow
import struct
import time
from machine import SoftI2C, Pin
from pupremote import PUPRemoteSensor

# ---------- 프로젝트 공통 정의 (시계 코드와 일치) ----------
PROJ_MAGIC    = 0xA7
MSG_HEARTBEAT = 1
MSG_FALL      = 2
MSG_SOS       = 3
MSG_CANCEL    = 4
MSG_MED_TAKEN = 5
MSG_BEACON    = 7      # 시계 위치 추적 비콘 (이벤트 아님, RSSI 측정용)
MSG_ACK       = 10
MSG_ROBOT_STAT = 11

ESPNOW_CHANNEL = 1
BROADCAST = b'\xff\xff\xff\xff\xff\xff'
LINK_TIMEOUT_MS = 15000

EVENT_NAMES = {0: "-", 2: "FALL!", 3: "SOS!", 4: "CANCEL", 5: "MED"}
ROBOT_NAMES = {0: "IDLE", 1: "GO!", 2: "ARRIVED"}

# ============================================================
#  I2C 배선 구성 (확정)
#  - 버스1 (SDA=13, SCL=14) : OLED SSD1306 (0x3C)
#  - 버스2 (SDA=26, SCL=27) : 음성인식 SEN0539 (0x64, 스위치 I2C 모드)
#  - Qwiic 포트             : 8채널 라인센서 (핀/주소 확인 후 아래에 기입)
# ============================================================
i2c_disp  = SoftI2C(sda=Pin(13), scl=Pin(14), freq=100000)
i2c_voice = SoftI2C(sda=Pin(26), scl=Pin(27), freq=100000)
print("버스1(OLED) 스캔:", [hex(a) for a in i2c_disp.scan()])
print("버스2(음성) 스캔:", [hex(a) for a in i2c_voice.scan()])

# Qwiic 포트: 8채널 라인센서 (Anton's LMS-Line-Sensor, SCL=4 SDA=5 주소51)
# ※ line_sensor.py 가 보드에 있어야 함 (펌웨어 내장 or 업로드)
# ※ PET 매트 캘리브레이션: debug_line_pet.py 실행 → 출력된 두 줄을 아래에 붙여넣기
#    붙여넣으면 부팅 때마다 이 값을 강제 적용 (EEPROM이 바뀌어도 안전)
#    None이면 기존처럼 EEPROM에 저장된 값을 사용
# PET 매트 실측 캘리브레이션 (2026-08-05, debug_line_pet.py + raw 진단 결과)
# 채널 0·1은 스윕 미흡으로 raw 진단 피크(64, 56) 기반 수동값 적용
LINE_CAL_MIN = (13, 13, 13, 14, 13, 13, 14, 14)
LINE_CAL_MAX = (60, 50, 101, 147, 129, 69, 96, 118)

line_sen = None
try:
    from line_sensor import LineSensorI2C
    line_sen = LineSensorI2C(scl_pin=4, sda_pin=5, device_addr=51)
    line_sen.ir_power(True)
    if LINE_CAL_MIN and LINE_CAL_MAX:
        line_sen.set_calibration(LINE_CAL_MIN, LINE_CAL_MAX)
        time.sleep_ms(300)           # 값 기록 직후 센서가 바쁨 — 대기 필수
        print("라인센서 OK (PET 매트 고정 캘리브레이션 적용)")
    else:
        line_sen.load_calibration()
        print("라인센서 OK (EEPROM 캘리브레이션 사용)")
    for _try in range(3):            # 타임아웃 시 재시도
        try:
            line_sen.mode_calibrated()
            break
        except OSError:
            time.sleep_ms(300)
except Exception as ex:
    print("라인센서 미감지(라인 기능 없이 동작):", ex)
    line_sen = None

# ============================================================
#  OLED (SSD1306)
# ============================================================
oled = None
try:
    import ssd1306
    oled = ssd1306.SSD1306_I2C(128, 64, i2c_disp, addr=0x3C)
    oled.fill(0)
    oled.text("GATEWAY BOOT..", 0, 28)
    oled.show()
    print("OLED OK")
except Exception as ex:
    print("OLED 초기화 실패(게이트웨이는 계속 동작):", ex)
    oled = None

# ============================================================
#  음성인식 SEN0539 (DFRobot DF2301Q, I2C 0x64)
#  사용법: 웨이크워드("Hello robot" 또는 학습한 호출어)를 말한 뒤 명령어를 말함
#  ※ 한국어 명령은 모듈의 자가학습(self-learning) 기능으로 직접 녹음해 등록
#     (학습된 커스텀 명령은 ID 5~21 로 부여됨)
# ============================================================
class DF2301Q:
    REG_CMDID     = 0x02
    REG_PLAY      = 0x03
    REG_MUTE      = 0x04
    REG_VOLUME    = 0x05
    REG_WAKE_TIME = 0x06

    def __init__(self, i2c_bus, addr=0x64):
        self.i2c = i2c_bus
        self.addr = addr

    def get_cmd_id(self):
        try:
            return self.i2c.readfrom_mem(self.addr, self.REG_CMDID, 1)[0]
        except OSError:
            return 0

    def set_volume(self, v):          # 1~7
        try:
            self.i2c.writeto_mem(self.addr, self.REG_VOLUME, bytes([v]))
        except OSError:
            pass

    def set_wake_time(self, sec):     # 웨이크 상태 유지 시간
        try:
            self.i2c.writeto_mem(self.addr, self.REG_WAKE_TIME, bytes([sec]))
        except OSError:
            pass

    def wake(self):
        """웨이크워드 없이 강제로 음성인식 대기 모드 진입
        (PLAY 레지스터에 웨이크 ID 1을 쓰면 'Hello Robot'과 동일 효과 + 응답음 재생)"""
        try:
            self.i2c.writeto_mem(self.addr, self.REG_PLAY, bytes([1]))
        except OSError:
            pass


voice = None
try:
    if 0x64 in i2c_voice.scan():
        voice = DF2301Q(i2c_voice)
        voice.set_volume(7)          # 볼륨 최대 (1~7)
        voice.set_wake_time(120)     # 도착 후 2분 동안 웨이크워드 없이 명령 대기
        print("음성인식 SEN0539 OK (버스2: 26/27)")
    else:
        print("음성인식 모듈 미감지 (버스2에 0x64 없음) - 음성 기능 없이 동작")
except Exception as ex:
    print("음성인식 초기화 실패(무시):", ex)
    voice = None

# ============================================================
#  서보 모터 (전원: 18650x2 파워뱅크 5V, GND 공통 필수!)
#  핀 번호 확정 후 SERVO_PINS 에 기입 (예: [21, 22])
#  허브에서 gw.call('srv', 번호, 각도) 로 제어
# ============================================================
from machine import PWM

SERVO_PINS = [21]        # 서보 0번 = GPIO21
servos = []
for _pin in SERVO_PINS:
    try:
        _s = PWM(Pin(_pin), freq=50)
        servos.append(_s)
        print("서보 준비: GPIO", _pin)
    except Exception as ex:
        print("서보 초기화 실패 GPIO", _pin, ":", ex)
        servos.append(None)


def servo_angle(idx, deg):
    """idx번 서보를 deg도로 이동 (-90=끝, 0=중앙, +90=반대 끝)"""
    if 0 <= idx < len(servos) and servos[idx]:
        deg = max(-90, min(90, deg))
        us = 1500 + deg * 1000 // 90            # -90=500us, 0=1500us, +90=2500us
        servos[idx].duty_u16(us * 65535 // 20000)


def srv(idx, deg):                               # PUPRemote 콜백
    servo_angle(idx, deg)


servo_angle(0, 0)    # 부팅 시 서보를 0도 기본 위치로


# ============================================================
#  라인센서 값 관리 (위치, 변화량, 모양)
#  위치: -128(왼쪽)~127(오른쪽), 0=중앙 / 모양: '|' 직선, 'T' T자, ' ' 없음
# ============================================================
line_pos, line_deriv, line_shape = 0, 0, 32   # 32 = ' ' (라인 없음)
_last_line_read = 0
T_LATCH_MS = 400          # 'T'를 한 번 보면 이 시간 동안 유지 (허브가 놓치지 않게)
_t_seen_ms = -10000

def read_line_sensor():
    global line_pos, line_deriv, line_shape, _last_line_read, _t_seen_ms
    if line_sen is None:
        return
    now_ms = time.ticks_ms()
    if time.ticks_diff(now_ms, _last_line_read) < 40:   # 25Hz 갱신
        return
    _last_line_read = now_ms
    try:
        p_, d_, s_ = line_sen.position_derivative_shape()
        line_pos = max(-128, min(127, p_))
        line_deriv = max(-128, min(127, d_))
        line_shape = s_ if isinstance(s_, int) else ord(s_)
        if line_shape == ord('T'):
            _t_seen_ms = now_ms                 # T 래치 갱신
    except Exception:
        pass


def _shape_latched():
    """짧게 스친 'T'도 허브가 반드시 읽도록 T_LATCH_MS 동안 'T' 유지"""
    if time.ticks_diff(time.ticks_ms(), _t_seen_ms) < T_LATCH_MS:
        return ord('T')
    return line_shape


def line():                                      # PUPRemote 콜백
    return (line_pos, line_deriv, _shape_latched())


def nav():
    """주행 전용 통합 명령: 라인 데이터 + 이벤트를 한 번에.
    (주행 중 poll/line 모드 전환으로 인한 지연을 없앰)"""
    global last_event
    ev = last_event
    if ev and time.ticks_diff(time.ticks_ms(), event_set_ms) > EVENT_HOLD_MS:
        last_event = 0
    return (line_pos, line_deriv, _shape_latched(), ev)

# ============================================================
#  음성 명령 ID → 동작 매핑 (SEN0539 자가학습, 총 6개)
#  학습 순서대로 ID 5부터 부여됨. 아래 순서로 학습을 권장:
#    ID 5: 약 요청 (한국어, 예: "약 주세요")
#    ID 6: 약 요청 (영어,   예: "Medicine please")
#    ID 7: 약 요청 (일본어, 예: "くすりください")
#    ID 8: 응급 요청 (한국어, 예: "도와줘")
#    ID 9: 응급 요청 (영어,   예: "Help me")
#    ID 10: 응급 요청 (일본어, 예: "たすけて")
#  학습 후 debug_sen0539.py 로 실제 ID를 확인하고 아래 숫자를 맞추세요
# ============================================================
VOICE_MED_IDS    = (5, 6, 7)     # 약 요청 (한/영/일) → 로봇이 와서 약 배출
VOICE_SOS_IDS    = (8, 9, 10)    # 응급 요청 (한/영/일) → 로봇 출동
VOICE_CANCEL_IDS = ()            # (예비) 취소 명령을 추가 학습하면 ID를 여기에

blink = False

def ui_update(link_ok, batt, event, robot, alarm_active):
    global blink
    if oled is None:
        return
    blink = not blink
    oled.fill(0)
    if help_request:
        # 음성 응급 요청 중: 보호자 호출 메시지 (반전 깜빡임)
        oled.text("!! HELP !!", 24, 8)
        oled.text("REQUEST", 36, 24)
        oled.text("CALLING FAMILY", 8, 44)
        oled.invert(blink)
        oled.show()
        return
    if alarm_active:
        # 경보: EMERGENCY 크게 + 반전 깜빡임
        oled.text("!! EMERGENCY !!", 4, 4)
        oled.text("EV: " + EVENT_NAMES.get(event, "?"), 0, 24)
        oled.text("ROBOT: " + ROBOT_NAMES.get(robot, "?"), 0, 38)
        oled.text("BAT: %d%%" % batt, 0, 52)
        oled.invert(blink)          # 0.5초마다 흑백 반전 → 눈에 잘 띔
    else:
        oled.invert(False)
        if link_ok:
            oled.text("WATCH OK", 28, 4)
        else:
            oled.text("WATCH LOST!", 20, 4)
        oled.hline(0, 16, 128, 1)
        oled.text("EV: " + EVENT_NAMES.get(event, "?"), 0, 24)
        oled.text("ROBOT: " + ROBOT_NAMES.get(robot, "?"), 0, 38)
        oled.text("BAT: %d%%" % batt, 0, 52)
    oled.show()


# ============================================================
#  ESP-NOW
# ============================================================
# 이전 실행에서 남은 AP가 있으면 먼저 끔 (AP가 켜져 있으면 채널 변경이 거부됨)
_ap_pre = network.WLAN(network.AP_IF)
if _ap_pre.active():
    _ap_pre.active(False)
    time.sleep_ms(200)

sta = network.WLAN(network.STA_IF)
sta.active(True)
try:
    sta.config(channel=ESPNOW_CHANNEL)
except RuntimeError as _ce:
    # 채널 설정 실패해도 이후 AP 설정(channel=1)이 같은 채널로 맞춰줌
    print("STA 채널 설정 건너뜀:", _ce)
try:
    sta.config(pm=sta.PM_NONE)          # Wi-Fi 절전 끄기 (ESP-NOW 수신 누락 방지!)
except (ValueError, AttributeError):
    try:
        import network as _nw
        sta.config(pm=_nw.WLAN.PM_NONE)
    except Exception as _e:
        print("절전 해제 실패(무시):", _e)
try:
    sta.disconnect()
except OSError:
    pass

e = espnow.ESPNow()
e.active(True)
e.add_peer(BROADCAST)

last_event = 0
help_request = False    # 음성 응급 요청 중 (OLED 표시용)
event_set_ms = 0        # 이벤트 수신 시각
EVENT_HOLD_MS = 600     # 이벤트를 이 시간 동안 유지 → 허브가 확실히 읽어감
disp_event = 0
watch_battery = 0
last_seen_ms = time.ticks_ms() - LINK_TIMEOUT_MS
robot_status = 0
alarm_active = False
seq = 0
watch_mac = None        # 시계 MAC (첫 수신 패킷에서 자동 학습 → 1:1 전송)


def learn_watch(mac):
    global watch_mac
    if watch_mac != mac:
        try:
            e.add_peer(mac)
        except OSError:      # 이미 등록된 경우
            pass
        watch_mac = mac
        print("[페어링] 시계 MAC 학습:", mac.hex() if hasattr(mac, 'hex') else mac)


def send_to_watch(msg_type, aux=0):
    global seq
    seq = (seq + 1) % 256
    pkt = struct.pack('<BBBBB', PROJ_MAGIC, msg_type, seq, 100, aux)
    try:
        # 페어링 후엔 1:1 전송(무선 계층 자동 재전송), 전엔 브로드캐스트
        e.send(watch_mac if watch_mac else BROADCAST, pkt, False)
    except OSError:
        pass


def get_rssi():
    """시계의 최근 수신 신호 세기 (dBm, 없으면 -100)"""
    if watch_mac:
        try:
            return max(-100, min(0, e.peers_table[watch_mac][0]))
        except (KeyError, AttributeError, TypeError):
            pass
    return -100


def poll():
    global last_event
    ev = last_event
    # 즉시 지우지 않고 EVENT_HOLD_MS 동안 유지
    # (센서 데이터는 초당 수십 번 스트리밍되므로, 바로 지우면 허브가 못 읽음)
    if ev and time.ticks_diff(time.ticks_ms(), event_set_ms) > EVENT_HOLD_MS:
        last_event = 0
    link_ok = 1 if time.ticks_diff(time.ticks_ms(), last_seen_ms) < LINK_TIMEOUT_MS else 0
    return (ev, watch_battery, link_ok, get_rssi())


def rstat(status):
    global robot_status, help_request
    prev = robot_status
    robot_status = status
    if status == 0:                  # 상황 종료 → 응급 표시 해제
        help_request = False
    if status == 2 and prev != 2 and voice:
        voice.wake()                 # 도착 순간: 웨이크워드 없이 바로 음성 대기 + 응답음
        print("[음성] 도착 → 자동 웨이크 (바로 명령 가능)")
    send_to_watch(MSG_ROBOT_STAT, status)


def inject_event(mtype):
    """시계(ESP-NOW)든 음성이든 같은 경로로 이벤트 주입"""
    global last_event, event_set_ms, disp_event, alarm_active
    last_event = mtype
    event_set_ms = time.ticks_ms()
    disp_event = mtype
    global help_request
    if mtype in (MSG_FALL, MSG_SOS):
        alarm_active = True
    elif mtype == MSG_CANCEL:
        alarm_active = False
        help_request = False


# ============================================================
#  백업용 스마트폰 웹앱 (시계 고장 대비)
#  - 게이트웨이가 WiFi AP "GUARDIAN" 생성 (비번 guardian1, 채널 1 = ESP-NOW와 동일)
#  - 폰에서 WiFi 접속 후 브라우저로 http://192.168.4.1 접속
#  - 버튼: 로봇 호출(FALL) / SOS / 복귀(CANCEL) / 약 배출(MED)
#  - 이벤트는 시계와 동일한 inject_event() 경로 → 허브 코드 수정 불필요
# ============================================================
import socket

AP_SSID = "GUARDIAN"
AP_PASS = "guardian1"

web_srv = None
try:
    ap = network.WLAN(network.AP_IF)
    ap.active(True)
    # 펌웨어 버전에 따라 설정 문법이 달라 3가지를 순서대로 시도
    _ap_ok = False
    try:
        ap.config(essid=AP_SSID, password=AP_PASS, channel=ESPNOW_CHANNEL,
                  authmode=network.AUTH_WPA_WPA2_PSK)
        _ap_ok = True
    except Exception as ex1:
        print("AP 설정 1차 실패:", ex1)
        try:
            ap.config(ssid=AP_SSID, key=AP_PASS, channel=ESPNOW_CHANNEL)
            _ap_ok = True
        except Exception as ex2:
            print("AP 설정 2차 실패:", ex2)
            try:
                ap.config(essid=AP_SSID, channel=ESPNOW_CHANNEL)   # 개방형(비번 없음)
                _ap_ok = True
                print("※ 개방형 AP로 동작 (비밀번호 없음)")
            except Exception as ex3:
                print("AP 설정 3차 실패:", ex3)
    print("AP 상태:", ap.active(), "IP:", ap.ifconfig()[0] if ap.active() else "-")
    # ★ AP 활성화가 절전 설정을 되돌릴 수 있으므로 두 인터페이스 모두 다시 절전 해제
    #   (절전이 켜지면 ESP-NOW 수신 누락 → WATCH LOST / 지연의 원인)
    for _if in (sta, ap):
        try:
            _if.config(pm=_if.PM_NONE)
        except Exception:
            try:
                _if.config(pm=network.WLAN.PM_NONE)
            except Exception as _pe:
                print("절전 재해제 실패(무시):", _pe)
    if _ap_ok:
        web_srv = socket.socket()
        web_srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        web_srv.bind(('0.0.0.0', 80))
        web_srv.listen(2)
        web_srv.setblocking(False)
        print("웹앱 OK: WiFi 'GUARDIAN' 접속 후 http://" + ap.ifconfig()[0])
except Exception as ex:
    print("웹앱 시작 실패(무시):", ex)
    web_srv = None

WEB_PAGE = """HTTP/1.0 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<!DOCTYPE html>
<html><head><meta name=viewport content="width=device-width,initial-scale=1">
<title>GUARDIAN</title><style>
body{font-family:sans-serif;background:#1E2761;color:#fff;text-align:center;margin:0;padding:14px}
h2{margin:8px 0 2px}small{color:#9fb3c8}
#st{background:#028090;border-radius:10px;padding:8px;margin:10px 0;font-size:15px}
button{width:100%;border:0;border-radius:14px;padding:22px 0;margin:7px 0;
 font-size:22px;font-weight:bold;color:#fff}
.call{background:#F96167}.sos{background:#C00000}
.ret{background:#5a6d90}.med{background:#028090}
</style></head><body>
<h2>GUARDIAN</h2><small>backup remote / 시계 백업용</small>
<div id=st>...</div>
<button class=call onclick="ev(2)">로봇 호출 CALL ROBOT</button>
<button class=sos onclick="ev(3)">SOS 응급</button>
<button class=med onclick="ev(5)">약 배출 MEDICINE</button>
<button class=ret onclick="ev(4)">복귀 RETURN</button>
<script>
function ev(t){fetch('/ev?t='+t).then(st)}
function st(){fetch('/status').then(r=>r.json()).then(j=>{
 document.getElementById('st').innerHTML=
 'WATCH: '+(j.link?'OK':'LOST')+' ('+j.batt+'%) &nbsp; ROBOT: '+j.robot;})}
setInterval(st,1000);st();
</script></body></html>"""


def web_handle():
    """비차단 웹 요청 처리 — 요청이 없으면 즉시 반환"""
    if web_srv is None:
        return
    try:
        conn, _ = web_srv.accept()
    except OSError:
        return                       # 접속 없음 (매 루프 정상 경로)
    try:
        # 타임아웃 짧게: 브라우저가 여는 빈(투기적) 연결이 메인 루프를 오래 잡지 않도록
        conn.settimeout(0.15)
        # 요청 헤더를 끝(\r\n\r\n)까지 전부 읽음 — 안 읽고 닫으면 RST로 응답이 유실됨
        req = b''
        while b'\r\n\r\n' not in req and len(req) < 2048:
            chunk = conn.recv(512)
            if not chunk:
                break
            req += chunk
        line1 = req.decode().split('\r\n', 1)[0]
        if 'favicon' in line1:
            conn.send('HTTP/1.0 404 Not Found\r\n\r\n')
        elif '/ev?t=' in line1:
            t = int(line1.split('/ev?t=')[1].split(' ')[0][:2])
            if t in (MSG_FALL, MSG_SOS, MSG_CANCEL, MSG_MED_TAKEN):
                if t == MSG_SOS and robot_status == 2:
                    globals()['help_request'] = True
                inject_event(t)
                print("[웹앱] 이벤트:", EVENT_NAMES.get(t, t))
            conn.send('HTTP/1.0 200 OK\r\n\r\nok')
        elif '/status' in line1:
            link = 1 if time.ticks_diff(time.ticks_ms(), last_seen_ms) < LINK_TIMEOUT_MS else 0
            conn.send('HTTP/1.0 200 OK\r\nContent-Type: application/json\r\n\r\n'
                      '{"link":%d,"batt":%d,"robot":"%s"}'
                      % (link, watch_battery, ROBOT_NAMES.get(robot_status, "?")))
        else:
            conn.send(WEB_PAGE)
    except Exception:
        pass
    try:
        conn.close()
    except Exception:
        pass


p = PUPRemoteSensor(power=False)
p.add_command('poll',  to_hub_fmt="3Bb")   # (이벤트, 배터리, 연결) + RSSI(부호 있음)
p.add_command('rstat', from_hub_fmt="B")
p.add_command('line',  to_hub_fmt="2bB")   # (위치, 변화량, 모양)
p.add_command('srv',   from_hub_fmt="Bb")  # (서보 번호, 각도 -90~+90)
p.add_command('nav',   to_hub_fmt="2b2B")  # 주행용: (위치, 변화량, 모양, 이벤트)
# ※ 허브 쪽도 같은 순서로 4개 명령을 등록해야 함!

print("Gateway ready")

# ============================================================
#  메인 루프
# ============================================================
last_ui = 0
last_voice = 0
while True:
    # 한 루프에 최대 10개 패킷 처리 (웹/센서 처리로 루프가 느려져도 밀리지 않게)
    for _ in range(10):
        host, msg = e.recv(0)
        if not msg:
            break
        if len(msg) == 5:
            magic, mtype, s, batt, aux = struct.unpack('<BBBBB', msg)
            if magic == PROJ_MAGIC:
                learn_watch(bytes(host))     # 시계 MAC 학습 (1:1 전송용)
                watch_battery = batt
                last_seen_ms = time.ticks_ms()
                if mtype == MSG_HEARTBEAT:
                    print("[HB] batt=%d%%" % batt)
                if mtype in (MSG_FALL, MSG_SOS, MSG_CANCEL, MSG_MED_TAKEN):
                    inject_event(mtype)
                    send_to_watch(MSG_ACK)
                    print("EVENT:", EVENT_NAMES.get(mtype, mtype))

    p.process()

    read_line_sensor()          # 라인센서 값 갱신 (센서 연결 후 동작)

    web_handle()                # 백업 웹앱 요청 처리 (비차단)

    # 음성 명령 확인 (0.1초마다)
    now = time.ticks_ms()
    if voice and time.ticks_diff(now, last_voice) > 100:
        last_voice = now
        cid = voice.get_cmd_id()
        if cid:
            print("VOICE CMD ID:", cid)
            if robot_status != 2:
                print("  (로봇이 도착 상태가 아니므로 음성 명령 무시)")
            elif cid in VOICE_SOS_IDS:
                help_request = True           # OLED에 응급 요청 표시
                inject_event(MSG_SOS)         # 도착 상태 응급 요청 → 긴급 경보
            elif cid in VOICE_MED_IDS:
                inject_event(MSG_MED_TAKEN)   # 도착 상태 약 요청 → 약 배출

    now = time.ticks_ms()
    if time.ticks_diff(now, last_ui) > 500:
        last_ui = now
        link_ok = time.ticks_diff(now, last_seen_ms) < LINK_TIMEOUT_MS
        ui_update(link_ok, watch_battery, disp_event, robot_status, alarm_active)

    time.sleep_ms(5)
