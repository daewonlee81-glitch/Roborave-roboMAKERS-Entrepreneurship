# ============================================================
#  서보 모터 테스트 v2 (LMS-ESP32, Thonny에서 F5 실행)
#
#  각도 기준: 0도 = 중앙, -90도 ~ +90도
#  동작: 0도 → -90도 → 0도 (빠르게)
#
#  배선: 신호=GPIO21, 전원=파워뱅크 5V, GND=보드와 공통
# ============================================================
from machine import Pin, PWM
import time

SERVO_PIN = 21

servo = PWM(Pin(SERVO_PIN), freq=50)

def angle(deg):
    """deg: -90(한쪽 끝) ~ 0(중앙) ~ +90(반대쪽 끝)"""
    deg = max(-90, min(90, deg))
    us = 1500 + deg * 1000 // 90          # -90=500us, 0=1500us, +90=2500us
    servo.duty_u16(us * 65535 // 20000)
    print("서보 →", deg, "도 (펄스", us, "us)")

print("STEP 1: 0도(중앙)")
angle(0)
time.sleep(0.6)

print("STEP 2: -90도")
angle(-90)
time.sleep(0.6)

print("STEP 3: 0도(중앙)")
angle(0)
time.sleep(0.5)

print("완료.")
# 참고:
#  - 서보 자체의 회전 속도는 하드웨어 최고 속도로 동작합니다.
#    (0.6초 안에 못 따라가면 time.sleep 값을 0.8로 늘려주세요)
#  - -90도에서 끝에 걸려 드르륵 소리가 나면 1000 을 900 으로 줄여보세요
