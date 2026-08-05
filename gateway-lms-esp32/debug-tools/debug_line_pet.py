# ============================================================
#  PET 매트 전용 라인센서 캘리브레이션 + 값 추출 (Thonny에서 실행)
#
#  사용법:
#   1) 로봇(센서)을 PET 매트의 검은 라인 근처에 놓는다
#   2) 이 스크립트 실행 → 6초 동안 센서를 라인 위-옆-위-옆으로
#      천천히 좌우로 움직여 8개 채널이 모두 검정/흰색을 보게 한다
#   3) 출력되는 LINE_CAL_MIN / LINE_CAL_MAX 두 줄을 복사해서
#      main.py(lms_gateway_ssd1306.py) 상단의 같은 이름 자리에 붙여넣는다
#   4) 이어지는 20초 라이브 뷰에서 위치/모양이 잘 나오는지 확인
# ============================================================
from line_sensor import LineSensorI2C
import time

sen = LineSensorI2C(scl_pin=4, sda_pin=5, device_addr=51)
sen.ir_power(True)

print("")
print("=== PET 매트 캘리브레이션 시작 (12초) ===")
print("★ 아주 천천히! 라인이 센서 8칸을 왼쪽부터 오른쪽까지 순서대로")
print("  지나가게 하되, 각 위치에서 1초씩 멈췄다 가세요.")
print("  (12초 동안 왕복 1번이면 충분합니다)")
for i in (3, 2, 1):
    print(i, "...")
    time.sleep(1)

sen.calibrate(12)         # 12초 캘리브레이션 + EEPROM 저장

mn = tuple(sen.get_min())
mx = tuple(sen.get_max())

print("")
print("=== 추출된 캘리브레이션 값 (아래 두 줄을 main.py에 복사) ===")
print("LINE_CAL_MIN =", mn)
print("LINE_CAL_MAX =", mx)
print("")

# 채널별 대비(콘트라스트) 품질 검사
# PET 매트 실측: 배경 raw 약 14, 라인 위 약 60~160 → 대비 30 이상이면 사용 가능
diffs = [b - a for a, b in zip(mn, mx)]
print("채널별 대비:", diffs)
bad = [i for i, d in enumerate(diffs) if d < 30]
if bad:
    print("!! 주의: 채널", bad, "의 대비가 약합니다 (<30).")
    print("   해당 채널 위에서 라인에 1초 이상 멈추지 않았을 가능성이 큽니다.")
    print("   다시 실행하거나, 그래도 안 되면 main.py에 아래 수동값을 쓰세요:")
    print("   LINE_CAL_MIN = (13, 13, 13, 13, 13, 13, 13, 13)")
    print("   LINE_CAL_MAX = (60, 60, 60, 60, 60, 60, 60, 60)")
    print("   (라인 위 값이 60을 넘으면 전부 '완전 검정'으로 처리되므로 안전)")
else:
    print("대비 양호 — 모든 채널 30 이상")

print("")
print("=== 20초 라이브 뷰 (라인 위에서 움직여 보세요) ===")
sen.mode_calibrated()
t0 = time.ticks_ms()
while time.ticks_diff(time.ticks_ms(), t0) < 20000:
    p, d, s = sen.position_derivative_shape()
    ch = s if isinstance(s, str) else chr(s)
    bar = [' '] * 21
    idx = max(0, min(20, (p + 128) * 21 // 256))
    bar[idx] = '#'
    print("pos=%4d  deriv=%4d  shape=%s  [%s]" % (p, d, ch, ''.join(bar)))
    time.sleep_ms(200)
print("완료. 위 LINE_CAL_MIN/MAX 두 줄을 main.py에 붙여넣으세요.")
