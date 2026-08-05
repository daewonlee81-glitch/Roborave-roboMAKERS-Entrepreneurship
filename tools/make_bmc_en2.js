const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const { FaHandshake, FaCogs, FaMicrochip, FaShieldAlt, FaComments, FaStore,
        FaUsers, FaCalculator, FaDollarSign, FaBell, FaWifi, FaRobot, FaPills } = require('react-icons/fa');

const TEAL = '028090', TINT = 'E6F4F5', DARK = '1E2761', CORAL = 'F96167', GREY = '555555';
const KF = 'Arial';

async function icon(Comp, color) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: '#' + color, size: 128 }));
  const buf = await sharp(Buffer.from(svg)).resize(128, 128).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

(async () => {
  const ic = {
    kp: await icon(FaHandshake, TEAL),  ka: await icon(FaCogs, TEAL),
    kr: await icon(FaMicrochip, TEAL),  vp: await icon(FaShieldAlt, 'FFFFFF'),
    cr: await icon(FaComments, TEAL),   ch: await icon(FaStore, TEAL),
    cs: await icon(FaUsers, TEAL),      cost: await icon(FaCalculator, TEAL),
    rev: await icon(FaDollarSign, CORAL),
    bell: await icon(FaBell, 'FFFFFF'), wifi: await icon(FaWifi, 'FFFFFF'),
    robot: await icon(FaRobot, 'FFFFFF'), pills: await icon(FaPills, 'FFFFFF'),
  };

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';

  function block(s, x, y, w, h, head, lines, ik, opts = {}) {
    const fillC = opts.fill || TINT;
    const headC = opts.headColor || TEAL;
    const textC = opts.textColor || '333333';
    s.addShape('roundRect', { x, y, w, h, rectRadius: 0.06, fill: { color: fillC },
      line: { color: 'CFE6E8', width: 0.75 } });
    if (ik) s.addImage({ data: ik, x: x + 0.08, y: y + 0.07, w: 0.24, h: 0.24 });
    s.addText(head, { x: x + 0.38, y: y + 0.05, w: w - 0.46, h: 0.32,
      fontSize: 12, bold: true, color: headC, fontFace: KF, margin: 0, valign: 'middle' });
    s.addText(lines.map((t, i) => ({ text: t, options: { bullet: { characterCode: '2022', indent: 8 }, breakLine: i < lines.length - 1 } })),
      { x: x + 0.10, y: y + 0.42, w: w - 0.2, h: h - 0.52, fontSize: 10, color: textC,
        fontFace: KF, valign: 'top', margin: 0, paraSpaceAfter: 4 });
  }

  const s = pres.addSlide();
  s.background = { color: 'FFFFFF' };

  // ---------- 헤더: 로고 + 제목 ----------
  s.addImage({ path: 'logo_B_robot.png', x: 0.35, y: 0.06, w: 0.62, h: 0.62 });
  s.addText('Business Model Canvas — GUARDIAN', { x: 1.05, y: 0.09, w: 8.4, h: 0.38, fontSize: 22, bold: true, color: DARK, fontFace: KF, margin: 0 });
  s.addText('"We don\'t just alert. We RUN to you."', { x: 1.05, y: 0.44, w: 5.5, h: 0.26, fontSize: 11, italic: true, color: CORAL, fontFace: KF, margin: 0 });
  s.addText('Team RoboMakers  |  RoboRAVE 2026 Osaka Entrepreneurial Challenge', { x: 9.0, y: 0.12, w: 3.95, h: 0.5, fontSize: 10.5, color: GREY, fontFace: KF, align: 'right', valign: 'middle', margin: 0 });

  const x0 = 0.4, colW = 2.45, gap = 0.06;
  const X = [x0, x0 + (colW + gap), x0 + 2 * (colW + gap), x0 + 3 * (colW + gap), x0 + 4 * (colW + gap)];
  const yTop = 0.78, mainH = 4.62, halfH = (mainH - 0.08) / 2;

  block(s, X[0], yTop, colW, mainH, 'Key Partners',
    ['Local governments & welfare centers', 'Elderly care agencies', 'Component manufacturers', 'Senior community networks', 'Insurers (silver safety plans)'], ic.kp);
  block(s, X[1], yTop, colW, halfH, 'Key Activities',
    ['Improving fall-detection AI', 'Mass-production & safety certification', 'Family alert app development'], ic.ka);
  block(s, X[1], yTop + halfH + 0.08, colW, halfH, 'Key Resources',
    ['3-stage + gyro fall detection', 'Internet-free radio protocol', 'Offline voice AI in 3 languages', 'Patent pending (detect-and-rescue link)'], ic.kr);
  block(s, X[2], yTop, colW, mainH, 'Value Proposition',
    ['Automatic fall detection — works even if you can\'t press a button', 'A robot that comes to your side with medicine & help', 'Works without internet or Wi-Fi (even in blackouts)', 'Voice commands in Korean, English, Japanese', 'False-alarm protection (3-stage check + 10s cancel)'],
    ic.vp, { fill: TEAL, headColor: 'FFFFFF', textColor: 'FFFFFF' });
  block(s, X[3], yTop, colW, halfH, 'Customer Relationships',
    ['Real-time family app alerts (planned)', 'Monthly care reports', 'Admin portal for city welfare staff'], ic.cr);
  block(s, X[3], yTop + halfH + 0.08, colW, halfH, 'Channels',
    ['Government welfare programs (B2G)', 'Care center partnerships', 'Online stores & TV shopping (B2C)'], ic.ch);
  block(s, X[4], yTop, colW, mainH, 'Customer Segments',
    ['1st: Elderly living alone', '  ~2M households in Korea', '  ~8M in Japan', '2nd: Working adult children', '3rd: Local governments', '  using senior-safety budgets'], ic.cs);

  const yBot = yTop + mainH + 0.1, botH = 1.28;
  const botW = (X[4] + colW - x0 - 0.08) / 2;
  block(s, x0, yBot, botW, botH, 'Cost Structure',
    ['Parts: ~$22 per watch, ~$95 per robot (at scale)', 'R&D, safety certification, tooling & assembly', 'Marketing, support, app server'], ic.cost);
  block(s, x0 + botW + 0.08, yBot, botW, botH, 'Revenue Streams',
    ['Bundle $299 (watch + robot) — ~60% margin', 'Watch only $45 / extra watch for couples', 'Subscription $4/mo — family alerts & care reports'], ic.rev, { headColor: CORAL });

  // ---------- 하단: HOW IT WORKS 흐름 스트립 ----------
  const fy = yBot + botH + 0.1, fh = 0.52;
  s.addShape('roundRect', { x: x0, y: fy, w: X[4] + colW - x0, h: fh, rectRadius: 0.06, fill: { color: DARK } });
  s.addText('HOW IT WORKS', { x: x0 + 0.18, y: fy, w: 1.7, h: fh, fontSize: 11, bold: true, color: 'FFFFFF', fontFace: KF, valign: 'middle', margin: 0 });
  const steps = [
    [ic.bell, '1. DETECT', 'watch senses the fall'],
    [ic.wifi, '2. SIGNAL', 'radio link, no internet'],
    [ic.robot, '3. RUN', 'robot follows the line'],
    [ic.pills, '4. HELP', 'medicine + family call'],
  ];
  const fx0 = x0 + 2.0, fw = (X[4] + colW - fx0 - 0.2) / 4;
  steps.forEach((st, i) => {
    const x = fx0 + i * fw;
    s.addImage({ data: st[0], x, y: fy + 0.13, w: 0.26, h: 0.26 });
    s.addText([
      { text: st[1] + '  ', options: { bold: true, color: 'FFFFFF' } },
      { text: st[2], options: { color: 'AFD8DC' } },
    ], { x: x + 0.3, y: fy, w: fw - 0.35, h: fh, fontSize: 9.5, fontFace: KF, valign: 'middle', margin: 0 });
    if (i < 3) s.addText('▶', { x: x + fw - 0.32, y: fy, w: 0.24, h: fh, fontSize: 11, color: '5a7d9a', valign: 'middle', align: 'center', margin: 0 });
  });

  await pres.writeFile({ fileName: 'Business_Model_Canvas_GUARDIAN_EN.pptx' });
  console.log('done bmc EN v2');
})();
