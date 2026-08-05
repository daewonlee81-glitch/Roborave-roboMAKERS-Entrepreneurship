const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const { FaHeartbeat, FaRobot, FaComments, FaWifi, FaPills, FaBell } = require('react-icons/fa');

const TEAL = '028090', DARK = '1E2761', CORAL = 'F96167', TINT = 'E6F4F5', GREY = '666666';
const KF = 'Malgun Gothic';

async function icon(Comp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: '#' + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

(async () => {
  const icHeart = await icon(FaHeartbeat, TEAL);
  const icRobot = await icon(FaRobot, TEAL);
  const icVoice = await icon(FaComments, TEAL);
  const icWifi  = await icon(FaWifi, 'FFFFFF');
  const icPills = await icon(FaPills, 'FFFFFF');
  const icBell  = await icon(FaBell, 'FFFFFF');

  const pres = new pptxgen();
  pres.defineLayout({ name: 'A4P', width: 8.27, height: 11.69 });
  pres.layout = 'A4P';
  const s = pres.addSlide();
  s.background = { color: 'FFFFFF' };
  const M = 0.45, W = 8.27 - 2 * M;

  // ---------- 헤더 ----------
  s.addImage({ path: 'logo_B_robot.png', x: M, y: 0.35, w: 1.35, h: 1.35 });
  s.addText([
    { text: 'GUARDIAN ', options: { color: DARK, bold: true } },
    { text: '지킴이', options: { color: TEAL, bold: true } },
  ], { x: 2.0, y: 0.42, w: 5.8, h: 0.62, fontSize: 34, fontFace: KF, margin: 0 });
  s.addText('Alerts are not enough. We RUN to you.', { x: 2.0, y: 1.02, w: 5.8, h: 0.34, fontSize: 15.5, bold: true, color: CORAL, fontFace: 'Arial', margin: 0 });
  s.addText('알림을 넘어, 어르신 곁으로 직접 달려가는 낙상 구조 로봇', { x: 2.0, y: 1.36, w: 5.8, h: 0.3, fontSize: 11.5, color: GREY, fontFace: KF, margin: 0 });

  // ---------- 문제 통계 (3 stat callouts) ----------
  const statY = 1.95, statH = 1.25, statW = (W - 0.3) / 3;
  const stats = [
    ['684,000', 'fall deaths every year (WHO)', '해마다 낙상으로 사망 (세계보건기구)'],
    ['1 in 6', 'people will be 65+ by 2050 (UN)', '2050년 세계 인구 6명 중 1명이 65세 이상'],
    ['8,000,000+', 'elderly live alone in Japan', '일본의 독거 어르신 (한국은 200만+)'],
  ];
  stats.forEach((st, i) => {
    const x = M + i * (statW + 0.15);
    s.addShape('roundRect', { x, y: statY, w: statW, h: statH, rectRadius: 0.06, fill: { color: TINT } });
    s.addText(st[0], { x, y: statY + 0.08, w: statW, h: 0.42, fontSize: 22, bold: true, color: CORAL, align: 'center', fontFace: 'Arial', margin: 0 });
    s.addText(st[1], { x: x + 0.06, y: statY + 0.52, w: statW - 0.12, h: 0.36, fontSize: 9.5, color: DARK, align: 'center', fontFace: 'Arial', margin: 0 });
    s.addText(st[2], { x: x + 0.06, y: statY + 0.88, w: statW - 0.12, h: 0.32, fontSize: 8.5, color: GREY, align: 'center', fontFace: KF, margin: 0 });
  });

  // ---------- 특징 3 카드 ----------
  const featY = 3.5, featH = 2.15, featW = (W - 0.3) / 3;
  const feats = [
    [icHeart, 'Auto Fall Detection', '낙상 자동 감지', 'Detects free-fall, impact and stillness — works even if you cannot press a button. 10s cancel stops false alarms.', '버튼을 못 눌러도 3단계+자이로로 자동 감지. 10초 취소로 오경보 방지.'],
    [icRobot, 'A Robot That Comes', '달려가는 로봇', 'Follows the floor line to your side, stops safely with ultrasonic sensing, and hands out medicine.', '라인을 따라 곁으로 이동, 초음파로 안전 정지, 약 전달까지.'],
    [icVoice, '3-Language Voice', '3개 국어 음성', 'Understands Korean, English and Japanese — offline. Ask for medicine or call for help by voice.', '한·영·일 오프라인 인식. 말로 약 요청, 응급 호출.'],
  ];
  feats.forEach((f, i) => {
    const x = M + i * (featW + 0.15);
    s.addShape('roundRect', { x, y: featY, w: featW, h: featH, rectRadius: 0.07, fill: { color: 'FFFFFF' }, line: { color: TEAL, width: 1.25 } });
    s.addImage({ data: f[0], x: x + featW / 2 - 0.26, y: featY + 0.16, w: 0.52, h: 0.52 });
    s.addText(f[1], { x: x + 0.05, y: featY + 0.74, w: featW - 0.1, h: 0.28, fontSize: 12, bold: true, color: DARK, align: 'center', fontFace: 'Arial', margin: 0 });
    s.addText(f[2], { x: x + 0.05, y: featY + 1.0, w: featW - 0.1, h: 0.24, fontSize: 10.5, bold: true, color: TEAL, align: 'center', fontFace: KF, margin: 0 });
    s.addText(f[3], { x: x + 0.12, y: featY + 1.26, w: featW - 0.24, h: 0.55, fontSize: 8, color: '444444', align: 'center', fontFace: 'Arial', margin: 0 });
    s.addText(f[4], { x: x + 0.12, y: featY + 1.8, w: featW - 0.24, h: 0.3, fontSize: 7.5, color: GREY, align: 'center', fontFace: KF, margin: 0 });
  });

  // ---------- How it works (티얼 밴드 + 4단계) ----------
  const flowY = 5.95, flowH = 1.9;
  s.addShape('roundRect', { x: M, y: flowY, w: W, h: flowH, rectRadius: 0.08, fill: { color: TEAL } });
  s.addText('HOW IT WORKS  |  작동 원리', { x: M + 0.25, y: flowY + 0.12, w: W - 0.5, h: 0.3, fontSize: 13, bold: true, color: 'FFFFFF', fontFace: 'Arial', margin: 0 });
  const steps = [
    ['1. DETECT', '시계가 낙상 감지', icBell],
    ['2. SIGNAL', '인터넷 없이 무선 전송', icWifi],
    ['3. RUN', '로봇이 라인 따라 출동', icRobot ? null : null],   // robot icon reuse below
    ['4. HELP', '약 전달 · 가족 호출', icPills],
  ];
  const stW = (W - 0.5 - 0.9) / 4;
  const icRobotW = await icon(FaRobot, 'FFFFFF');
  const stepIcons = [icBell, icWifi, icRobotW, icPills];
  steps.forEach((st, i) => {
    const x = M + 0.25 + i * (stW + 0.3);
    s.addImage({ data: stepIcons[i], x: x + stW / 2 - 0.21, y: flowY + 0.5, w: 0.42, h: 0.42 });
    s.addText(st[0], { x: x - 0.1, y: flowY + 0.98, w: stW + 0.2, h: 0.26, fontSize: 11.5, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial', margin: 0 });
    s.addText(st[1], { x: x - 0.15, y: flowY + 1.24, w: stW + 0.3, h: 0.45, fontSize: 8.5, color: 'CFEFF2', align: 'center', fontFace: KF, margin: 0 });
    if (i < 3) s.addText('▶', { x: x + stW + 0.02, y: flowY + 0.52, w: 0.28, h: 0.4, fontSize: 14, color: 'CFEFF2', align: 'center', margin: 0 });
  });

  // ---------- 가격 + 신뢰 요소 ----------
  const prY = 8.1, prH = 1.5;
  s.addShape('roundRect', { x: M, y: prY, w: 4.35, h: prH, rectRadius: 0.07, fill: { color: TINT } });
  s.addText('LAUNCH PRICE  |  출시 가격', { x: M + 0.18, y: prY + 0.1, w: 4.0, h: 0.28, fontSize: 11, bold: true, color: TEAL, fontFace: 'Arial', margin: 0 });
  s.addText([
    { text: '$299', options: { fontSize: 30, bold: true, color: DARK } },
    { text: '  (₩399,000)  watch + robot set', options: { fontSize: 11, color: GREY } },
  ], { x: M + 0.18, y: prY + 0.4, w: 4.0, h: 0.5, fontFace: 'Arial', margin: 0 });
  s.addText('Watch only $45  ·  Family alert subscription $4/mo', { x: M + 0.18, y: prY + 0.95, w: 4.0, h: 0.28, fontSize: 10, color: '444444', fontFace: 'Arial', margin: 0 });

  s.addShape('roundRect', { x: M + 4.55, y: prY, w: W - 4.55, h: prH, rectRadius: 0.07, fill: { color: 'FFFFFF' }, line: { color: CORAL, width: 1.25 } });
  s.addText('WHY TRUST US  |  검증', { x: M + 4.73, y: prY + 0.1, w: 2.6, h: 0.28, fontSize: 11, bold: true, color: CORAL, fontFace: 'Arial', margin: 0 });
  s.addText([
    { text: 'Working prototype — live demo at our booth', options: { bullet: { characterCode: '2022', indent: 8 }, breakLine: true } },
    { text: 'No internet required · blackout-proof', options: { bullet: { characterCode: '2022', indent: 8 }, breakLine: true } },
    { text: 'Prototype cost under $600 (limit $3,000)', options: { bullet: { characterCode: '2022', indent: 8 } } },
  ], { x: M + 4.73, y: prY + 0.42, w: W - 4.55 - 0.36, h: 0.95, fontSize: 9.5, color: '333333', fontFace: 'Arial', margin: 0, paraSpaceAfter: 4 });

  // ---------- 푸터 ----------
  s.addText([
    { text: 'Team RoboMakers (KOREA)', options: { bold: true, color: DARK } },
    { text: '   Seo-jun KIM · Tae-yang JANG · Seung-hun LEE · Seo-eun KIM   |   RoboRAVE 2026 Osaka — Entrepreneurial Challenge', options: { color: GREY } },
  ], { x: M, y: 10.05, w: W, h: 0.3, fontSize: 9.5, fontFace: 'Arial', align: 'center', margin: 0 });
  s.addText('"할머니는, 이제 혼자가 아닙니다"  —  "Grandma is not alone anymore."', { x: M, y: 10.42, w: W, h: 0.35, fontSize: 12, bold: true, italic: true, color: TEAL, align: 'center', fontFace: KF, margin: 0 });

  await pres.writeFile({ fileName: 'Executive_Flyer_지킴이.pptx' });
  console.log('done');
})();
