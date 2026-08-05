# ============================================================
#  라인센서 RAW 값 진단 (Thonny에서 실행)
#
#  목적: PET 매트의 검은 라인이 IR 눈에 보이는지 확인
#
#  사용법:
#   1) 실행하면 8채널 원시(raw) 값이 계속 출력됨
#   2) 센서를 [흰 배경] 위에 3초 → [검은 라인] 위에 3초 번갈아 놓기
#   3) 두 상태의 숫자가 거의 같으면 → 잉크가 IR에 안 보이는 것 (인쇄 문제)
#      두 상태가 크게 다르면 → 센서 높이/캘리브레이션 문제 (해결 가능)
# ============================================================
from line_sensor import LineSensorI2C
import time

sen = LineSensorI2C(scl_pin=4, sda_pin=5, device_addr=51)
sen.ir_power(True)
sen.mode_raw()

print("RAW 모드 — 센서를 흰 배경 / 검은 라인에 번갈아 대보세요 (30초)")
t0 = time.ticks_ms()
while time.ticks_diff(time.ticks_ms(), t0) < 30000:
    v = sen.sensors()
    avg = sum(v) // len(v)
    print("raw:", list(v), " 평균:", avg)
    time.sleep_ms(300)
print("완료")
print("판정: 흰 배경 평균과 검은 라인 평균의 차이가 40 이상이면 정상,")
print("      10 이하면 잉크가 IR을 반사하지 못하는 것(인쇄 잉크 문제)입니다.")
