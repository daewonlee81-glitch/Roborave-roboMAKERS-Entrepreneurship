const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const { FaHeartbeat, FaRobot, FaComments, FaWifi, FaPills, FaBell } = require('react-icons/fa');

const TEAL = '028090', DARK = '1E2761', CORAL = 'F96167', TINT = 'E6F4F5', GREY = '666666';

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
  const icRobotW = await icon(FaRobot, 'FFFFFF');

  const pres = new pptxgen();
  pres.defineLayout({ name: 'A4P', width: 8.27, height: 11.69 });
  pres.layout = 'A4P';
  const s = pres.addSlide();
  s.background = { color: 'FFFFFF' };
  const M = 0.45, W = 8.27 - 2 * M;

  // ---------- Header ----------
  s.addImage({ path: 'logo_B_robot.png', x: M, y: 0.3, w: 1.25, h: 1.25 });
  s.addText('GUARDIAN', { x: 1.9, y: 0.36, w: 5.9, h: 0.58, fontSize: 33, bold: true, color: DARK, fontFace: 'Arial', margin: 0 });
  s.addText('Alerts are not enough. We RUN to you.', { x: 1.9, y: 0.92, w: 5.9, h: 0.32, fontSize: 15, bold: true, color: CORAL, fontFace: 'Arial', margin: 0 });
  s.addText('A fall-rescue robot that goes to the elderly person\'s side — beyond notifications.', { x: 1.9, y: 1.24, w: 5.9, h: 0.28, fontSize: 11, color: GREY, fontFace: 'Arial', margin: 0 });

  // ---------- Problem stats ----------
  const statY = 1.72, statH = 1.02, statW = (W - 0.3) / 3;
  const stats = [
    ['684,000', 'fall deaths every year (WHO)', 'one life every 46 seconds'],
    ['1 in 6', 'people will be 65+ by 2050 (UN)', 'the world is aging fast'],
    ['8,000,000+', 'elderly live alone in Japan', '2,000,000+ more in Korea'],
  ];
  stats.forEach((st, i) => {
    const x = M + i * (statW + 0.15);
    s.addShape('roundRect', { x, y: statY, w: statW, h: statH, rectRadius: 0.06, fill: { color: TINT } });
    s.addText(st[0], { x, y: statY + 0.05, w: statW, h: 0.38, fontSize: 20, bold: true, color: CORAL, align: 'center', fontFace: 'Arial', margin: 0 });
    s.addText(st[1], { x: x + 0.06, y: statY + 0.44, w: statW - 0.12, h: 0.32, fontSize: 9, color: DARK, align: 'center', fontFace: 'Arial', margin: 0 });
    s.addText(st[2], { x: x + 0.06, y: statY + 0.76, w: statW - 0.12, h: 0.24, fontSize: 8, color: GREY, align: 'center', fontFace: 'Arial', margin: 0 });
  });

  // ---------- REAL WORKING PROTOTYPE 사진 ----------
  const phLabelY = 2.92;
  s.addText([
    { text: 'REAL WORKING PROTOTYPE', options: { bold: true, color: TEAL, fontSize: 13 } },
    { text: '   — built and tested by our team, live demo at the booth', options: { color: GREY, fontSize: 10, italic: true } },
  ], { x: M, y: phLabelY, w: W, h: 0.28, fontFace: 'Arial', margin: 0 });

  const phY = 3.26, phH = 1.83, phW = (W - 0.3) / 3;   // 4:3 사진 3장
  const photos = [
    ['photo_watch.jpg', 'The watch: fall detection + CALL ROBOT'],
    ['photo_both.jpg', 'Watch calls — robot answers'],
    ['photo_robot.jpg', 'Omni-wheels · line sensor · voice · dispenser'],
  ];
  photos.forEach((ph, i) => {
    const x = M + i * (phW + 0.15);
    s.addImage({ path: ph[0], x, y: phY, w: phW, h: phH, rounding: true });
    s.addShape('roundRect', { x, y: phY + phH - 0.3, w: phW, h: 0.3, rectRadius: 0.03, fill: { color: '1E2761', transparency: 18 } });
    s.addText(ph[1], { x: x + 0.04, y: phY + phH - 0.3, w: phW - 0.08, h: 0.3, fontSize: 7.5, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: 'Arial', margin: 0 });
  });

  // ---------- 3 feature cards ----------
  const featY = 5.32, featH = 1.92, featW = (W - 0.3) / 3;
  const feats = [
    [icHeart, 'Auto Fall Detection', 'Even when you can\'t press', 'Free-fall, impact and stillness checks plus gyro tip-over sensing. 10-second cancel stops false alarms.'],
    [icRobot, 'A Robot That Comes', 'To your side, with help', 'Follows the floor line to your side, stops safely with ultrasonic sensing, and hands out medicine.'],
    [icVoice, '3-Language Voice', 'Korean · English · Japanese', 'Fully offline voice recognition. Ask for medicine or call for help — no cloud, no internet.'],
  ];
  feats.forEach((f, i) => {
    const x = M + i * (featW + 0.15);
    s.addShape('roundRect', { x, y: featY, w: featW, h: featH, rectRadius: 0.07, fill: { color: 'FFFFFF' }, line: { color: TEAL, width: 1.25 } });
    s.addImage({ data: f[0], x: x + featW / 2 - 0.22, y: featY + 0.13, w: 0.44, h: 0.44 });
    s.addText(f[1], { x: x + 0.05, y: featY + 0.62, w: featW - 0.1, h: 0.26, fontSize: 11.5, bold: true, color: DARK, align: 'center', fontFace: 'Arial', margin: 0 });
    s.addText(f[2], { x: x + 0.05, y: featY + 0.87, w: featW - 0.1, h: 0.22, fontSize: 9.5, bold: true, color: TEAL, align: 'center', fontFace: 'Arial', margin: 0 });
    s.addText(f[3], { x: x + 0.12, y: featY + 1.12, w: featW - 0.24, h: 0.72, fontSize: 8, color: '444444', align: 'center', fontFace: 'Arial', margin: 0 });
  });

  // ---------- How it works ----------
  const flowY = 7.4, flowH = 1.62;
  s.addShape('roundRect', { x: M, y: flowY, w: W, h: flowH, rectRadius: 0.08, fill: { color: TEAL } });
  s.addText('HOW IT WORKS', { x: M + 0.25, y: flowY + 0.08, w: W - 0.5, h: 0.28, fontSize: 12.5, bold: true, color: 'FFFFFF', fontFace: 'Arial', margin: 0 });
  const steps = [
    ['1. DETECT', 'The watch senses the fall'],
    ['2. SIGNAL', 'Radio link — no internet'],
    ['3. RUN', 'The robot follows the line'],
    ['4. HELP', 'Medicine · family call'],
  ];
  const stW = (W - 0.5 - 0.9) / 4;
  const stepIcons = [icBell, icWifi, icRobotW, icPills];
  steps.forEach((st, i) => {
    const x = M + 0.25 + i * (stW + 0.3);
    s.addImage({ data: stepIcons[i], x: x + stW / 2 - 0.19, y: flowY + 0.4, w: 0.38, h: 0.38 });
    s.addText(st[0], { x: x - 0.1, y: flowY + 0.82, w: stW + 0.2, h: 0.24, fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial', margin: 0 });
    s.addText(st[1], { x: x - 0.15, y: flowY + 1.06, w: stW + 0.3, h: 0.42, fontSize: 8, color: 'CFEFF2', align: 'center', fontFace: 'Arial', margin: 0 });
    if (i < 3) s.addText('▶', { x: x + stW + 0.02, y: flowY + 0.42, w: 0.28, h: 0.36, fontSize: 13, color: 'CFEFF2', align: 'center', margin: 0 });
  });

  // ---------- Price + trust ----------
  const prY = 9.18, prH = 1.34;
  s.addShape('roundRect', { x: M, y: prY, w: 4.35, h: prH, rectRadius: 0.07, fill: { color: TINT } });
  s.addText('LAUNCH PRICE', { x: M + 0.18, y: prY + 0.08, w: 4.0, h: 0.26, fontSize: 10.5, bold: true, color: TEAL, fontFace: 'Arial', margin: 0 });
  s.addText([
    { text: '$299', options: { fontSize: 27, bold: true, color: DARK } },
    { text: '  watch + robot set', options: { fontSize: 10.5, color: GREY } },
  ], { x: M + 0.18, y: prY + 0.36, w: 4.0, h: 0.46, fontFace: 'Arial', margin: 0 });
  s.addText('Watch only $45  ·  Family alerts $4/mo  ·  B2G $249', { x: M + 0.18, y: prY + 0.88, w: 4.0, h: 0.26, fontSize: 9.5, color: '444444', fontFace: 'Arial', margin: 0 });

  s.addShape('roundRect', { x: M + 4.55, y: prY, w: W - 4.55, h: prH, rectRadius: 0.07, fill: { color: 'FFFFFF' }, line: { color: CORAL, width: 1.25 } });
  s.addText('WHY TRUST US', { x: M + 4.73, y: prY + 0.08, w: 2.6, h: 0.26, fontSize: 10.5, bold: true, color: CORAL, fontFace: 'Arial', margin: 0 });
  s.addText([
    { text: 'Every photo above is our real prototype', options: { bullet: { characterCode: '2022', indent: 8 }, breakLine: true } },
    { text: 'No internet required · blackout-proof', options: { bullet: { characterCode: '2022', indent: 8 }, breakLine: true } },
    { text: 'Prototype cost under $600 (limit $3,000)', options: { bullet: { characterCode: '2022', indent: 8 } } },
  ], { x: M + 4.73, y: prY + 0.36, w: W - 4.55 - 0.36, h: 0.9, fontSize: 9, color: '333333', fontFace: 'Arial', margin: 0, paraSpaceAfter: 3 });

  // ---------- Footer ----------
  s.addText([
    { text: 'Team RoboMakers (KOREA)', options: { bold: true, color: DARK } },
    { text: '   Seo-jun KIM · Tae-yang JANG · Seung-hun LEE · Seo-eun KIM   |   RoboRAVE 2026 Osaka — Entrepreneurial Challenge', options: { color: GREY } },
  ], { x: M, y: 10.68, w: W, h: 0.28, fontSize: 9, fontFace: 'Arial', align: 'center', margin: 0 });
  s.addText('"Grandma is not alone anymore."', { x: M, y: 11.0, w: W, h: 0.34, fontSize: 12.5, bold: true, italic: true, color: TEAL, align: 'center', fontFace: 'Arial', margin: 0 });

  await pres.writeFile({ fileName: 'Executive_Flyer_GUARDIAN_EN.pptx' });
  console.log('done flyer EN v3');
})();
