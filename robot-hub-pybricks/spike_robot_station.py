# ============================================================
#  옴니휠 출동 도우미 로봇 — 스테이션 왕복 최종본 (Pybricks)
#
#  동작 흐름:
#   1) 로봇 스테이션에서 대기 (초록불)
#   2) 시계 호출 → 라인트레이싱으로 사용자에게 접근
#   3) B포트 초음파로 사용자 감지 → 가까이(25cm)에서 정지 = 도착
#   4) 귀환 버튼/취소 → 헤딩 180도 회전 → 오른쪽 회전 라인 찾기 → 복귀
#      (복귀 시작과 동시에 음성인식 OFF)
#   5) 스테이션 T자 또는 초음파 근접 감지 → 정지 → 헤딩 180도 회전 → 대기
#
#  ※ 매트: 라인 양쪽 끝에 T자 (스테이션 쪽 + 침대 쪽)
#  ※ 시계의 길게 터치(CANCEL)도 귀환 버튼과 동일하게 동작
# ============================================================
from pybricks.hubs import PrimeHub
from pybricks.pupdevices import Motor, UltrasonicSensor
from pybricks.parameters import Port, Color, Button
from pybricks.tools import wait, StopWatch
from umath import cos, pi
from pupremote_hub import PUPRemoteHub

EV_NONE, EV_FALL, EV_SOS, EV_CANCEL, EV_MED = 0, 2, 3, 4, 5
ST_IDLE, ST_DISPATCH, ST_ARRIVED, ST_RETURN = 0, 1, 2, 1   # 복귀도 시계엔 '출동중'으로 표시

# ---------- 조정 값 ----------
BASE_SPEED    = 350     # 라인 주행 속도
KP, KD        = 2.5, 0.3   # 주행 테스트로 확정한 값
USER_STOP_MM  = 150     # 사용자 앞 정지 거리 (B포트 초음파)
LOST_LIMIT    = 15
FOLLOW_TIMEOUT = 30000
IGNORE_T_MS   = 2500    # 출발 직후 T자 무시 시간 (출발점 T 위에서 시작하므로)
TURN_SPEED    = 300     # 180도 회전 속도 (헤딩 기준)
SEARCH_SPIN   = 150     # 라인 찾기 회전 속도 (느리게 = 정확하게)
SEARCH_DIR    = -1      # 라인 찾기 회전 방향: 오른쪽. (반대로 돌면 1 로 바꾸세요)
SPIN_TIMEOUT  = 5000    # 라인 찾기 회전 최대 시간
STATION_STOP_MM = 120   # 복귀 시 전방 초음파 근접 정지 거리 (스테이션 구조물)

hub = PrimeHub()

motorA = Motor(Port.A)
motorC = Motor(Port.C)
motorE = Motor(Port.E)
WHEEL_ANGLES = [45, 180, 315]   # A=45도, C=180도, E=-45도(315)
MOTORS = [motorA, motorC, motorE]
DIR    = [-1, -1, -1]

us_front = UltrasonicSensor(Port.B)     # 사용자 감지 (전방)

gw = PUPRemoteHub(Port.D)
gw.add_command('poll',  to_hub_fmt="3Bb")
gw.add_command('rstat', from_hub_fmt="B")
gw.add_command('line',  to_hub_fmt="2bB")
gw.add_command('srv',   from_hub_fmt="Bb")
gw.add_command('nav',   to_hub_fmt="2b2B")   # 주행용 통합 (게이트웨이와 순서 일치!)

last_ev = EV_NONE


def drive(move_deg, speed=BASE_SPEED, spin=0):
    for m, ang, d in zip(MOTORS, WHEEL_ANGLES, DIR):
        v = speed * cos((move_deg - (ang + 90)) * pi / 180) + spin
        try:
            m.run(d * v)
        except OSError:
            pass


def stop_all():
    for m in MOTORS:
        try:
            m.stop()
        except OSError:
            pass


def read_front():
    try:
        return us_front.distance()
    except OSError:
        return 2000


def poll_once():
    global last_ev
    ev, batt, link, rssi = gw.call('poll', wait_ms=5)
    if ev != EV_NONE:
        last_ev = ev
    return rssi


def alarm(times=3):
    for _ in range(times):
        hub.speaker.beep(1500, 200)
        wait(100)


def norm_angle(a):
    """각도를 -180~180 범위로 정규화"""
    while a > 180:
        a -= 360
    while a < -180:
        a += 360
    return a


def rotate_180():
    """IMU 헤딩 기준 정확히 180도 제자리 회전"""
    start = hub.imu.heading()
    t = StopWatch()
    drive(0, 0, TURN_SPEED)
    while t.time() < 5000:
        delta = abs(norm_angle(hub.imu.heading() - start))
        if delta >= 176:
            break
        wait(10)
    stop_all()
    wait(300)


def rotate_search_line():
    """오른쪽으로 천천히 회전하며 라인을 찾아 정렬 (180도 회전 직후 미세 보정용).
    이미 라인이 센서 중앙 근처면 즉시 멈춘다."""
    t = StopWatch()
    good = 0
    drive(0, 0, SEARCH_DIR * SEARCH_SPIN)
    while t.time() < SPIN_TIMEOUT:
        pos, deriv, shape_code, ev = gw.call('nav', wait_ms=5)
        if chr(shape_code) != ' ' and abs(pos) < 35:
            good += 1
            if good >= 2:
                print("라인 정렬 완료 (pos=%d, %.1f초)" % (pos, t.time() / 1000))
                break
        else:
            good = 0
        wait(15)
    else:
        print("라인 찾기 시간 초과 - 현 방향에서 진행")
    stop_all()
    wait(200)


def follow_line(stop_by_ultrasonic):
    """라인트레이싱 주행.
    stop_by_ultrasonic=True : 사용자 감지(초음파)로 정지 (출동)
    stop_by_ultrasonic=False: T자 또는 초음파 근접(스테이션 구조물)으로 정지 (복귀)
    반환: 'arrived' / 'cancel'
    """
    global last_ev
    t = StopWatch()
    lost = 0

    while t.time() < FOLLOW_TIMEOUT:
        # 출동: 사용자 가까이(초음파) → 정지
        if stop_by_ultrasonic and read_front() < USER_STOP_MM:
            stop_all()
            print("사용자 감지 - 정지 (%dmm)" % read_front())
            return 'arrived'

        # 복귀: 스테이션 구조물 근접(초음파) → 도착
        if (not stop_by_ultrasonic) and t.time() > IGNORE_T_MS and read_front() < STATION_STOP_MM:
            stop_all()
            print("스테이션 근접 감지 - 정지 (%dmm)" % read_front())
            return 'arrived'

        # nav 한 번으로 라인 데이터 + 이벤트 수신 (모드 전환 없음 = 지연 없음)
        pos, deriv, shape_code, ev = gw.call('nav', wait_ms=5)
        if ev == EV_CANCEL and stop_by_ultrasonic:
            stop_all()
            return 'cancel'
        shape = chr(shape_code)

        # T자 정지 (출발 직후는 무시 - 출발점 T 위에서 시작하므로)
        if shape == 'T' and t.time() > IGNORE_T_MS:
            stop_all()
            print("T자 감지 - 정지")
            return 'arrived'

        if shape == ' ':
            lost += 1
            if lost > LOST_LIMIT:
                stop_all()
                print("라인 이탈 - 현재 위치 정지")
                return 'arrived'
            drive(0, BASE_SPEED // 2, 0)
            wait(30)
            continue

        lost = 0
        correction = KP * pos + KD * deriv
        drive(0, BASE_SPEED, correction)
        wait(20)

    stop_all()
    print("시간 초과 - 정지")
    return 'arrived'


def dispense_medicine():
    """약 디스펜서: 서보 0 → -90 → 0 으로 약 배출"""
    print("약 배출")
    gw.call('srv', 0, -90)
    wait(500)
    gw.call('srv', 0, 0)
    wait(300)


def return_to_station():
    """[사용자 앞] 헤딩 180도 회전 → 오른쪽 회전 라인 찾기 → 라인 복귀
       → [스테이션] T자 또는 초음파 근접 정지 → 헤딩 180도 회전 → 대기
       복귀 시작과 동시에 음성인식은 무시됨 (rstat=1 → 게이트웨이가 차단)"""
    hub.light.on(Color.BLUE)
    gw.call('rstat', 1)                     # 이동중 상태 → 음성 명령 OFF
    print("귀환 시작: 헤딩 180도 회전")
    rotate_180()
    print("오른쪽 회전으로 라인 찾기")
    rotate_search_line()
    print("스테이션으로 복귀 중...")
    follow_line(stop_by_ultrasonic=False)   # T자 또는 초음파 근접에서 정지
    print("스테이션 도착: 헤딩 180도 회전 후 대기")
    rotate_180()
    hub.speaker.beep(1000, 300)


# ---------- 메인 ----------
state = ST_IDLE
gw.call('rstat', 0)
hub.light.on(Color.GREEN)
print("로봇 스테이션 대기 중")

while True:
    poll_once()
    ev = last_ev
    last_ev = EV_NONE

    if ev != EV_NONE:
        print("이벤트:", ev, "| 상태:", state)

    # ---------- 호출 → 출동 (시계에서만) ----------
    if ev in (EV_FALL, EV_SOS) and state == ST_IDLE:
        state = ST_DISPATCH
        gw.call('rstat', 1)                 # 시계: "출동중"
        hub.light.on(Color.RED)
        hub.display.char("!")
        alarm(3)
        result = follow_line(stop_by_ultrasonic=True)
        if result == 'arrived':
            state = ST_ARRIVED
            gw.call('rstat', 2)             # 시계: "도착"
            alarm(2)
            hub.display.char("V")
            # 약 배출은 음성 요청("약 주세요" 등) 시에만 동작
        else:                               # 주행 중 취소 → 즉시 귀환
            return_to_station()
            state = ST_IDLE
            gw.call('rstat', 0)
            hub.light.on(Color.GREEN)
            hub.display.off()

    # ---------- 도착 상태에서 음성 응급 요청 → 긴급 경보 ----------
    elif ev == EV_SOS and state == ST_ARRIVED:
        print("긴급 경보! (음성 응급 요청)")
        hub.light.on(Color.RED)
        hub.display.char("S")               # LED 매트릭스: SOS 표시
        for _ in range(6):                  # 사이렌 (보호자 호출)
            hub.speaker.beep(2000, 250)
            wait(80)
            hub.speaker.beep(1200, 250)
            wait(80)
        hub.display.text("SOS")             # S-O-S 스크롤
        hub.display.char("!")               # 이후 ! 유지
        hub.light.on(Color.ORANGE)

    elif ev in (EV_FALL, EV_SOS) and state != ST_IDLE:
        hub.speaker.beep(500, 100)

    # ---------- 시계 취소 → 귀환 ----------
    elif ev == EV_CANCEL and state == ST_ARRIVED:
        return_to_station()
        state = ST_IDLE
        gw.call('rstat', 0)
        hub.light.on(Color.GREEN)
        hub.display.off()

    elif ev == EV_MED:
        hub.speaker.beep(800, 100)
        if state == ST_ARRIVED:             # 도착 상태에서 약 추가 요청 시
            dispense_medicine()

    # ---------- 귀환 버튼 (허브 중앙 버튼) ----------
    if state == ST_ARRIVED and Button.CENTER in hub.buttons.pressed():
        while Button.CENTER in hub.buttons.pressed():
            wait(50)                        # 버튼에서 손 뗄 때까지
        return_to_station()
        state = ST_IDLE
        gw.call('rstat', 0)
        hub.light.on(Color.GREEN)
        hub.display.off()

    if state == ST_IDLE:
        hub.light.on(Color.GREEN)

    wait(100)
