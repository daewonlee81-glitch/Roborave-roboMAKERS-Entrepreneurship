const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');

const FONT = { ascii: 'Malgun Gothic', eastAsia: 'Malgun Gothic', hAnsi: 'Malgun Gothic' };
const t = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 22, bold: o.bold, color: o.color, italics: o.it });
const dir = (text) => new Paragraph({ children: [t('〔' + text + '〕', { size: 19, color: '888888', it: true })], spacing: { after: 110, line: 300 } });
const h = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 260, after: 130 },
  children: [t(text, { size: 25, bold: true, color: '1F4E79' })] });

// 한/영 교차: 한국어 대사 + 바로 아래 영어 대사
const sp2 = (name, ko, en) => [
  new Paragraph({
    children: [t('【' + name + '】 ', { bold: true, color: 'B4530A', size: 22 }), t(ko)],
    spacing: { after: 40, line: 330 },
  }),
  new Paragraph({
    children: [t('        ', {}), t(en, { color: '2E6DB4', it: true, size: 21 })],
    spacing: { after: 150, line: 320 },
  }),
];
const all2 = (ko, en) => [
  new Paragraph({
    children: [t('【다 함께 / ALL】 ', { bold: true, color: 'C00000', size: 22 }), t(ko, { bold: true })],
    spacing: { after: 40, line: 330 },
  }),
  new Paragraph({
    children: [t('        ', {}), t(en, { color: '2E6DB4', it: true, size: 21, bold: true })],
    spacing: { after: 150, line: 320 },
  }),
];
const title = (main, sub) => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [t(main, { size: 30, bold: true, color: '1F4E79' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 },
    children: [t(sub, { size: 20, color: '2E6DB4' })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E6DB4', space: 6 } } }),
];

const C = [];  // children

C.push(...title('발표 대본 (한/영 교차) — 오사카 세계대회 · 4인 팀',
  '지킴이 워치 & 출동 도우미 로봇 | 김서준(초5) · 장태양(초5) · 이승훈(초4) · 김서은(중1)'));

// ================= 1. 인사 =================
C.push(h('1. 인사와 팀 소개 (약 30초) — 김서준'));
C.push(dir('네 명이 나란히 서고, 첫 인사는 다 함께 크게'));
C.push(...all2('안녕하세요! (인사)', 'Hello, everyone! (bow)'));
C.push(...sp2('김서준', '저희는 한국에서 온 RoboMakers팀입니다. 팀원을 소개하겠습니다.',
  'We are team RoboMakers from South Korea. Let me introduce our team.'));
C.push(...sp2('장태양', '5학년 장태양입니다!', 'I am Tae-yang, 5th grade!'));
C.push(...sp2('이승훈', '4학년 이승훈입니다!', 'I am Seung-hun, 4th grade!'));
C.push(...sp2('김서은', '중학교 1학년 김서은입니다!', 'I am Seo-eun, 7th grade!'));
C.push(...sp2('김서준', '그리고 저는 5학년 김서준입니다. 오늘 저희가 소개할 작품은, 할머니 할아버지가 위험할 때 스스로 알아차리고 직접 달려가는 로봇 — "지킴이 워치와 출동 도우미 로봇"입니다.',
  'And I am Seo-jun, 5th grade. Today we present a robot that knows when a grandma or grandpa is in danger — and runs to help. The "Guardian Watch and Rescue Robot."'));

// ================= 2. 도입 질문 =================
C.push(h('2. 도입 질문 (약 20초) — 장태양'));
C.push(dir('질문하고 1~2초 멈추기'));
C.push(...sp2('장태양', '먼저 한 가지 질문을 드리고 싶습니다.', 'First, let me ask you a question.'));
C.push(...sp2('장태양', '여러분의 할머니, 할아버지가 집에 혼자 계시다가 갑자기 넘어지신다면, 어떻게 도움을 요청하실 수 있을까요?',
  'If your grandma or grandpa falls down at home, all alone — how can they call for help?'));
C.push(...sp2('장태양', '전화기가 멀리 있다면요? 불러도 아무도 없다면요?',
  'What if the phone is too far away? What if nobody can hear them?'));
C.push(...sp2('장태양', '저희 팀은 이 질문에서 출발했습니다.', 'Our team started from this question.'));

// ================= 3. 동기 1 =================
C.push(h('3. 발명 동기 ① — 우리의 경험과 한국 (약 25초) — 이승훈'));
C.push(dir('짧고 또렷하게, 진심을 담아서'));
C.push(...sp2('이승훈', '저희 할머니는 혼자 계시는 시간이 많습니다. 어느 날 "넘어졌는데 한참 동안 못 일어났어"라고 말씀하셨습니다. 크게 다치셨다면 아무도 몰랐을 것입니다.',
  'My grandmother spends a lot of time alone. One day, she said, "I fell down, and I could not get up for a long time." If she had been badly hurt, nobody would have known.'));
C.push(...sp2('이승훈', '한국은 작년에 "초고령사회"가 되었습니다. 다섯 명 중 한 명이 65세 이상입니다.',
  'Korea became a "super-aged society" last year. One out of five people is over 65.'));

// ================= 4. 동기 2 =================
C.push(h('4. 발명 동기 ② — 일본과 세계 (약 35초) — 김서은'));
C.push(dir('숫자는 손가락으로 표현'));
C.push(...sp2('김서은', '이곳 일본은 열 명 중 세 명이 65세 이상 — 세계에서 어르신 비율이 가장 높은 나라입니다. 혼자 사시는 어르신도 수백만 명입니다.',
  'Here in Japan, three out of ten people are over 65 — the highest in the world. Millions of elderly people live alone.'));
C.push(...sp2('김서은', '세계보건기구에 따르면 해마다 약 68만 명이 낙상으로 목숨을 잃습니다. UN은 2050년, 세계 여섯 명 중 한 명이 65세 이상이 될 거라고 합니다. 한국과 일본의 오늘이 곧 세계의 내일입니다.',
  'The WHO says about 680,000 people die from falls every year. The UN says by 2050, one in six people in the world will be over 65. Today\'s Korea and Japan will be tomorrow\'s world.'));
C.push(...sp2('김서은', '응급 버튼은 정신을 잃으면 누를 수 없고, 알림은 멀리 있는 가족에게 갈 뿐입니다. 그 순간 곁에 와 주는 것은 아무것도 없습니다. 그래서 저희는 직접 달려가는 로봇을 만들었습니다.',
  'An emergency button is useless if you faint. An alert only goes to a phone far away. Nothing actually comes to your side. So we built a robot that really comes.'));

// ================= 5. 작품 구성 =================
C.push(h('5. 작품 구성 (약 45초) — 이승훈'));
C.push(dir('시계, 로봇, 매트를 차례로 가리키며'));
C.push(...sp2('이승훈', '저희 작품은 세 부분입니다. 첫째, 손목의 "지킴이 워치". 6축 센서가 떨어짐, 충격, 무동작 세 단계를 확인해 넘어짐을 스스로 알아냅니다. 잘못 울리면 10초 안에 터치로 취소할 수 있습니다.',
  'Our project has three parts. First, the Guardian Watch. Its motion sensor checks three steps — falling, impact, and stillness — to detect a fall by itself. A wrong alarm can be canceled with one touch in ten seconds.'));
C.push(...sp2('이승훈', '둘째, 시계와 로봇은 인터넷 없이 통하는 무선으로 연결됩니다. 와이파이가 없어도, 정전이 되어도 동작합니다.',
  'Second, the watch and the robot talk by radio — no internet needed. It works without Wi-Fi, even in a blackout.'));
C.push(...sp2('이승훈', '셋째, "출동 도우미 로봇". 옴니휠 세 개로 어느 방향이든 움직이고, 바닥의 라인을 따라 길을 찾아가며, 초음파로 어르신 앞에 멈춥니다. 세 나라 말을 알아듣고, 약도 꺼내 줍니다.',
  'Third, the Rescue Robot. Three omni-wheels move it in any direction. It follows the line on the floor, and stops in front of the user with an ultrasonic sensor. It understands three languages — and hands out medicine.'));

// ================= 6. 시연 드라마 =================
C.push(h('6. 시연 — 미니 드라마 "혼자가 아니에요" (약 2분 30초) — 김서준(해설) · 장태양(할머니 역)'));
C.push(dir('무대 = 집 매트. 태양: 시계를 직접 손목에 착용, 할머니 역할. 서준: 해설 + 귀환 버튼 담당.'));
C.push(dir('★ 안전: 넘어지는 연기는 반드시 푹신한 매트 위에서, 무릎부터 천천히!'));
C.push(dir('★ 예비: 낙상이 감지되지 않으면 태양이 자연스럽게 시계의 빨간 버튼을 터치 (서준 예비 멘트 참고)'));

C.push(...sp2('김서준', '지금부터 짧은 이야기를 보여드리겠습니다. 제목은 "혼자가 아니에요". 여기는 혼자 사시는 할머니의 집입니다. 오늘은... 우리 장태양이 할머니가 되어 보겠습니다!',
  'Now, let us show you a short story. The title is "You Are Not Alone." This is the house of a grandma who lives alone. And today... our Tae-yang will be the grandma!'));
C.push(dir('태양: 허리를 굽히고 할머니 걸음으로 등장, 손목의 시계를 관객에게 보여줌'));
C.push(...sp2('장태양', '(할머니 목소리로) 아이고, 오늘도 좋은 아침이구나. 우리 강아지 밥 줘야지...',
  '(in a grandma voice) Oh my, another lovely morning. Time to feed my little dog...'));
C.push(dir('★ 태양: 천천히, 무릎부터 매트 위로 넘어진다. 그리고 움직이지 않는다. 2초 정적.'));
C.push(...sp2('김서준', '앗! 할머니가 넘어지셨습니다! 집에는 아무도 없습니다. 전화기는 저 멀리... 소리쳐도 들어줄 사람이 없습니다. 예전이라면, 여기서 이야기가 끝났을지도 모릅니다.',
  'Oh no! Grandma fell down! Nobody is home. The phone is far away... No one can hear her. In the old days, the story might have ended here.'));
C.push(...sp2('김서준', '하지만 — 손목의 지킴이 워치를 봐주세요! 주황색, 확인 중입니다... 노란색, 카운트다운! 여러분, 함께 세어 주세요! 다섯! 넷! 셋! 둘! 하나!',
  'But — look at the Guardian Watch! Orange — it is checking... Yellow — countdown! Everyone, count with us! Five! Four! Three! Two! One!'));
C.push(dir('(예비 멘트) 감지가 안 됐을 때 → 서준: "할머니는 힘을 내 빨간 버튼을 눌렀습니다!" / Tae-yang touches the red button'));
C.push(dir('로봇 경보음 → 출동'));
C.push(...sp2('김서준', '구조 신호 발신! 로봇이 잠에서 깨어났습니다! 경보를 울리며... 출동합니다! 바닥의 라인을 따라, 거실을 지나, 할머니에게 달려갑니다!',
  'Rescue signal sent! The robot wakes up! Sounding the alarm... it sets out! Following the line, through the living room, running to grandma!'));
C.push(dir('로봇이 초음파로 태양 앞 정지'));
C.push(...sp2('김서준', '초음파 센서가 할머니를 찾았습니다. 바로 앞에, 안전하게 멈췄습니다. 시계에는 "로봇 도착"! 이제 할머니는 로봇에게 말로 부탁할 수 있습니다.',
  'The ultrasonic sensor found grandma. It stopped safely, right in front of her. The watch says "Robot is here"! Now grandma can just talk to the robot.'));
C.push(dir('태양: 몸을 일으켜 앉으며, 로봇을 향해'));
C.push(...sp2('장태양', '(약하게) 로봇아... "약 주세요!"', '(weakly) Robot... "Medicine, please!"'));
C.push(dir('서보가 약 배출 → 태양이 약을 받아 든다'));
C.push(...sp2('김서준', '로봇이 약을 꺼내 드렸습니다!', 'The robot handed out the medicine!'));
C.push(...sp2('장태양', '그리고 우리 로봇은 일본어도 알아듣습니다. — "たすけてください!" (타스케테 쿠다사이!)',
  'And our robot understands Japanese, too. — "Tasukete kudasai!"'));
C.push(dir('사이렌! + OLED "HELP REQUEST / CALLING FAMILY" 깜빡임 + 허브 SOS 스크롤'));
C.push(...sp2('김서준', '응급 요청! 로봇이 사이렌을 울리고, 화면에 "가족을 부르는 중"을 표시하며 온 집안에 알립니다!',
  'Emergency! The robot sounds the siren and shows "Calling family" on its screen, alerting the whole house!'));
C.push(dir('태양: 미소 지으며 일어난다. 서준: 귀환 버튼을 누른다'));
C.push(...sp2('김서준', '할머니는 무사합니다. 상황 종료! 로봇은 스스로 180도 돌아, 라인을 따라 스테이션으로 복귀하고, 다시 조용히 다음 호출을 기다립니다.',
  'Grandma is safe. All clear! The robot turns around by itself, follows the line back to its station, and quietly waits for the next call.'));
C.push(...all2('할머니는, 이제 혼자가 아닙니다!', 'Grandma is not alone anymore!'));

// ================= 7. 해결한 문제 =================
C.push(h('7. 우리가 해결한 문제들 (약 40초) — 김서은'));
C.push(dir('"직접 부딪히고 해결했다"를 강조'));
C.push(...sp2('김서은', '만드는 동안 어려움이 많았습니다. 처음엔 로봇이 신호를 받고도 30초나 늦게 움직였습니다. 원인은 무선 칩의 절전 기능이었습니다. 절전을 끄고, 답장을 받을 때까지 재전송하게 바꿔 1초 안에 반응하게 만들었습니다.',
  'We had many problems. At first, the robot reacted thirty seconds late. The cause was the radio chip\'s power-saving mode. We turned it off and added re-sending until an answer comes — now it reacts in one second.'));
C.push(...sp2('김서은', '낙상 감지도 처음엔 시계를 책상에 놓기만 해도 울렸습니다. 자유낙하, 충격, 무동작 세 단계와 10초 카운트다운을 더해 오경보를 잡았습니다.',
  'Fall detection was hard, too. Just putting the watch on a desk set off the alarm. We added three checks — falling, impact, stillness — plus a countdown, and fixed the false alarms.'));
C.push(...sp2('김서은', '그리고 이런 대회장처럼 전파가 복잡한 곳을 위해, 두 기계가 서로를 기억해 1:1로 통신하게 만들었습니다.',
  'And for a crowded hall like this, we made the two devices remember each other and talk one-to-one, so signals do not get lost.'));

// ================= 8. 마무리 =================
C.push(h('8. 마무리 (약 30초) — 김서준 → 다 함께'));
C.push(dir('천천히, 진심을 담아. 마지막 인사는 3개 국어로'));
C.push(...sp2('김서준', '저희가 보여드리고 싶었던 것은 하나입니다. 기술은 알려주는 것에서 멈추지 않고, 곁으로 달려갈 수 있다는 것입니다.',
  'We wanted to show one thing: technology does not have to stop at sending alerts — it can run to your side.'));
C.push(...sp2('김서준', '앞으로는 보호자 스마트폰 알림과 어르신과 대화하는 AI도 넣고 싶습니다. 세계의 모든 할머니, 할아버지가 더 안전하시길 바랍니다.',
  'Next, we want to add family phone alerts and an AI that talks with the elderly. We hope every grandma and grandpa in the world can live more safely.'));
C.push(...all2('감사합니다! Thank you! ありがとうございました! (인사)',
  'Kamsahamnida! Thank you! Arigatou gozaimashita! (bow)'));

C.push(new Paragraph({ spacing: { before: 240 },
  border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA', space: 4 } },
  children: [t('※ 전체 약 5분 30초~6분 (한 언어 기준). 파란 이탤릭 = 영어 대사. 실제 발표에서 어떤 언어로 말할지(영어 위주 + 드라마 대사만 한/일 혼용 추천)는 리허설에서 결정. ※ 음성 명령("약 주세요", "たすけてください")은 반드시 장태양 목소리로 SEN0539에 학습되어 있어야 함! ※ 시연 전 점검: OLED "WATCH OK" / 로봇 스테이션 위치 / 시계·허브·파워뱅크 충전 / 낙상 연기 리허설(매트 필수).', { size: 18, color: '888888' })] }));

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  sections: [{ children: C }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/claude/watch_project/발표대본_한영교차_드라마_4인팀.docx', buf);
  console.log('done');
});
