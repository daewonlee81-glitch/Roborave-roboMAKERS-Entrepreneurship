# ============================================================
#  SEN0539 (DFRobot 음성인식) 연결 테스트
#
#  ▶ 모듈 준비:
#     - 모듈의 전환 스위치를 "I2C" 모드로! (UART 아님)
#
#  ▶ 배선 (SEN0539 → LMS-ESP32):
#     VCC(빨강) → 3V3        GND(검정) → GND
#     D/SDA     → GPIO13     C/SCL     → GPIO14
#     ※ 케이블 색이 아니라 모듈에 인쇄된 D(데이터)/C(클럭) 표시 기준으로 연결
#     ※ OLED(SSD1306)와 같은 버스에 병렬 연결 가능 (주소가 다름: 0x3C / 0x64)
#     ※ 만약 GC9A01 화면을 쓰는 중이면 13/14는 SPI가 사용하므로
#        아래 SDA_PIN/SCL_PIN을 남는 핀 번호로 바꾸세요
#
#  실행(F5) 후: "Hello robot" (웨이크워드) → 명령을 말하면
#  셸에 명령 ID가 출력됩니다
# ============================================================
SDA_PIN = 26    # SEN0539의 D 핀
SCL_PIN = 27    # SEN0539의 C 핀

print("STEP 1: 시작")
from machine import SoftI2C, Pin
import time

i2c = SoftI2C(sda=Pin(SDA_PIN), scl=Pin(SCL_PIN), freq=100000)
found = i2c.scan()
print("STEP 2: I2C 스캔:", [hex(a) for a in found])

if 0x64 not in found:
    print("!! 0x64가 안 보입니다. 확인할 것:")
    print("   1) 모듈 스위치가 I2C 모드인지")
    print("   2) D→GPIO%d, C→GPIO%d 배선이 맞는지" % (SDA_PIN, SCL_PIN))
    print("   3) 전원(3V3/GND) 연결")
    raise SystemExit

ADDR = 0x64
REG_CMDID, REG_PLAY, REG_MUTE, REG_VOLUME, REG_WAKE = 0x02, 0x03, 0x04, 0x05, 0x06

i2c.writeto_mem(ADDR, REG_VOLUME, bytes([5]))   # 볼륨 1~7
i2c.writeto_mem(ADDR, REG_WAKE, bytes([20]))    # 웨이크 유지 20초
print("STEP 3: 설정 OK (볼륨 5, 웨이크 20초)")
print("=" * 45)
print("이제 모듈에 대고 말해 보세요:")
print('  1) 웨이크워드: "Hello robot"  (응답음이 남)')
print("  2) 이어서 명령어를 말하면 아래에 ID가 찍힘")
print("     (학습시킨 한국어 명령은 ID 5~21)")
print("=" * 45)

while True:
    cid = i2c.readfrom_mem(ADDR, REG_CMDID, 1)[0]
    if cid != 0:
        print("★ 인식됨! 명령 ID =", cid)
    time.sleep_ms(80)
