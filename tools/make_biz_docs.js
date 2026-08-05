const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
        Table, TableRow, TableCell, WidthType, ShadingType } = require('docx');

const FONT = { ascii: 'Malgun Gothic', eastAsia: 'Malgun Gothic', hAnsi: 'Malgun Gothic' };
const t = (x, o = {}) => new TextRun({ text: x, font: FONT, size: o.size || 21, bold: o.bold, color: o.color, italics: o.it });
const dir = (x) => new Paragraph({ children: [t('〔' + x + '〕', { size: 19, color: '888888', it: true })], spacing: { after: 100, line: 300 } });
const h1 = (x) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: [t(x, { size: 25, bold: true, color: '1F4E79' })] });
const sp2 = (name, ko, en) => [
  new Paragraph({ children: [t('【' + name + '】 ', { bold: true, color: 'B4530A' }), t(ko)], spacing: { after: 40, line: 330 } }),
  new Paragraph({ children: [t('        '), t(en, { color: '2E6DB4', it: true, size: 20 })], spacing: { after: 140, line: 310 } }),
];
const title = (main, sub) => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 70 }, children: [t(main, { size: 30, bold: true, color: '1F4E79' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [t(sub, { size: 20, color: '2E6DB4' })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E6DB4', space: 6 } } }),
];

// ==================================================================
// 1) 5분 피칭 대본
// ==================================================================
const P = [];
P.push(...title('공식 피칭 대본 (5분) — 창업 혁신 챌린지', '지킴이 GUARDIAN | 발표 5분 + 질의응답 5분 | 한/영 교차'));
P.push(dir('시연 드라마와 별개의 "사업 발표"입니다. 부스 시연을 이미 본 심사위원에게는 비즈니스를 파는 자리입니다.'));

P.push(h1('0:00–0:30  오프닝 훅 — 김서준'));
P.push(...sp2('김서준', '심사위원님, 세계에서는 46초에 한 명씩 낙상으로 목숨을 잃습니다. 그리고 그 대부분은, 곁에 아무도 없었기 때문입니다. 안녕하세요, 알림을 넘어 직접 달려가는 구조 로봇 — 지킴이를 만든 팀 RoboMakers입니다.',
  'Judges — every 46 seconds, someone in the world dies from a fall. And most of them died because no one was there. Hello, we are team RoboMakers, makers of GUARDIAN — the rescue robot that does not just alert, but RUNS.'));

P.push(h1('0:30–1:15  문제와 시장 — 이승훈'));
P.push(...sp2('이승훈', '한국은 다섯 명 중 한 명, 일본은 열 명 중 세 명이 65세 이상입니다. 혼자 사시는 어르신은 두 나라만 합쳐도 천만 가구에 이릅니다. 기존 제품은 두 가지 문제가 있습니다. 응급 버튼은 정신을 잃으면 누를 수 없고, 알림 서비스는 멀리 있는 가족의 휴대폰에서 끝납니다.',
  'In Korea, one in five people is over 65. In Japan, three in ten. Together, ten million elderly households live alone. Existing products have two problems: an emergency button is useless if you faint, and alert services end at a phone far away.'));
P.push(...sp2('이승훈', '골든타임에 필요한 것은 알림이 아니라, 곁에 와 주는 존재입니다.',
  'In the golden time, what you need is not a notification. It is someone — something — that comes to your side.'));

P.push(h1('1:15–2:15  솔루션 + 30초 라이브 시연 — 장태양'));
P.push(dir('피칭장에 시계+로봇 지참. 태양이 시계 착용, 버튼 호출 → 로봇 출동 → "약 주세요" → 배출 (30초 압축 시연)'));
P.push(...sp2('장태양', '지킴이는 세 가지를 해냅니다. 첫째, 손목의 시계가 낙상을 스스로 감지합니다 — 버튼을 누르지 못해도요. 둘째, 신호를 받은 로봇이 라인을 따라 어르신 곁으로 직접 이동합니다. 셋째, 도착한 로봇에게 한국어, 영어, 일본어로 말만 하면 약을 주고, 가족을 부릅니다. 지금 30초로 보여드리겠습니다.',
  'GUARDIAN does three things. First, the watch detects a fall by itself — even if you cannot press a button. Second, the robot travels to your side, following the line. Third, you just talk to it — in Korean, English or Japanese — and it hands you medicine and calls your family. Let me show you in 30 seconds.'));
P.push(dir('시연: 호출 → 출동 → 도착 → "Medicine please" → 약 배출 → (도착음) 완료 인사'));
P.push(...sp2('장태양', '보셨듯이, 인터넷도 와이파이도 없이 방금 모든 것이 동작했습니다. 정전이 나도 지킴이는 달립니다.',
  'As you saw — everything just worked with no internet, no Wi-Fi. Even in a blackout, GUARDIAN runs.'));

P.push(h1('2:15–3:15  비즈니스 모델 — 김서은'));
P.push(...sp2('김서은', '저희의 첫 고객은 지자체입니다. 한국의 모든 지자체에는 독거노인 안전 예산이 있고, 저희는 세트당 249달러의 B2G 가격으로 보급 사업에 들어갑니다. 일반 판매는 시계와 로봇 세트 299달러, 양산 원가는 117달러로 마진은 약 60%입니다.',
  'Our first customer is local government. Every Korean city has a senior-safety budget, and we enter those programs at a B2G price of $249 per set. Retail is $299 for the watch-and-robot set; production cost is $117 — about a 60% margin.'));
P.push(...sp2('김서은', '여기에 월 4달러의 보호자 알림 구독이 더해집니다. 천 가구만 가입해도 해마다 4만 8천 달러의 반복 수익이 생깁니다. 하드웨어로 시작해서, 구독으로 성장하는 모델입니다.',
  'On top, a $4-a-month family-alert subscription. Just one thousand households means $48,000 of recurring revenue a year. We start with hardware, and grow with subscription.'));

P.push(h1('3:15–4:15  경쟁 우위와 확장성 — 김서준'));
P.push(...sp2('김서준', '저희의 차별점은 세 가지입니다. 첫째, "감지에서 구조까지" 전 과정을 하나로 잇는 제품은 아직 없습니다 — 이 연계 방식으로 특허 출원을 준비하고 있습니다. 둘째, 인터넷이 필요 없어서 통신 환경이 나쁜 농촌과 도서 지역까지 갈 수 있습니다. 셋째, 오프라인 3개 국어 음성은 처음부터 글로벌 제품으로 설계했다는 뜻입니다.',
  'Three things set us apart. First, no product yet connects detection to rescue in one system — we are preparing a patent on this link. Second, needing no internet, we can reach rural areas with poor connectivity. Third, offline voice in three languages means we designed for the global market from day one.'));
P.push(...sp2('김서준', '다음 단계는 보호자 스마트폰 앱, 어르신과 대화하는 AI, 그리고 요양 시설용 다중 사용자 버전입니다. 한 대의 로봇이 한 층의 어르신 전부를 지키는 것이 저희의 로드맵입니다.',
  'Next: a family smartphone app, a conversational AI companion, and a multi-user version for care facilities — one robot guarding a whole floor of residents. That is our roadmap.'));

P.push(h1('4:15–5:00  비전 클로징 — 전원'));
P.push(...sp2('김서준', '저희는 초등학생과 중학생입니다. 하지만 저희가 만든 것은 장난감이 아니라, 오늘 부스에서 직접 확인하실 수 있는, 작동하는 구조 시스템입니다.',
  'We are elementary and middle school students. But what we built is not a toy — it is a working rescue system, and you can see it run at our booth today.'));
P.push(new Paragraph({ children: [t('【다 함께 / ALL】 ', { bold: true, color: 'C00000' }), t('할머니는, 이제 혼자가 아닙니다. 감사합니다!', { bold: true })], spacing: { after: 40 } }));
P.push(new Paragraph({ children: [t('        '), t('Grandma is not alone anymore. Thank you!', { color: '2E6DB4', it: true, bold: true, size: 20 })], spacing: { after: 140 } }));
P.push(new Paragraph({ spacing: { before: 200 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA', space: 4 } },
  children: [t('※ 46초 계산 근거: WHO 연간 낙상 사망 68만 4천 명 ≒ 46초당 1명. ※ 숫자 근거는 부품원가표 xlsx와 비즈니스 모델 캔버스 참조. 발표 후 5분 Q&A는 "Q&A 예상 질문 30선" 문서로 연습.', { size: 18, color: '888888' })] }));

const doc1 = new Document({ styles: { default: { document: { run: { font: FONT, size: 21 } } } }, sections: [{ children: P }] });

// ==================================================================
// 2) Q&A 예상 질문 30선
// ==================================================================
const QA = [];
QA.push(...title('Q&A 예상 질문 30선 — 창업 혁신 챌린지', '질의응답 5분 대비 | 한/영 | 답변 담당을 정해 연습하세요'));

const qaData = [
  ['기술 (Technology)', [
    ['낙상을 어떻게 감지하나요?', 'How does it detect a fall?',
     '가속도로 자유낙하→충격→무동작 3단계를 확인하고, 자이로로 기울며 쓰러지는 것도 잡습니다. 마지막에 10초 카운트다운으로 오경보를 거릅니다.',
     'The accelerometer checks three stages — free-fall, impact, stillness — and the gyro catches slow tip-overs. A 10-second countdown filters false alarms.'],
    ['오경보가 나면 어떻게 되나요?', 'What happens on a false alarm?',
     '10초 안에 화면을 터치하면 취소됩니다. 시계를 내려놓는 정도로는 3단계 조건이 완성되지 않아 애초에 울리지 않습니다.',
     'Touch the screen within ten seconds to cancel. Simply putting the watch down does not complete the three stages, so it does not even trigger.'],
    ['인터넷 없이 어떻게 통신하나요?', 'How does it communicate without internet?',
     'ESP-NOW라는 근거리 무선을 씁니다. 두 기계가 서로를 기억해 1:1로 통신하고, 응답이 올 때까지 재전송해서 신호를 잃지 않습니다.',
     'We use ESP-NOW short-range radio. The two devices remember each other, talk one-to-one, and re-send until acknowledged, so no signal is lost.'],
    ['로봇은 길을 어떻게 찾나요?', 'How does the robot navigate?',
     '바닥의 라인을 8채널 IR 센서로 따라가고, PID 제어로 부드럽게 주행합니다. 어르신 앞에서는 초음파 센서로 안전하게 멈춥니다.',
     'It follows a floor line with an 8-channel IR sensor using PID control, and stops safely in front of the person using ultrasonic sensing.'],
    ['라인이 없는 집에서는요?', 'What about homes without lines?',
     '현재 프로토타입은 라인 방식이고, 신호 세기(RSSI) 추적도 구현해 시험했습니다. 다음 버전에서 카메라·SLAM 방식으로 확장할 계획입니다.',
     'The prototype uses lines; we also built and tested radio-signal (RSSI) homing. Camera/SLAM navigation is planned for the next version.'],
    ['음성인식은 어떻게 3개 국어가 되나요?', 'How does voice work in three languages?',
     '오프라인 음성인식 모듈에 사용자가 직접 말한 문구를 학습시키는 방식이라, 언어에 관계없이 등록할 수 있습니다. 클라우드가 필요 없습니다.',
     'The offline voice module learns phrases spoken by the user, so any language can be registered. No cloud needed.'],
    ['배터리는 얼마나 가나요?', 'How long does the battery last?',
     '시계는 500mAh로 하루 이상을 목표로 하고, 시연 설정(절전 해제)에서는 더 짧습니다. 양산 버전에서는 평소 절전-이벤트 시 고성능 방식으로 늘릴 계획입니다.',
     'The watch targets a full day on 500mAh; demo settings (power-save off) are shorter. Production will sleep normally and wake on events to extend life.'],
    ['시연 중 실패하면요?', 'What if the demo fails?',
     '버튼 호출이라는 2차 경로, 음성이라는 3차 경로가 있습니다. 저희는 실패 경로까지 설계했고, 그것이 실제 제품에 필요한 태도라고 생각합니다.',
     'We have a second path (button call) and a third (voice). We designed for failure paths — which is exactly what a real product needs.'],
    ['왜 레고 스파이크를 썼나요?', 'Why LEGO SPIKE?',
     '빠른 프로토타이핑을 위해서입니다. 원가표에 있듯 양산은 전용 모터·섀시로 전환하며, 그 경우 로봇 원가는 약 95달러로 떨어집니다.',
     'For rapid prototyping. As our BOM shows, production switches to dedicated motors and chassis, dropping robot cost to about $95.'],
    ['어떤 문제가 가장 어려웠나요?', 'What was the hardest problem?',
     '무선 절전 기능 때문에 로봇이 30초 늦게 반응하던 문제였습니다. 원인을 추적해 절전을 끄고 재전송 방식을 더해 1초 안에 반응하게 만들었습니다.',
     'A 30-second delay caused by the radio power-saving mode. We traced it, disabled power-save, added acknowledged re-sending — now it reacts in one second.'],
  ]],
  ['비즈니스 (Business)', [
    ['첫 고객은 누구인가요?', 'Who is your first customer?',
     '지자체입니다. 독거노인 안전 예산이 이미 있고, 개인보다 대량 구매가 가능하며, 보급 후 입소문이 B2C로 이어집니다.',
     'Local governments. Senior-safety budgets already exist, they buy in volume, and public deployment drives consumer word-of-mouth.'],
    ['가격은 왜 299달러인가요?', 'Why $299?',
     '양산 원가 117달러에 유통·AS를 더해도 60% 마진이 남는 가격이면서, 경쟁 제품인 응급알림 서비스 2~3년치 요금보다 쌉니다.',
     'It keeps a 60% margin over the $117 production cost, and is cheaper than two to three years of existing alert-service fees.'],
    ['경쟁 제품과 무엇이 다른가요?', 'How is it different from competitors?',
     '기존 제품은 감지하거나 알리는 데서 끝납니다. 감지-이동-현장 도움(약·사이렌)까지 잇는 소비자 제품은 저희가 처음입니다.',
     'Existing products stop at detecting or alerting. We are the first consumer product to connect detection, travel, and on-site help.'],
    ['시장 규모는요?', 'Market size?',
     '한국+일본 독거 어르신 약 천만 가구가 1차 시장입니다. 1%인 10만 가구만 보급해도 하드웨어 매출 약 3천만 달러입니다.',
     'About ten million single-elderly households in Korea and Japan. Reaching just 1% — 100,000 homes — is roughly $30M in hardware revenue.'],
    ['수익은 지속 가능한가요?', 'Is revenue sustainable?',
     '하드웨어 판매에 월 4달러 구독(보호자 알림·케어 리포트)을 더해 반복 수익을 만듭니다. 천 가구당 연 4만 8천 달러입니다.',
     'Hardware plus a $4/month subscription for family alerts and care reports. Every thousand households adds $48,000 a year of recurring revenue.'],
    ['특허는 준비되어 있나요?', 'Any patent plans?',
     '"착용형 감지와 자율 출동 로봇의 연계 방식"으로 출원을 준비 중입니다. 대회의 IP 자문 프로그램도 활용하고 싶습니다.',
     'We are preparing a filing on the wearable-detection-to-autonomous-rescue link, and would love to use the competition\'s IP advisory program.'],
    ['생산은 어떻게 할 건가요?', 'How will you manufacture?',
     '초기에는 국내 조립 파트너와 소량 생산하고, 지자체 실증 사업으로 검증한 뒤 규모를 키울 계획입니다.',
     'Start with a small-batch domestic assembly partner, validate through government pilot programs, then scale.'],
    ['가장 큰 리스크는요?', 'Biggest risk?',
     '오경보와 미감지입니다. 그래서 3단계 감지와 취소 장치를 만들었고, 실증 데이터로 알고리즘을 계속 학습시키는 것이 핵심 활동입니다.',
     'False alarms and missed falls. That is why we built 3-stage detection with cancel, and continuous algorithm improvement from pilot data is a key activity.'],
    ['해외 진출 계획은요?', 'Global plans?',
     '3개 국어 음성이 이미 그 답입니다. 고령화 1위 일본이 첫 해외 시장이고, 오늘 이 자리가 그 시작입니다.',
     'Our three-language voice is the answer. Japan — the most aged society — is our first overseas market, and today is the start.'],
    ['왜 이 가격에 지자체가 사나요?', 'Why would cities buy at this price?',
     '독거노인 1인당 연간 안전 예산과 비교하면 일회성 249달러는 저렴하고, 야간 돌봄 인력의 공백을 메워줍니다.',
     'Compared with annual per-person safety budgets, a one-time $249 is cheap — and it fills the overnight care gap staff cannot cover.'],
  ]],
  ['팀·프로젝트 (Team & Project)', [
    ['정말 여러분이 직접 만들었나요?', 'Did you really build this yourselves?',
     '네. 낙상 임계값 실험, 절전 버그 추적, PID 게인 튜닝까지 저희가 했습니다. 어떤 부분이든 코드로 설명드릴 수 있습니다.',
     'Yes. We ran the fall-threshold experiments, traced the power-save bug, tuned the PID gains. Ask us about any part — we can explain the code.'],
    ['역할 분담은요?', 'How did you divide roles?',
     '서준-시스템 통합·발표, 태양-로봇 주행·시연, 승훈-시계·실험, 서은-통신·비즈니스 분석으로 나눴고, 모두가 서로의 파트를 이해합니다.',
     'Seo-jun: integration & presenting; Tae-yang: driving & demo; Seung-hun: watch & experiments; Seo-eun: comms & business. And we each understand the others\' parts.'],
    ['얼마나 걸렸나요?', 'How long did it take?',
     '설계부터 검증까지 약 ○개월입니다. 가장 오래 걸린 것은 만들기가 아니라, 안 되는 이유를 찾는 일이었습니다.',
     'About ○ months from design to verification. The longest part was not building — it was finding out why things did not work.'],
    ['어른의 도움은 받았나요?', 'Did adults help?',
     '지도 선생님께 방향 조언을 받았지만, 회로 연결과 코드 수정, 실험은 등록된 팀원이 직접 수행했습니다.',
     'Our coach advised on direction, but wiring, code changes and experiments were done by the registered team members.'],
    ['다음 버전에서 뭘 바꾸고 싶나요?', 'What would you change next?',
     '낙상 데이터를 모아 AI 감지로 올리고, 라인 없이 다니는 주행, 그리고 어르신과 대화하는 말벗 기능을 넣고 싶습니다.',
     'Collect fall data for AI detection, line-free navigation, and a companion AI that talks with the elderly.'],
  ]],
  ['안전·확장 (Safety & Scale)', [
    ['로봇이 사람과 부딪히면요?', 'What if the robot hits someone?',
     '초음파로 15cm 앞에서 멈추고, 주행 중 전방에 장애물이 있으면 정지 후 기다립니다. 속도도 보행 보조 수준으로 제한했습니다.',
     'It stops 15cm ahead using ultrasonic sensing, pauses for obstacles, and speed is limited to a walking-assist level.'],
    ['개인정보 문제는 없나요?', 'Any privacy issues?',
     '카메라 없이 동작하고, 음성도 기기 안에서만 처리되는 오프라인 방식입니다. 데이터가 밖으로 나가지 않는 것이 저희 설계 원칙입니다.',
     'No camera, and voice is processed entirely on-device, offline. Data never leaves the home — that is a design principle.'],
    ['약을 잘못 주면 위험하지 않나요?', 'Is dispensing medicine risky?',
     '보호자가 미리 담아둔 1회분만 배출하고, 요청 시에만 동작합니다. 복약 기록은 구독 리포트로 가족에게 전달할 계획입니다.',
     'It dispenses only a single pre-loaded dose, only on request. Dose logs will go to family via the subscription report.'],
    ['아파트가 아닌 집에서도 되나요?', 'Does it work in any home?',
     '라인 트랙은 바닥재와 무관하게 부착형으로 깔 수 있고, 매트형 트랙도 함께 제공할 계획입니다.',
     'The line track is an adhesive strip that works on any floor, and we plan to offer a mat-type track as well.'],
    ['요양시설에서는 어떻게 쓰나요?', 'How does it work in care facilities?',
     '시계 여러 개가 한 로봇을 공유하는 다중 사용자 버전을 로드맵에 두고 있습니다. 복도 라인 하나로 한 층 전체를 커버할 수 있습니다.',
     'A multi-user version — many watches, one robot — is on our roadmap. One corridor line can cover an entire floor.'],
  ]],
];

let qn = 1;
qaData.forEach(([cat, items]) => {
  QA.push(h1(cat));
  items.forEach(([qk, qe, ak, ae]) => {
    QA.push(new Paragraph({ children: [t(`Q${qn}. ${qk}`, { bold: true, color: '028090' }), t('  ' + qe, { color: '2E6DB4', it: true, size: 19 })], spacing: { before: 90, after: 50, line: 320 } }));
    QA.push(new Paragraph({ children: [t('→ ' + ak)], spacing: { after: 30, line: 320 } }));
    QA.push(new Paragraph({ children: [t('    '), t(ae, { color: '888888', it: true, size: 19 })], spacing: { after: 110, line: 300 } }));
    qn++;
  });
});
const doc2 = new Document({ styles: { default: { document: { run: { font: FONT, size: 21 } } } }, sections: [{ children: QA }] });

// ==================================================================
// 3) 홍보 영상 스토리보드
// ==================================================================
const SB = [];
SB.push(...title('홍보 영상 스토리보드 (75초)', '지킴이 GUARDIAN | ES/MS는 선택 제출 — 부스 반복 재생용으로도 활용'));
SB.push(new Paragraph({ children: [t('촬영: 스마트폰 가로. 배경음악: 잔잔→긴박→따뜻. 자막은 영어 큰 글씨 + 한국어 작은 글씨 권장.', { size: 19, color: '666666' })], spacing: { after: 160 } }));

const cw = [700, 1000, 3400, 4200];
const cells = (arr, headRow = false) => new TableRow({
  children: arr.map((c, i) => new TableCell({
    width: { size: cw[i], type: WidthType.DXA },
    shading: headRow ? { type: ShadingType.CLEAR, fill: 'DCE9F7' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ children: [t(String(c), { bold: headRow, size: 18 })], spacing: { after: 0, line: 270 } })],
  })),
});
const sbRows = [
  ['컷', '시간', '화면', '자막 / 내레이션 (EN 위주 + KO)'],
  ['1', '0–6초', '할머니 역(태양) 혼자 화분에 물 주는 뒷모습, 잔잔한 음악', 'Every 46 seconds, the world loses someone to a fall. — 46초마다 한 명'],
  ['2', '6–12초', '천천히 넘어지는 장면(매트), 화면 어두워짐, 음악 멈춤', 'And most of them… were alone. — 대부분은 혼자였습니다'],
  ['3', '12–18초', '손목 클로즈업: 시계 주황 CHECKING → 노란 카운트다운', 'But this watch noticed. — 하지만 시계가 알아차렸습니다'],
  ['4', '18–26초', '로봇 스테이션에서 경보음과 함께 출발, 라인 주행 로우앵글', 'GUARDIAN doesn\'t just alert. It RUNS. — 알림을 넘어, 달려갑니다'],
  ['5', '26–34초', '거실 통과, 문 지나 안방 진입 (매트 평면도 부감샷 교차)', '(주행 사운드 강조, 자막 없음)'],
  ['6', '34–40초', '초음파로 할머니 앞 정지, 시계 화면 "ROBOT HERE" 클로즈업', 'It found her. — 로봇이 찾아냈습니다'],
  ['7', '40–50초', '할머니: "약 주세요" → 서보 약 배출 → 약 받는 손 클로즈업', 'Ask in Korean, English, or Japanese. — 세 나라 말로 부탁하세요'],
  ['8', '50–58초', '"たすけて!" → 사이렌 + OLED CALLING FAMILY 깜빡임', 'It calls for help — even in a blackout. No internet needed.'],
  ['9', '58–66초', '로봇 스스로 회전해 복귀, 할머니 미소, 따뜻한 음악', 'Then it quietly returns, and waits. — 그리고 조용히 다음을 기다립니다'],
  ['10', '66–75초', '로고 + 팀 4명 인사 → 가격/부스 안내 자막', 'GUARDIAN — Grandma is not alone anymore. | Team RoboMakers, Korea | $299'],
];
SB.push(new Table({ columnWidths: cw, width: { size: cw.reduce((a, b) => a + b), type: WidthType.DXA }, rows: sbRows.map((r, i) => cells(r, i === 0)) }));
SB.push(new Paragraph({ spacing: { before: 200 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA', space: 4 } },
  children: [t('촬영 팁: 컷 4·5는 로봇 눈높이(바닥 로우앵글)가 가장 극적입니다. 시계 화면 클로즈업은 밝기 최대로. 모든 컷은 실제 동작 그대로 촬영 가능하므로 CG가 필요 없습니다 — "전부 진짜"라는 점을 마지막 자막에 강조해도 좋습니다 (100% real footage).', { size: 18, color: '888888' })] }));

const doc3 = new Document({ styles: { default: { document: { run: { font: FONT, size: 21 } } } }, sections: [{ children: SB }] });

Promise.all([
  Packer.toBuffer(doc1).then(b => fs.writeFileSync('피칭대본_5분_지킴이.docx', b)),
  Packer.toBuffer(doc2).then(b => fs.writeFileSync('QA_예상질문_30선.docx', b)),
  Packer.toBuffer(doc3).then(b => fs.writeFileSync('홍보영상_스토리보드.docx', b)),
]).then(() => console.log('done x3'));
