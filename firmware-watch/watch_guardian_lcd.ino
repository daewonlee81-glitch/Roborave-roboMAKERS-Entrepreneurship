/*
 * ============================================================
 *  지킴이 워치 - LCD 화면 표시 버전
 *  보드: Waveshare ESP32-S3-Touch-LCD-1.69
 *  Arduino IDE: ESP32S3 Dev Module, esp32 코어 3.x, USB CDC On Boot: Enabled
 *
 *  ▶ 필요한 라이브러리 (딱 1개):
 *    라이브러리 매니저에서 "GFX Library for Arduino" 검색 → 설치
 *    (제작자: moononournation, Arduino_GFX)
 *    ※ U8g2는 필요 없음 (영문 표시 버전)
 *
 *  ▶ 화면 구성 (색상으로 상태를 알 수 있게):
 *    - 평상시: 검정 바탕 + 녹색 OK + 배터리 %
 *    - 낙상 카운트다운: 노란 바탕 + 초대형 남은 초 + TOUCH=CANCEL
 *    - 경보 발신: 빨간 바탕 + SOS SENT + 로봇 상태(COMING/ARRIVED)
 *
 *  터치 또는 BOOT 버튼(GPIO0)으로 취소/SOS 가능
 * ============================================================
 */

#include <WiFi.h>
#include <esp_now.h>
#include <Wire.h>
#include <math.h>
#include <Arduino_GFX_Library.h>

// ---------------- 색상 정의 (RGB565) ----------------
// Arduino_GFX 1.5+ 에서 BLACK 등 짧은 이름이 제거되어 직접 정의
#ifndef BLACK
#define BLACK    0x0000
#endif
#ifndef WHITE
#define WHITE    0xFFFF
#endif
#ifndef RED
#define RED      0xF800
#endif
#ifndef GREEN
#define GREEN    0x07E0
#endif
#ifndef CYAN
#define CYAN     0x07FF
#endif
#ifndef YELLOW
#define YELLOW   0xFFE0
#endif
#ifndef DARKGREY
#define DARKGREY 0x7BEF
#endif
#ifndef ORANGE
#define ORANGE   0xFD20
#endif

// ---------------- 핀 정의 ----------------
#define I2C_SDA     11
#define I2C_SCL     10
#define BAT_ADC_PIN 1
#define SYS_EN_PIN  41     // 전원 래치 — HIGH 유지해야 배터리 단독 구동 가능
#define SYS_OUT_PIN 40     // PWR 버튼 상태 입력
#define BOOT_BTN    0
#define BUZZER_PIN  42     // 소리 안 나면 33으로

#define LCD_DC      4
#define LCD_CS      5
#define LCD_SCK     6
#define LCD_MOSI    7
#define LCD_RST     8
#define LCD_BL      15

#define QMI8658_ADDR 0x6B
#define CST816_ADDR  0x15

// ---------------- LCD (ST7789V2 240x280, 세로 오프셋 20) ----------------
Arduino_DataBus *bus = new Arduino_ESP32SPI(LCD_DC, LCD_CS, LCD_SCK, LCD_MOSI, GFX_NOT_DEFINED);
Arduino_GFX *gfx = new Arduino_ST7789(bus, LCD_RST, 0 /*rotation*/, true /*IPS*/,
                                      240, 280, 0, 20, 0, 20);

// ---------------- 프로젝트 공통 정의 ----------------
#define PROJ_MAGIC      0xA7
#define MSG_HEARTBEAT   1
#define MSG_FALL        2
#define MSG_SOS         3
#define MSG_CANCEL      4
#define MSG_BEACON      7      // 경보 중 위치 추적용 비콘 (0.2초마다)
#define MSG_ACK         10
#define MSG_ROBOT_STAT  11
#define ESPNOW_CHANNEL  1

typedef struct __attribute__((packed)) {
  uint8_t magic, type, seq, battery, aux;
} Packet;

static const uint8_t BROADCAST_ADDR[6] = {0xFF,0xFF,0xFF,0xFF,0xFF,0xFF};

// ---------------- 낙상 감지 파라미터 ----------------
#define TH_FREEFALL_G     0.45f
#define TH_FREEFALL_MS    80
#define TH_IMPACT_G       2.20f
#define TH_IMPACT_WIN_MS  600
#define TH_STILL_GYRO_DPS 25.0f
#define TH_STILL_MS       2500
#define COUNTDOWN_MS      10000
#define SOS_HOLD_MS       1500

// ---- 급회전(쓰러짐) 감지 파라미터 ----
// 자유낙하 없이 기울며 넘어지는 경우: 자이로 급회전 + 손목 방향 변화로 판단
#define TH_TIP_DPS        350.0f  // 이 각속도(deg/s) 이상이면 급회전 의심
#define TIP_WAIT_MS       800     // 회전 후 방향 변화를 확인할 시간
#define TH_TIP_ANGLE_COS  0.5f    // cos60° — 손목 방향이 60도 이상 바뀌면 쓰러짐

enum FallState { F_NORMAL, F_FREEFALL, F_IMPACT_WAIT, F_TIP_CHECK, F_STILL_CHECK, F_COUNTDOWN, F_ALERT_SENT };
FallState fallState = F_NORMAL;
uint32_t stateT0 = 0, lastHeartbeat = 0;
uint8_t  seqNo = 0, robotStatus = 0;
bool     imuOK = false;

// ---- 신뢰성 강화: 유니캐스트 자동 페어링 + ACK 재전송 ----
uint8_t  gatewayMac[6];          // 게이트웨이 MAC (첫 수신 패킷에서 자동 학습)
bool     haveGateway = false;
uint8_t  pendingType = 0;        // ACK 대기 중인 이벤트 (0=없음)
uint8_t  pendingAux  = 0;
uint32_t pendingLastTry = 0;
#define  RETRY_MS 500            // ACK 없으면 0.5초마다 재전송

uint8_t  fallReason = 0;   // 감지 원인: 1=충격(자유낙하 경로), 2=쓰러짐(자이로 경로)

// 중력 방향 추정 (저역 필터) — 쓰러짐 각도 판별용
float gravX = 0, gravY = 0, gravZ = 1;
float tipRefX = 0, tipRefY = 0, tipRefZ = 1;   // 급회전 직전의 중력 방향

// ============================================================
//  I2C 유틸 + QMI8658 + CST816 (이전 버전과 동일)
// ============================================================
static bool i2cWrite(uint8_t addr, uint8_t reg, uint8_t val) {
  Wire.beginTransmission(addr);
  Wire.write(reg); Wire.write(val);
  return Wire.endTransmission() == 0;
}
static bool i2cRead(uint8_t addr, uint8_t reg, uint8_t *buf, uint8_t len) {
  Wire.beginTransmission(addr);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(addr, len) != len) return false;
  for (uint8_t i = 0; i < len; i++) buf[i] = Wire.read();
  return true;
}

bool qmiInit() {
  uint8_t who = 0;
  if (!i2cRead(QMI8658_ADDR, 0x00, &who, 1) || who != 0x05) return false;
  i2cWrite(QMI8658_ADDR, 0x02, 0x40);
  i2cWrite(QMI8658_ADDR, 0x03, 0x25);   // 가속도 ±8g
  i2cWrite(QMI8658_ADDR, 0x04, 0x55);   // 자이로 ±512dps
  i2cWrite(QMI8658_ADDR, 0x08, 0x03);
  delay(50);
  return true;
}

void readIMU(float *ax, float *ay, float *az, float *gx, float *gy, float *gz) {
  uint8_t b[12];
  if (!imuOK || !i2cRead(QMI8658_ADDR, 0x35, b, 12)) {
    *ax = 0; *ay = 0; *az = 1; *gx = *gy = *gz = 0;
    return;
  }
  int16_t rawA[3], rawG[3];
  for (int i = 0; i < 3; i++) {
    rawA[i] = (int16_t)(b[i*2]   | (b[i*2+1] << 8));
    rawG[i] = (int16_t)(b[6+i*2] | (b[7+i*2] << 8));
  }
  const float AS = 8.0f / 32768.0f, GS = 512.0f / 32768.0f;
  *ax = rawA[0]*AS; *ay = rawA[1]*AS; *az = rawA[2]*AS;
  *gx = rawG[0]*GS; *gy = rawG[1]*GS; *gz = rawG[2]*GS;
}

void touchInit() { i2cWrite(CST816_ADDR, 0xFE, 0x01); }
bool touchPressed() {
  if (digitalRead(BOOT_BTN) == LOW) return true;
  uint8_t n = 0;
  if (i2cRead(CST816_ADDR, 0x02, &n, 1)) return (n & 0x0F) > 0;
  return false;
}

// 터치 좌표 읽기. 터치 중이면 true와 x(0~239), y(0~279) 반환
bool touchGetXY(int16_t *x, int16_t *y) {
  uint8_t b[5];   // 0x02:손가락수, 0x03:XH, 0x04:XL, 0x05:YH, 0x06:YL
  if (!i2cRead(CST816_ADDR, 0x02, b, 5)) return false;
  if ((b[0] & 0x0F) == 0) return false;
  *x = ((b[1] & 0x0F) << 8) | b[2];
  *y = ((b[3] & 0x0F) << 8) | b[4];
  return true;
}

// ---------------- "로봇 부르기" 버튼 영역 ----------------
#define BTN_X0  20
#define BTN_Y0  200
#define BTN_X1  220
#define BTN_Y1  272
bool inCallButton(int16_t x, int16_t y) {
  return x >= BTN_X0 && x <= BTN_X1 && y >= BTN_Y0 && y <= BTN_Y1;
}

uint8_t readBattery() {
  // 분압비 200k:100k → ADC에는 배터리 전압의 1/3이 들어옴 → ×3 복원
  uint32_t mv = analogReadMilliVolts(BAT_ADC_PIN) * 3;
  static uint16_t dbg = 0;
  if (++dbg % 100 == 1)
    Serial.printf("[BAT] adc=%lumV batt=%lumV\n",
                  (unsigned long)(mv / 3), (unsigned long)mv);
  if (mv < 3300) return 0;
  if (mv > 4200) return 100;
  return (uint8_t)((mv - 3300) / 9);
}

// ============================================================
//  화면 그리기
//  - 상태가 바뀔 때만 전체를 다시 그림 (깜빡임 방지)
//  - 카운트다운 숫자, 배터리 %만 부분 갱신
// ============================================================
FallState shownState = (FallState)255;   // 강제 첫 그리기
int   shownRemain = -99;
int   shownRobot  = -1;
int   shownBatt   = -1;

// 한글(UTF-8) 문자열을 가로 중앙에 그리기. topY = 글자 윗변 위치
void drawCentered(const char* s, int16_t topY, uint8_t size, uint16_t color) {
  int16_t x1, y1; uint16_t w, h;
  gfx->setTextSize(size);
  gfx->getTextBounds(s, 0, 0, &x1, &y1, &w, &h);
  gfx->setCursor((240 - w) / 2 - x1, topY - y1);   // 베이스라인 보정
  gfx->setTextColor(color);
  gfx->print(s);
}

void updateDisplay(FallState st, int remainSec, uint8_t robotStat) {
  uint8_t batt = readBattery();
  bool stateChanged = (st != shownState) || (robotStat != shownRobot);

  if (stateChanged) {
    shownState = st; shownRobot = robotStat; shownRemain = -99; shownBatt = -1;

    switch (st) {
      case F_TIP_CHECK:     // 쓰러짐/충격 확인 중 — 주황 화면
      case F_STILL_CHECK:
        gfx->fillScreen(ORANGE);
        drawCentered("CHECKING", 40, 4, BLACK);
        drawCentered(fallReason == 2 ? "TIP OVER?" : "IMPACT?", 120, 3, RED);
        drawCentered("ARE YOU OK?", 220, 2, BLACK);
        break;

      case F_NORMAL:
      case F_FREEFALL:      // 순간 상태는 평상시 화면 유지
      case F_IMPACT_WAIT:
        gfx->fillScreen(BLACK);
        drawCentered("GUARDIAN", 15, 3, CYAN);
        drawCentered("OK", 60, 7, GREEN);
        if (robotStat == 1)      drawCentered("ROBOT COMING", 168, 2, YELLOW);
        else if (robotStat == 2) drawCentered("ROBOT HERE",   168, 2, GREEN);
        // "로봇 부르기" 버튼 (빨간 상자)
        gfx->fillRoundRect(BTN_X0, BTN_Y0, BTN_X1 - BTN_X0, BTN_Y1 - BTN_Y0, 12, RED);
        drawCentered("CALL ROBOT", BTN_Y0 + 24, 3, WHITE);
        break;

      case F_COUNTDOWN:
        gfx->fillScreen(YELLOW);
        drawCentered(fallReason == 2 ? "TIP OVER!" : "FALL!", 15, 4, RED);
        drawCentered("TOUCH = CANCEL", 245, 2, BLACK);
        break;

      case F_ALERT_SENT:
        gfx->fillScreen(RED);
        drawCentered("SOS", 25, 7, WHITE);
        drawCentered("SENT!", 95, 4, WHITE);
        if (robotStat == 1)      drawCentered("ROBOT COMING", 170, 2, YELLOW);
        else if (robotStat == 2) drawCentered("ROBOT HERE",   170, 2, GREEN);
        else                     drawCentered("WAIT...",      170, 2, WHITE);
        drawCentered("HOLD = END", 245, 2, WHITE);
        break;
    }
  }

  // 카운트다운 숫자 부분 갱신 (초대형)
  if (st == F_COUNTDOWN && remainSec != shownRemain) {
    shownRemain = remainSec;
    gfx->fillRect(50, 85, 140, 130, YELLOW);
    char buf[4]; snprintf(buf, sizeof(buf), "%d", remainSec);
    drawCentered(buf, 95, 14, BLACK);
  }

  // 평상시 배터리 표시 부분 갱신 (버튼 위 영역)
  if ((st == F_NORMAL) && batt != shownBatt) {
    shownBatt = batt;
    gfx->fillRect(0, 128, 240, 34, BLACK);
    char buf[16]; snprintf(buf, sizeof(buf), "BAT %d%%", batt);
    drawCentered(buf, 134, 2, batt < 20 ? RED : DARKGREY);
  }
}

// ============================================================
//  ESP-NOW
// ============================================================
void onEspNowRecv(const esp_now_recv_info *info, const uint8_t *data, int len) {
  if (len != sizeof(Packet)) return;
  Packet p; memcpy(&p, data, len);
  if (p.magic != PROJ_MAGIC) return;

  // 게이트웨이 MAC 자동 학습 → 이후 1:1 전송 (무선 계층 자동 재전송 활성화)
  if (!haveGateway) {
    memcpy(gatewayMac, info->src_addr, 6);
    esp_now_peer_info_t peer = {};
    memcpy(peer.peer_addr, gatewayMac, 6);
    peer.channel = ESPNOW_CHANNEL;
    peer.encrypt = false;
    if (esp_now_add_peer(&peer) == ESP_OK) {
      haveGateway = true;
      Serial.println("[페어링] 게이트웨이 MAC 학습 완료");
    }
  }

  if (p.type == MSG_ROBOT_STAT) robotStatus = p.aux;
  if (p.type == MSG_ACK) pendingType = 0;   // 전달 확인 → 재전송 중단
}

void sendPacket(uint8_t type, uint8_t aux = 0) {
  Packet p = { PROJ_MAGIC, type, ++seqNo, readBattery(), aux };
  // 페어링 후엔 1:1 전송(자동 재전송 있음), 전엔 브로드캐스트
  esp_now_send(haveGateway ? gatewayMac : BROADCAST_ADDR, (uint8_t*)&p, sizeof(p));
}

// 중요 이벤트 발신: ACK 받을 때까지 0.5초마다 자동 재전송
void sendEvent(uint8_t type, uint8_t aux = 0) {
  pendingType = type;
  pendingAux  = aux;
  pendingLastTry = 0;    // 다음 loop에서 즉시 1회 발신
}

void setupEspNow() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);              // Wi-Fi 절전 끄기 (ESP-NOW 지연/누락 방지!)
  WiFi.setChannel(ESPNOW_CHANNEL);
  if (esp_now_init() != ESP_OK) { Serial.println("ESP-NOW fail"); return; }
  esp_now_register_recv_cb(onEspNowRecv);
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, BROADCAST_ADDR, 6);
  peer.channel = ESPNOW_CHANNEL;
  peer.encrypt = false;
  esp_now_add_peer(&peer);
}

void beep(int freq, int ms) { tone(BUZZER_PIN, freq, ms); }

// ============================================================
//  메인
// ============================================================
void setup() {
  // ★ 가장 먼저: 전원 래치 유지 (PWR 버튼으로 배터리 부팅 시 손 떼도 꺼지지 않게)
  pinMode(SYS_EN_PIN, OUTPUT);
  digitalWrite(SYS_EN_PIN, HIGH);
  pinMode(SYS_OUT_PIN, INPUT);

  Serial.begin(115200);
  delay(300);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BOOT_BTN, INPUT_PULLUP);
  analogReadResolution(12);

  // LCD + 백라이트
  gfx->begin(40000000);
  pinMode(LCD_BL, OUTPUT);
  digitalWrite(LCD_BL, HIGH);
  gfx->fillScreen(BLACK);

  Wire.begin(I2C_SDA, I2C_SCL, 400000);
  imuOK = qmiInit();
  Serial.printf("QMI8658: %s\n", imuOK ? "OK" : "FAIL");
  touchInit();
  setupEspNow();
  beep(2000, 100);
}

void loop() {
  uint32_t now = millis();

  // PWR 버튼 3초 길게 누르면 전원 차단 (배터리 구동 시 끄기용)
  // 버튼 극성이 보드마다 달라, 부팅 5~8초 사이의 평상시 레벨을 기준으로 자동 감지.
  // 기준 확정(8초) 전에는 절대 전원을 끄지 않음.
  static int      pwrBaseline = -1;
  static uint32_t blHi = 0, blLo = 0, pwrHoldStart = 0;
  int pwrLv = digitalRead(SYS_OUT_PIN);
  if (pwrBaseline < 0) {
    if (now > 5000) { (pwrLv == HIGH) ? blHi++ : blLo++; }
    if (now > 8000) {
      pwrBaseline = (blHi >= blLo) ? HIGH : LOW;
      Serial.printf("[PWR] baseline(released)=%s\n", pwrBaseline ? "HIGH" : "LOW");
    }
  } else {
    if (pwrLv != pwrBaseline) {                    // 평상시와 다른 레벨 = 버튼 눌림
      if (pwrHoldStart == 0) pwrHoldStart = now;
      else if (now - pwrHoldStart > 3000) {
        Serial.println("[PWR] long press -> power off");
        digitalWrite(SYS_EN_PIN, LOW);             // 배터리 전원 차단 (USB 중이면 유지)
        delay(1000);
        pwrHoldStart = 0;
      }
    } else pwrHoldStart = 0;
  }

  float ax, ay, az, gx, gy, gz;
  readIMU(&ax, &ay, &az, &gx, &gy, &gz);
  float svm  = sqrtf(ax*ax + ay*ay + az*az);
  float gmag = sqrtf(gx*gx + gy*gy + gz*gz);

  // 중력 방향 저역 필터 (5% 반영 — 팔 동작에는 둔감, 자세 변화는 추적)
  gravX += 0.05f * (ax - gravX);
  gravY += 0.05f * (ay - gravY);
  gravZ += 0.05f * (az - gravZ);

  switch (fallState) {
    case F_NORMAL:
      if (svm < TH_FREEFALL_G) {                      // 경로1: 자유낙하형 낙상
        fallState = F_FREEFALL; stateT0 = now;
      } else if (gmag > TH_TIP_DPS) {                 // 경로2: 기울며 쓰러짐(자이로)
        tipRefX = gravX; tipRefY = gravY; tipRefZ = gravZ;   // 회전 직전 방향 저장
        fallState = F_TIP_CHECK; stateT0 = now;
        fallReason = 2;
      }
      break;
    case F_FREEFALL:
      if (svm >= TH_FREEFALL_G && (now - stateT0) < TH_FREEFALL_MS) fallState = F_NORMAL;
      else if ((now - stateT0) >= TH_FREEFALL_MS) { fallState = F_IMPACT_WAIT; stateT0 = now; }
      break;
    case F_IMPACT_WAIT:
      if (svm > TH_IMPACT_G) { fallState = F_STILL_CHECK; stateT0 = now; fallReason = 1; }
      else if ((now - stateT0) > TH_IMPACT_WIN_MS) fallState = F_NORMAL;
      break;

    case F_TIP_CHECK: {   // 급회전 후 손목 방향이 크게 바뀌었는지 확인
      if ((now - stateT0) >= TIP_WAIT_MS) {
        float dot = gravX*tipRefX + gravY*tipRefY + gravZ*tipRefZ;
        float m1 = sqrtf(gravX*gravX + gravY*gravY + gravZ*gravZ);
        float m2 = sqrtf(tipRefX*tipRefX + tipRefY*tipRefY + tipRefZ*tipRefZ);
        float cosA = (m1 > 0.1f && m2 > 0.1f) ? dot / (m1 * m2) : 1.0f;
        if (cosA < TH_TIP_ANGLE_COS) {                // 60도 이상 방향 변화 → 쓰러짐
          fallState = F_STILL_CHECK; stateT0 = now;   // 무동작 확인 단계로
          Serial.printf("[감지] 쓰러짐 의심 (각도변화 cos=%.2f)\n", cosA);
        } else {
          fallState = F_NORMAL;                       // 그냥 팔을 빨리 돌린 것
        }
      }
      break;
    }
    case F_STILL_CHECK:
      if (gmag > TH_STILL_GYRO_DPS) fallState = F_NORMAL;
      else if ((now - stateT0) >= TH_STILL_MS) { fallState = F_COUNTDOWN; stateT0 = now; }
      break;
    case F_COUNTDOWN:
      if ((now / 500) % 2 == 0) beep(3000, 60);
      if (touchPressed()) {
        fallState = F_NORMAL;
        sendEvent(MSG_CANCEL);
        beep(1000, 300);
      } else if ((now - stateT0) >= COUNTDOWN_MS) {
        sendEvent(MSG_FALL, (uint8_t)(svm * 10));
        fallState = F_ALERT_SENT; stateT0 = now;
      }
      break;
    case F_ALERT_SENT: {
      // 위치 추적 비콘: 로봇이 RSSI로 방향을 찾도록 0.2초마다 발신
      static uint32_t lastBeacon = 0;
      if (now - lastBeacon > 200) { sendPacket(MSG_BEACON); lastBeacon = now; }

      static uint32_t holdT0 = 0;
      if (touchPressed()) {
        if (holdT0 == 0) holdT0 = now;
        if (now - holdT0 > SOS_HOLD_MS) { sendEvent(MSG_CANCEL); fallState = F_NORMAL; holdT0 = 0; }
      } else holdT0 = 0;
      break;
    }
  }

  // ---------- "로봇 부르기" 버튼: 화면의 빨간 버튼을 누르면 즉시 호출 ----------
  static bool wasTouching = false;
  int16_t tx, ty;
  bool touchingNow = touchGetXY(&tx, &ty);
  if (fallState == F_NORMAL && touchingNow && !wasTouching) {   // 새로 눌린 순간만
    if (inCallButton(tx, ty)) {
      sendEvent(MSG_SOS);
      fallState = F_ALERT_SENT; stateT0 = now;
      beep(3500, 500);
      Serial.printf("[버튼] 로봇 부르기 (%d,%d)\n", tx, ty);
    }
  }
  wasTouching = touchingNow;

  // 백업: BOOT 버튼 길게 누르면 SOS (터치 문제 시에도 동작)
  static uint32_t sosT0 = 0;
  if (fallState == F_NORMAL && digitalRead(BOOT_BTN) == LOW) {
    if (sosT0 == 0) sosT0 = now;
    if (now - sosT0 > SOS_HOLD_MS) {
      sendEvent(MSG_SOS);
      fallState = F_ALERT_SENT; stateT0 = now;
      beep(3500, 500);
      sosT0 = 0;
    }
  } else if (digitalRead(BOOT_BTN) == HIGH) sosT0 = 0;

  // ---------- ACK 재전송: 대기 중 이벤트가 있으면 0.5초마다 재발신 ----------
  if (pendingType != 0 && (now - pendingLastTry) >= RETRY_MS) {
    sendPacket(pendingType, pendingAux);
    pendingLastTry = now;
  }

  if (now - lastHeartbeat > 5000) { sendPacket(MSG_HEARTBEAT); lastHeartbeat = now; }

  int remainSec = (fallState == F_COUNTDOWN) ? (int)((COUNTDOWN_MS - (now - stateT0)) / 1000) + 1 : -1;
  updateDisplay(fallState, remainSec, robotStatus);

  delay(20);
}
