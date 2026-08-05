#!/usr/bin/env python3
"""Create an English version of the BOM/pricing workbook, preserving styles and formulas."""
import openpyxl

SRC = '부품원가표_판매가산정_지킴이.xlsx'
DST = 'BOM_Pricing_GUARDIAN_EN.xlsx'

SHEETS = {
    '프로토타입 BOM': 'Prototype BOM',
    '양산 원가 추정': 'Production Cost',
    '판매가 시나리오': 'Pricing Scenarios',
}

T = {
    # Prototype BOM
    '지킴이(GUARDIAN) 프로토타입 부품 원가표': 'GUARDIAN Prototype Bill of Materials (BOM)',
    '파란 글씨 = 직접 입력한 단가(구매가 기준 추정). 환율 1,350원/$ 가정.': 'Blue text = unit prices entered directly (estimated from purchase prices).',
    '구분': 'Category', '부품명': 'Part', '수량': 'Qty', '단가(USD)': 'Unit (USD)', '금액(USD)': 'Amount (USD)', '비고': 'Notes',
    '시계': 'Watch', '로봇': 'Robot', '공통': 'Common',
    '보드+화면+IMU+터치 일체': 'Board + LCD + IMU + touch in one',
    '리포 배터리 500mAh': 'LiPo battery 500mAh',
    '케이스(3D프린트)+스트랩': 'Case (3D printed) + strap',
    'STL 출력': '3D-printed STL',
    'LMS-ESP32 v2 (게이트웨이)': 'LMS-ESP32 v2 (gateway)',
    '8채널 라인센서 (LMS-Line-Sensor)': '8-ch line sensor (LMS-Line-Sensor)',
    'Qwiic 연결': 'Qwiic connection',
    '음성인식 SEN0539': 'Voice recognition SEN0539',
    '한/영/일 자가학습': 'Self-learning KO/EN/JA',
    '상태 표시': 'Status display',
    '서보 SG90 + 디스펜서 기구': 'Servo SG90 + dispenser mechanism',
    '약 배출': 'Medicine dispensing',
    '옴니휠 3개': 'Omni wheels x3',
    '개당 $6': '$6 each',
    'LEGO SPIKE Prime 세트': 'LEGO SPIKE Prime set',
    '보유 장비 (모터·허브·초음파)': 'Owned equipment (motors, hub, ultrasonic)',
    '18650x2 파워뱅크': '18650x2 power bank',
    '외부 전원 5V': 'External 5V power',
    '케이블·점퍼·기구물': 'Cables, jumpers, hardware',
    '프로토타입 총 원가': 'Prototype total cost',
    'RoboRAVE 규정 상한': 'RoboRAVE cost limit',
    '상한 대비 여유': 'Headroom vs limit',
    # Production cost
    '양산(1만 대 기준) 원가 추정': 'Production Cost Estimate (at 10,000 units)',
    'LEGO·개발보드 대신 전용 PCB/섀시 설계 가정. 파란 글씨 = 추정 입력값.': 'Assumes dedicated PCB/chassis replacing LEGO & dev boards. Blue text = estimated inputs.',
    '제품': 'Product', '항목': 'Item', '원가(USD)': 'Cost (USD)', '근거': 'Basis',
    '전용 PCB (ESP32-S3+IMU+LCD)': 'Dedicated PCB (ESP32-S3 + IMU + LCD)',
    '개발보드 → 양산 PCB 전환': 'Dev board → production PCB',
    '배터리·케이스·스트랩': 'Battery, case, strap',
    '조립·검사': 'Assembly & testing',
    '제어 PCB (ESP32+센서 통합)': 'Control PCB (ESP32 + integrated sensors)',
    '게이트웨이+라인센서+음성 통합': 'Gateway + line sensor + voice integrated',
    '모터 3개+옴니휠+섀시': '3 motors + omni wheels + chassis',
    'DC기어모터로 대체': 'Replaced with DC gear motors',
    '초음파·서보·스피커·배터리': 'Ultrasonic, servo, speaker, battery',
    '조립·검사·포장': 'Assembly, testing, packaging',
    '시계 원가 소계': 'Watch cost subtotal',
    '로봇 원가 소계': 'Robot cost subtotal',
    '세트 원가 합계': 'Set cost total',
    # Pricing scenarios
    '판매가·마진 시나리오': 'Price & Margin Scenarios',
    '노란 셀 = 판매가 입력(변경 시 자동 재계산). 세트 원가는 양산 시트 참조.': 'Yellow cells = price inputs (auto-recalculates). Set cost linked to the Production Cost sheet.',
    '시나리오': 'Scenario', '판매가(USD)': 'Price (USD)', '마진(USD)': 'Margin (USD)', '마진율': 'Margin %',
    '세트 (시계+로봇)': 'Set (watch + robot)',
    '출시가': 'Launch price',
    '시계 단품': 'Watch only',
    '부부용 추가 구매': 'Extra watch for couples',
    'B2G 대량 (1,000대+)': 'B2G bulk (1,000+ units)',
    '지자체 보급 사업 할인': 'Government program discount',
    '구독 수익 (보호자 알림)': 'Subscription Revenue (family alerts)',
    '월 구독료': 'Monthly fee',
    '가입 1,000가구 시 연 수익': 'Annual revenue at 1,000 households',
}

wb = openpyxl.load_workbook(SRC)

# Rename sheets
for ko, en in SHEETS.items():
    wb[ko].title = en

missing = set()
for ws in wb.worksheets:
    for row in ws.iter_rows():
        for c in row:
            v = c.value
            if not isinstance(v, str):
                continue
            if v.startswith('='):
                f = v
                for ko, en in SHEETS.items():
                    f = f.replace(ko, en)
                f = f.replace('"시계"', '"Watch"').replace('"로봇"', '"Robot"')
                c.value = f
            else:
                if v in T:
                    c.value = T[v]
                elif any('가' <= ch <= '힣' for ch in v):
                    missing.add(v)

if missing:
    print('UNTRANSLATED:', missing)
wb.save(DST)
print('saved', DST)
