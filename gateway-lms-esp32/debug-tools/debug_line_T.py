# ============================================================
#  T자 인식 진단 (Thonny에서 실행)
#
#  사용법:
#   1) 실행 후 로봇을 손으로 잡고, 스테이션 T자를 향해
#      실제 주행처럼 천천히 밀면서 T 바를 통과시킨다 (여러 번)
#   2) 출력에서 T 바 위에 있을 때:
#      - dark(검정 채널 수)가 6~8까지 올라가는지
#      - shape가 'T'로 바뀌는지
#   3) dark는 올라가는데 shape가 'T'가 안 되면 → 임계값 문제
#      아래 THRESHOLD 값을 90으로 바꿔 다시 실행해 보세요
# ============================================================
from line_sensor import LineSensorI2C
import time

# PET 매트 캘리브레이션 (main.py와 동일)
LINE_CAL_MIN = (13, 13, 13, 14, 13, 13, 14, 14)
LINE_CAL_MAX = (60, 50, 101, 147, 129, 69, 96, 118)

THRESHOLD = None    # None = 기본값 사용. 'T'가 안 나오면 90, 그래도 안 되면 70으로

sen = LineSensorI2C(scl_pin=4, sda_pin=5, device_addr=51)
sen.ir_power(True)
time.sleep_ms(100)
sen.set_calibration(LINE_CAL_MIN, LINE_CAL_MAX)
time.sleep_ms(300)                    # 값 기록 직후 센서가 바쁨 — 대기 필수
if THRESHOLD is not None:
    sen.set_shape_threshold_black(THRESHOLD)
    time.sleep_ms(200)
    print("shape 임계값을", THRESHOLD, "로 설정")

# mode_calibrated는 타임아웃이 나도 3회 재시도
for _try in range(3):
    try:
        sen.mode_calibrated()
        break
    except OSError as ex:
        print("mode_calibrated 재시도", _try + 1, ":", ex)
        time.sleep_ms(300)

print("")
print("=== 30초: 로봇을 T 바 위로 천천히 통과시키세요 ===")
t0 = time.ticks_ms()
seen_T = 0
while time.ticks_diff(time.ticks_ms(), t0) < 30000:
    v = list(sen.sensors())          # 보정된 8채널 값 (255=완전 검정)
    p, d, s = sen.position_derivative_shape()
    ch = s if isinstance(s, str) else chr(s)
    dark = sum(1 for x in v if x > 128)
    if ch == 'T':
        seen_T += 1
    print("cal:", ["%3d" % x for x in v], " dark=%d  pos=%4d  shape=%s" % (dark, p, ch))
    time.sleep_ms(150)
print("")
print("완료 — 'T' 판정 횟수:", seen_T)
if seen_T == 0:
    print("→ shape가 'T'로 한 번도 안 나왔습니다.")
    print("  dark가 6 이상까지 올라갔다면: THRESHOLD=90으로 바꿔 재실행")
    print("  dark도 안 올라갔다면: cal 값 로그를 복사해서 보내주세요")
