# ============================================================
#  백업 웹앱 단독 테스트 (Thonny에서 실행)
#  - 게이트웨이의 다른 기능 없이 AP + 웹서버만 띄워서 원인 분리
#  - 실행 후 출력을 보고: AP가 뜨는지 / 폰이 붙는지 / 요청이 오는지 확인
# ============================================================
import network
import socket
import time

AP_SSID = "GUARDIAN"
AP_PASS = "guardian1"

ap = network.WLAN(network.AP_IF)
ap.active(True)

print("--- AP 설정 시도 ---")
try:
    ap.config(essid=AP_SSID, password=AP_PASS, channel=1,
              authmode=network.AUTH_WPA_WPA2_PSK)
    print("1차(essid/password/authmode) 성공")
except Exception as e1:
    print("1차 실패:", repr(e1))
    try:
        ap.config(ssid=AP_SSID, key=AP_PASS, channel=1)
        print("2차(ssid/key) 성공")
    except Exception as e2:
        print("2차 실패:", repr(e2))
        ap.config(essid=AP_SSID, channel=1)
        print("3차(개방형, 비번 없음) 성공")

time.sleep(1)
print("AP active:", ap.active())
print("AP ifconfig:", ap.ifconfig())

s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(('0.0.0.0', 80))
s.listen(2)
s.setblocking(False)
print("웹서버 대기 중... 폰에서 WiFi 'GUARDIAN' 접속 후 http://192.168.4.1 열기")
print("(폰이 접속하면 station connected, 페이지를 열면 REQ 로그가 찍힘)")

PAGE = ("HTTP/1.0 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n"
        "<html><body style='font-size:40px;text-align:center;padding-top:80px'>"
        "GUARDIAN TEST OK</body></html>")

last = 0
while True:
    now = time.ticks_ms()
    if time.ticks_diff(now, last) > 3000:
        last = now
        try:
            n = len(ap.status('stations'))
        except Exception:
            n = '?'
        print("접속된 기기 수:", n)
    try:
        conn, addr = s.accept()
    except OSError:
        time.sleep_ms(50)
        continue
    try:
        conn.settimeout(1.0)
        # 요청 헤더를 끝(\r\n\r\n)까지 전부 읽음 — 안 읽고 닫으면 RST로 응답이 유실됨
        req = b''
        while b'\r\n\r\n' not in req and len(req) < 2048:
            chunk = conn.recv(512)
            if not chunk:
                break
            req += chunk
        line1 = req.decode().split('\r\n', 1)[0]
        print("REQ from", addr, ":", line1)
        if 'favicon' in line1:
            conn.send('HTTP/1.0 404 Not Found\r\n\r\n')
        else:
            conn.send(PAGE)
    except Exception as ex:
        print("요청 처리 오류:", ex)
    try:
        conn.close()
    except Exception:
        pass
