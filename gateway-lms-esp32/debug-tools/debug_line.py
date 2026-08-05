# ============================================================
#  8채널 라인센서 테스트 (LMS-ESP32, Thonny에서 F5 실행)
#
#  ▶ 준비:
#    1) line_sensor.py 를 보드에 업로드 (Save as > MicroPython device)
#       ※ 이미 펌웨어에 내장되어 있으면 업로드 없이도 동작
#    2) 라인센서를 Qwiic 케이블로 LMS-ESP32의 Qwiic 포트에 연결
#
#  ▶ 순서:
#    1) 실행하면 센서 연결 확인
#    2) "지금 캘리브레이션" 이 뜨면 5초 동안 센서를 검은 라인 위에서
#       좌우로 왔다갔다 움직여 주세요 (흰 바닥과 검은 라인을 모두 보게)
#    3) 이후 위치값이 실시간 출력됩니다:
#       라인이 센서 중앙 = 0, 왼쪽 = 음수, 오른쪽 = 양수
# ============================================================
from time import sleep
from line_sensor import LineSensorI2C

print("STEP 1: 센서 연결 중... (Qwiic: SCL=4, SDA=5, 주소 51)")
sensor = LineSensorI2C(scl_pin=4, sda_pin=5, device_addr=51)
print("STEP 2: 연결 OK")

sensor.ir_power(True)          # IR 발광 켜기
print("STEP 3: IR 켜짐")

print("=" * 45)
print("지금 캘리브레이션! 5초간 센서를 라인 위에서")
print("좌우로 움직여 주세요 (흰 바닥 + 검은 라인 모두)")
print("=" * 45)
sensor.calibrate(duration=5)   # 자동 저장(EEPROM)됨
print("STEP 4: 캘리브레이션 완료 (EEPROM 저장)")

sensor.mode_calibrated()
print("STEP 5: 측정 시작 - 센서를 라인 위에 올려보세요")
print("  위치(-128~127, 0=중앙) | 변화량 | 모양")

while True:
    pos, deriv, shape = sensor.position_derivative_shape()
    bar = " " * ((pos + 128) // 8) + "#"     # 위치를 막대로 시각화
    print("%5d | %4d | %s | %s" % (pos, deriv, chr(shape) if isinstance(shape, int) else shape, bar))
    sleep(0.15)
