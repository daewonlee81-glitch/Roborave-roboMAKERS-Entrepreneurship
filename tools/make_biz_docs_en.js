const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
        Table, TableRow, TableCell, WidthType, ShadingType } = require('docx');

const FONT = { ascii: 'Arial', eastAsia: 'Malgun Gothic', hAnsi: 'Arial' };
const t = (x, o = {}) => new TextRun({ text: x, font: FONT, size: o.size || 21, bold: o.bold, color: o.color, italics: o.it });
const dir = (x) => new Paragraph({ children: [t('[ ' + x + ' ]', { size: 19, color: '888888', it: true })], spacing: { after: 100, line: 300 } });
const h1 = (x) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: [t(x, { size: 25, bold: true, color: '1F4E79' })] });
const sp = (name, en) => new Paragraph({ children: [t('[' + name + ']  ', { bold: true, color: 'B4530A' }), t(en)], spacing: { after: 140, line: 330 } });
const title = (main, sub) => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 70 }, children: [t(main, { size: 30, bold: true, color: '1F4E79' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [t(sub, { size: 20, color: '2E6DB4' })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E6DB4', space: 6 } } }),
];

// ==================================================================
// 1) 5-min Pitch Script (English)
// ==================================================================
const P = [];
P.push(...title('Official Pitch Script (5 min) — Entrepreneurial Challenge', 'GUARDIAN | 5-min pitch + 5-min Q&A | English version'));
P.push(dir('This is the BUSINESS pitch, separate from the booth demo drama. The judges may have already seen the demo — here we sell the business.'));

P.push(h1('0:00–0:30  Opening Hook — Seo-jun KIM'));
P.push(sp('Seo-jun', 'Judges — every 46 seconds, someone in the world dies from a fall. And most of them died because no one was there. Hello, we are team RoboMakers, makers of GUARDIAN — the rescue robot that does not just alert, but RUNS.'));

P.push(h1('0:30–1:15  Problem & Market — Seung-hun LEE'));
P.push(sp('Seung-hun', 'In Korea, one in five people is over 65. In Japan, three in ten. Together, ten million elderly households live alone. Existing products have two problems: an emergency button is useless if you faint, and alert services end at a phone far away.'));
P.push(sp('Seung-hun', 'In the golden time, what you need is not a notification. It is someone — something — that comes to your side.'));

P.push(h1('1:15–2:15  Solution + 30-second Live Demo — Tae-yang JANG'));
P.push(dir('Bring the watch + robot to the pitch. Tae-yang wears the watch: button call → robot dispatch → "Medicine please" → dispense (30-second compressed demo)'));
P.push(sp('Tae-yang', 'GUARDIAN does three things. First, the watch detects a fall by itself — even if you cannot press a button. Second, the robot travels to your side, following the line. Third, you just talk to it — in Korean, English or Japanese — and it hands you medicine and calls your family. Let me show you in 30 seconds.'));
P.push(dir('Demo: call → dispatch → arrival → "Medicine please" → dispense → closing bow'));
P.push(sp('Tae-yang', 'As you saw — everything just worked with no internet, no Wi-Fi. Even in a blackout, GUARDIAN runs.'));

P.push(h1('2:15–3:15  Business Model — Seo-eun KIM'));
P.push(sp('Seo-eun', 'Our first customer is local government. Every Korean city has a senior-safety budget, and we enter those programs at a B2G price of $249 per set. Retail is $299 for the watch-and-robot set; production cost is $117 — about a 60% margin.'));
P.push(sp('Seo-eun', 'On top, a $4-a-month family-alert subscription. Just one thousand households means $48,000 of recurring revenue a year. We start with hardware, and grow with subscription.'));

P.push(h1('3:15–4:15  Competitive Edge & Scalability — Seo-jun KIM'));
P.push(sp('Seo-jun', 'Three things set us apart. First, no product yet connects detection to rescue in one system — we are preparing a patent on this link. Second, needing no internet, we can reach rural areas with poor connectivity. Third, offline voice in three languages means we designed for the global market from day one.'));
P.push(sp('Seo-jun', 'Next: a family smartphone app, a conversational AI companion, and a multi-user version for care facilities — one robot guarding a whole floor of residents. That is our roadmap.'));

P.push(h1('4:15–5:00  Vision Closing — All'));
P.push(sp('Seo-jun', 'We are elementary and middle school students. But what we built is not a toy — it is a working rescue system, and you can see it run at our booth today.'));
P.push(new Paragraph({ children: [t('[ALL]  ', { bold: true, color: 'C00000' }), t('Grandma is not alone anymore. Thank you!', { bold: true })], spacing: { after: 140 } }));
P.push(new Paragraph({ spacing: { before: 200 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA', space: 4 } },
  children: [t('* "46 seconds": WHO reports 684,000 fall deaths per year = roughly one every 46 seconds. * All figures: see the BOM & Pricing spreadsheet and the Business Model Canvas. * Practice the 5-min Q&A with the "Top 30 Expected Questions" document.', { size: 18, color: '888888' })] }));

const doc1 = new Document({ styles: { default: { document: { run: { font: FONT, size: 21 } } } }, sections: [{ children: P }] });

// ==================================================================
// 2) Top 30 Expected Q&A (English)
// ==================================================================
const QA = [];
QA.push(...title('Top 30 Expected Questions — Entrepreneurial Challenge', 'For the 5-min Q&A | English version | Assign an owner to each answer and practice'));

const qaData = [
  ['Technology', [
    ['How does it detect a fall?',
     'The accelerometer checks three stages — free-fall, impact, stillness — and the gyro catches slow tip-overs. A 10-second countdown filters false alarms.'],
    ['What happens on a false alarm?',
     'Touch the screen within ten seconds to cancel. Simply putting the watch down does not complete the three stages, so it does not even trigger.'],
    ['How does it communicate without internet?',
     'We use ESP-NOW short-range radio. The two devices remember each other, talk one-to-one, and re-send until acknowledged, so no signal is lost.'],
    ['How does the robot navigate?',
     'It follows a floor line with an 8-channel IR sensor using PID control, and stops safely in front of the person using ultrasonic sensing.'],
    ['What about homes without lines?',
     'The prototype uses lines; we also built and tested radio-signal (RSSI) homing. Camera/SLAM navigation is planned for the next version.'],
    ['How does voice work in three languages?',
     'The offline voice module learns phrases spoken by the user, so any language can be registered. No cloud needed.'],
    ['How long does the battery last?',
     'The watch targets a full day on 500mAh; demo settings (power-save off) are shorter. Production will sleep normally and wake on events to extend life.'],
    ['What if the demo fails?',
     'We have a second path (button call) and a third (voice). We designed for failure paths — which is exactly what a real product needs.'],
    ['Why LEGO SPIKE?',
     'For rapid prototyping. As our BOM shows, production switches to dedicated motors and chassis, dropping robot cost to about $95.'],
    ['What was the hardest problem?',
     'A 30-second delay caused by the radio power-saving mode. We traced it, disabled power-save, added acknowledged re-sending — now it reacts in one second.'],
  ]],
  ['Business', [
    ['Who is your first customer?',
     'Local governments. Senior-safety budgets already exist, they buy in volume, and public deployment drives consumer word-of-mouth.'],
    ['Why $299?',
     'It keeps a 60% margin over the $117 production cost, and is cheaper than two to three years of existing alert-service fees.'],
    ['How is it different from competitors?',
     'Existing products stop at detecting or alerting. We are the first consumer product to connect detection, travel, and on-site help.'],
    ['Market size?',
     'About ten million single-elderly households in Korea and Japan. Reaching just 1% — 100,000 homes — is roughly $30M in hardware revenue.'],
    ['Is revenue sustainable?',
     'Hardware plus a $4/month subscription for family alerts and care reports. Every thousand households adds $48,000 a year of recurring revenue.'],
    ['Any patent plans?',
     'We are preparing a filing on the wearable-detection-to-autonomous-rescue link, and would love to use the competition\'s IP advisory program.'],
    ['How will you manufacture?',
     'Start with a small-batch domestic assembly partner, validate through government pilot programs, then scale.'],
    ['Biggest risk?',
     'False alarms and missed falls. That is why we built 3-stage detection with cancel, and continuous algorithm improvement from pilot data is a key activity.'],
    ['Global plans?',
     'Our three-language voice is the answer. Japan — the most aged society — is our first overseas market, and today is the start.'],
    ['Why would cities buy at this price?',
     'Compared with annual per-person safety budgets, a one-time $249 is cheap — and it fills the overnight care gap staff cannot cover.'],
  ]],
  ['Team & Project', [
    ['Did you really build this yourselves?',
     'Yes. We ran the fall-threshold experiments, traced the power-save bug, tuned the PID gains. Ask us about any part — we can explain the code.'],
    ['How did you divide roles?',
     'Seo-jun: integration & presenting; Tae-yang: driving & demo; Seung-hun: watch & experiments; Seo-eun: comms & business. And we each understand the others\' parts.'],
    ['How long did it take?',
     'About ○ months from design to verification. The longest part was not building — it was finding out why things did not work.'],
    ['Did adults help?',
     'Our coach advised on direction, but wiring, code changes and experiments were done by the registered team members.'],
    ['What would you change next?',
     'Collect fall data for AI detection, line-free navigation, and a companion AI that talks with the elderly.'],
  ]],
  ['Safety & Scale', [
    ['What if the robot hits someone?',
     'It stops 15cm ahead using ultrasonic sensing, pauses for obstacles, and speed is limited to a walking-assist level.'],
    ['Any privacy issues?',
     'No camera, and voice is processed entirely on-device, offline. Data never leaves the home — that is a design principle.'],
    ['Is dispensing medicine risky?',
     'It dispenses only a single pre-loaded dose, only on request. Dose logs will go to family via the subscription report.'],
    ['Does it work in any home?',
     'The line track is an adhesive strip that works on any floor, and we plan to offer a mat-type track as well.'],
    ['How does it work in care facilities?',
     'A multi-user version — many watches, one robot — is on our roadmap. One corridor line can cover an entire floor.'],
  ]],
];

let qn = 1;
qaData.forEach(([cat, items]) => {
  QA.push(h1(cat));
  items.forEach(([qe, ae]) => {
    QA.push(new Paragraph({ children: [t(`Q${qn}. ${qe}`, { bold: true, color: '028090' })], spacing: { before: 90, after: 50, line: 320 } }));
    QA.push(new Paragraph({ children: [t('→ ' + ae)], spacing: { after: 110, line: 320 } }));
    qn++;
  });
});
const doc2 = new Document({ styles: { default: { document: { run: { font: FONT, size: 21 } } } }, sections: [{ children: QA }] });

// ==================================================================
// 3) Promo Video Storyboard (English)
// ==================================================================
const SB = [];
SB.push(...title('Promo Video Storyboard (75 seconds)', 'GUARDIAN | Optional submission for ES/MS — also loops at the booth'));
SB.push(new Paragraph({ children: [t('Shooting: smartphone, landscape. Music: calm → tense → warm. Captions: large English text (small Korean subtitles optional).', { size: 19, color: '666666' })], spacing: { after: 160 } }));

const cw = [700, 1000, 3800, 3800];
const cells = (arr, headRow = false) => new TableRow({
  children: arr.map((c, i) => new TableCell({
    width: { size: cw[i], type: WidthType.DXA },
    shading: headRow ? { type: ShadingType.CLEAR, fill: 'DCE9F7' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ children: [t(String(c), { bold: headRow, size: 18 })], spacing: { after: 0, line: 270 } })],
  })),
});
const sbRows = [
  ['Cut', 'Time', 'Scene', 'Caption / Narration'],
  ['1', '0–6s', 'Grandma (Tae-yang in role) watering a plant alone, seen from behind. Calm music.', 'Every 46 seconds, the world loses someone to a fall.'],
  ['2', '6–12s', 'She slowly falls (onto a mat). Screen darkens, music stops.', 'And most of them… were alone.'],
  ['3', '12–18s', 'Wrist close-up: watch turns orange CHECKING → yellow countdown.', 'But this watch noticed.'],
  ['4', '18–26s', 'Robot leaves the station with alert sound; low-angle shot of line driving.', 'GUARDIAN doesn\'t just alert. It RUNS.'],
  ['5', '26–34s', 'Crossing the living room, through the door into the bedroom (intercut with top-down mat view).', '(Driving sound emphasized — no caption)'],
  ['6', '34–40s', 'Ultrasonic stop in front of grandma; watch screen "ROBOT HERE" close-up.', 'It found her.'],
  ['7', '40–50s', 'Grandma: "Medicine please" → servo dispenses → close-up of hand receiving the pill.', 'Ask in Korean, English, or Japanese.'],
  ['8', '50–58s', '"Tasukete!" (Japanese) → siren + OLED CALLING FAMILY blinking.', 'It calls for help — even in a blackout. No internet needed.'],
  ['9', '58–66s', 'Robot turns by itself and returns; grandma smiles; warm music.', 'Then it quietly returns, and waits.'],
  ['10', '66–75s', 'Logo + the four team members bow → price / booth info caption.', 'GUARDIAN — Grandma is not alone anymore. | Team RoboMakers, Korea | $299'],
];
SB.push(new Table({ columnWidths: cw, width: { size: cw.reduce((a, b) => a + b), type: WidthType.DXA }, rows: sbRows.map((r, i) => cells(r, i === 0)) }));
SB.push(new Paragraph({ spacing: { before: 200 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA', space: 4 } },
  children: [t('Filming tips: cuts 4–5 are most dramatic at robot eye-level (floor low-angle). Watch close-ups: screen brightness at maximum. Every cut can be filmed exactly as the system really works — no CG needed. Consider ending with the caption "100% real footage."', { size: 18, color: '888888' })] }));

const doc3 = new Document({ styles: { default: { document: { run: { font: FONT, size: 21 } } } }, sections: [{ children: SB }] });

Promise.all([
  Packer.toBuffer(doc1).then(b => fs.writeFileSync('Pitch_Script_5min_GUARDIAN_EN.docx', b)),
  Packer.toBuffer(doc2).then(b => fs.writeFileSync('QA_Top30_GUARDIAN_EN.docx', b)),
  Packer.toBuffer(doc3).then(b => fs.writeFileSync('Promo_Storyboard_GUARDIAN_EN.docx', b)),
]).then(() => console.log('done x3 EN'));
