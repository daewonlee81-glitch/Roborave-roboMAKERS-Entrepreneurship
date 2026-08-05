const pptxgen = require('pptxgenjs');

const TEAL = '028090', TINT = 'E6F4F5', DARK = '1E2761', CORAL = 'F96167', GREY = '555555';
const KF = 'Malgun Gothic';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';   // 13.33 x 7.5

function block(slide, x, y, w, h, head, lines, opts = {}) {
  const fillC = opts.fill || TINT;
  const headC = opts.headColor || TEAL;
  const textC = opts.textColor || '333333';
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.06, fill: { color: fillC },
    line: { color: 'CFE6E8', width: 0.75 } });
  slide.addText(head, { x: x + 0.08, y: y + 0.05, w: w - 0.16, h: 0.32,
    fontSize: 12.5, bold: true, color: headC, fontFace: KF, margin: 0 });
  slide.addText(lines.map((s, i) => ({ text: s, options: { bullet: { characterCode: '2022', indent: 8 }, breakLine: i < lines.length - 1 } })),
    { x: x + 0.10, y: y + 0.40, w: w - 0.2, h: h - 0.5, fontSize: 10, color: textC,
      fontFace: KF, valign: 'top', margin: 0, paraSpaceAfter: 4 });
}

function buildSlide(L) {
  const s = pres.addSlide();
  s.background = { color: 'FFFFFF' };
  s.addText(L.title, { x: 0.4, y: 0.12, w: 9.2, h: 0.5, fontSize: 24, bold: true, color: DARK, fontFace: KF, margin: 0 });
  s.addText(L.sub, { x: 9.7, y: 0.12, w: 3.25, h: 0.5, fontSize: 11, color: GREY, fontFace: KF, align: 'right', valign: 'middle', margin: 0 });

  const x0 = 0.4, colW = 2.45, gap = 0.06;
  const X = [x0, x0 + (colW + gap), x0 + 2 * (colW + gap), x0 + 3 * (colW + gap), x0 + 4 * (colW + gap)];
  const yTop = 0.75, mainH = 5.0, halfH = (mainH - 0.08) / 2;

  block(s, X[0], yTop, colW, mainH, L.kp.h, L.kp.b);
  block(s, X[1], yTop, colW, halfH, L.ka.h, L.ka.b);
  block(s, X[1], yTop + halfH + 0.08, colW, halfH, L.kr.h, L.kr.b);
  block(s, X[2], yTop, colW, mainH, L.vp.h, L.vp.b, { fill: TEAL, headColor: 'FFFFFF', textColor: 'FFFFFF' });
  block(s, X[3], yTop, colW, halfH, L.cr.h, L.cr.b);
  block(s, X[3], yTop + halfH + 0.08, colW, halfH, L.ch.h, L.ch.b);
  block(s, X[4], yTop, colW, mainH, L.cs.h, L.cs.b);

  const yBot = yTop + mainH + 0.1, botH = 1.45;
  const botW = (X[4] + colW - x0 - 0.08) / 2;
  block(s, x0, yBot, botW, botH, L.cost.h, L.cost.b);
  block(s, x0 + botW + 0.08, yBot, botW, botH, L.rev.h, L.rev.b, { headColor: CORAL });
}

// ================= 한국어 =================
buildSlide({
  title: '비즈니스 모델 캔버스 — 지킴이 (GUARDIAN)',
  sub: '팀 RoboMakers | RoboRAVE 2026 오사카 창업 혁신 챌린지',
  kp: { h: '핵심 파트너', b: ['지자체·복지관 (보급 사업)', '요양·재가돌봄 기관', '부품 제조사 (센서·보드)', '노인회·경로당 네트워크', '보험사 (실버 안전 상품)'] },
  ka: { h: '핵심 활동', b: ['낙상 감지 알고리즘 고도화', '제품 양산 설계·안전 인증(KC)', '보호자 알림 앱 개발'] },
  kr: { h: '핵심 자원', b: ['3단계+자이로 낙상 감지 기술', '인터넷 불필요 무선 프로토콜', '3개 국어 오프라인 음성인식', '특허 출원 (감지+출동 연계)'] },
  vp: { h: '가치 제안', b: ['"알림에서 끝나지 않고, 직접 달려갑니다"', '낙상 자동 감지 — 버튼을 못 눌러도 구조 요청', '로봇이 어르신 곁으로 이동해 약·도움 전달', '인터넷·와이파이 없이 동작 (정전에도 OK)', '한·영·일 3개 국어 음성 명령', '오경보 방지 (3단계 확인 + 취소 10초)'] },
  cr: { h: '고객 관계', b: ['보호자 앱 실시간 알림 (예정)', '월 구독 케어 리포트', '지자체 담당자 관리 포털'] },
  ch: { h: '채널', b: ['지자체 복지사업 입찰 (B2G)', '복지관·요양기관 제휴', '온라인몰·홈쇼핑 (B2C)'] },
  cs: { h: '고객 세그먼트', b: ['1차: 혼자 사시는 어르신', '  한국 약 200만 가구', '  일본 약 800만 가구', '2차: 맞벌이 자녀 (보호자)', '3차: 지자체·복지기관', '  독거노인 안전 예산 활용'] },
  cost: { h: '비용 구조', b: ['부품 원가: 시계 약 $22, 로봇 약 $95 (양산 기준)', '개발·인증(KC/전파) 비용, 금형·조립비', '마케팅·AS, 앱 서버 운영비'] },
  rev: { h: '수익원', b: ['세트 판매 ₩399,000 ($299) — 마진 약 60%', '시계 단품 ₩59,000 ($45) / 추가 시계 (부부용)', '월 구독 ₩5,000 — 보호자 알림·케어 리포트'] },
});

// ================= English =================
buildSlide({
  title: 'Business Model Canvas — GUARDIAN',
  sub: 'Team RoboMakers | RoboRAVE 2026 Osaka Entrepreneurial Challenge',
  kp: { h: 'Key Partners', b: ['Local governments & welfare centers', 'Elderly care agencies', 'Component manufacturers', 'Senior community networks', 'Insurers (silver safety plans)'] },
  ka: { h: 'Key Activities', b: ['Improving fall-detection AI', 'Mass-production & safety certification', 'Family alert app development'] },
  kr: { h: 'Key Resources', b: ['3-stage + gyro fall detection', 'Internet-free radio protocol', 'Offline voice AI in 3 languages', 'Patent pending (detect-and-rescue link)'] },
  vp: { h: 'Value Proposition', b: ['"We don\'t just alert. We RUN to you."', 'Automatic fall detection — works even if you can\'t press a button', 'A robot that comes to your side with medicine & help', 'Works without internet or Wi-Fi (even in blackouts)', 'Voice commands in Korean, English, Japanese', 'False-alarm protection (3-stage check + 10s cancel)'] },
  cr: { h: 'Customer Relationships', b: ['Real-time family app alerts (planned)', 'Monthly care reports', 'Admin portal for city welfare staff'] },
  ch: { h: 'Channels', b: ['Government welfare programs (B2G)', 'Care center partnerships', 'Online stores & TV shopping (B2C)'] },
  cs: { h: 'Customer Segments', b: ['1st: Elderly living alone', '  ~2M households in Korea', '  ~8M in Japan', '2nd: Working adult children', '3rd: Local governments', '  using senior-safety budgets'] },
  cost: { h: 'Cost Structure', b: ['Parts: ~$22 per watch, ~$95 per robot (at scale)', 'R&D, safety certification, tooling & assembly', 'Marketing, support, app server'] },
  rev: { h: 'Revenue Streams', b: ['Bundle $299 (watch + robot) — ~60% margin', 'Watch only $45 / extra watch for couples', 'Subscription $4/mo — family alerts & care reports'] },
});

pres.writeFile({ fileName: '비즈니스모델캔버스_지킴이.pptx' }).then(() => console.log('done'));
