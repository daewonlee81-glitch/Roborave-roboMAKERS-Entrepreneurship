import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyBboxPatch, Circle, Ellipse
import matplotlib.font_manager as fm
import numpy as np

kf = None
for f in fm.findSystemFonts():
    if 'NotoSansCJK' in f:
        kf = f; break
prop = fm.FontProperties(fname=kf)

W, H = 1000, 600
LW_MM = 20
WALL = '#c8c8c8'
WALL_W = 10

def draw_mat(ax, annotate=False, border=True):
    ax.add_patch(Rectangle((0, 0), W, H, fc='white', ec='#333333' if border else 'none', lw=2 if border else 0))

    # ---- 방 바닥색 ----
    ax.add_patch(Rectangle((25, 25), 650, 550, fc='#f2f7fb', ec='none'))   # 거실
    ax.add_patch(Rectangle((685, 410), 290, 165, fc='#fdf0f0', ec='none')) # 안방
    ax.add_patch(Rectangle((685, 25), 290, 375, fc='#eef7ee', ec='none'))  # 주방

    # ---- 벽 ----
    def wall_h(x0, x1, y):
        ax.add_patch(Rectangle((x0, y - WALL_W/2), x1 - x0, WALL_W, fc=WALL, ec='none'))
    def wall_v(y0, y1, x):
        ax.add_patch(Rectangle((x - WALL_W/2, y0), WALL_W, y1 - y0, fc=WALL, ec='none'))
    wall_v(25, 400, 680)      # 거실|주방 (위쪽 열림 = 안방 문)
    wall_h(680, 975, 405)     # 주방|안방

    # ---- 가구 ----
    # 로봇 스테이션 (노란 점선 박스)
    ax.add_patch(FancyBboxPatch((55, 75), 230, 210, boxstyle="round,pad=6",
                                fc='#fff3cc', ec='#d9a520', lw=2, ls='--'))
    # 소파 + TV
    ax.add_patch(FancyBboxPatch((70, 430), 240, 110, boxstyle="round,pad=8",
                                fc='#cfe2f3', ec='#9bc0e0', lw=1.5))
    ax.add_patch(Rectangle((380, 548), 250, 30, fc='#d9d9e8', ec='#b0b0cc', lw=1.5))
    # 화분
    ax.add_patch(Circle((640, 60), 32, fc='#d8ecd8', ec='#88bb88', lw=1.5))
    ax.add_patch(Circle((60, 555), 0.1, fc='none', ec='none'))
    # 주방 조리대 + 식탁
    ax.add_patch(Rectangle((700, 40), 260, 65, fc='#e8d9b5', ec='#c9b98d', lw=1.5))
    ax.add_patch(Ellipse((840, 240), 150, 105, fc='#d8ecd8', ec='#a8cfa8', lw=1.5))
    for dx, dy in [(-95, 0), (95, 0), (0, 75), (0, -75)]:
        ax.add_patch(Circle((840 + dx, 240 + dy), 22, fc='#e8f4e8', ec='#a8cfa8', lw=1.2))
    # 침대 (안방, 오른쪽 세로) + 협탁
    ax.add_patch(FancyBboxPatch((885, 425), 82, 145, boxstyle="round,pad=5",
                                fc='#fbe3e3', ec='#dba0a0', lw=2))
    ax.add_patch(FancyBboxPatch((900, 430), 52, 40, boxstyle="round,pad=3",
                                fc='white', ec='#dba0a0', lw=1.2))

    # ---- 라인 (폭 20mm) ----
    def hline(x0, x1, y):
        ax.add_patch(Rectangle((x0, y - LW_MM/2), x1 - x0, LW_MM, fc='black', ec='none'))
    def vline(y0, y1, x):
        ax.add_patch(Rectangle((x - LW_MM/2, y0), LW_MM, y1 - y0, fc='black', ec='none'))
    def arc(cx, cy, r, a0, a1):
        th = np.linspace(np.radians(a0), np.radians(a1), 60)
        inner, outer = r - LW_MM/2, r + LW_MM/2
        xs = np.concatenate([cx + outer*np.cos(th), (cx + inner*np.cos(th))[::-1]])
        ys = np.concatenate([cy + outer*np.sin(th), (cy + inner*np.sin(th))[::-1]])
        ax.fill(xs, ys, 'black', ec='none')

    vline(100, 260, 130)        # ★ 스테이션 T자 (귀환 도착 인식)
    hline(130, 450, 180)
    arc(450, 330, 150, 270, 360)   # 우→상 커브 R150
    vline(330, 350, 600)
    arc(750, 350, 150, 90, 180)    # 상→우 커브 R150
    hline(750, 850, 500)
    vline(430, 570, 850)        # ★ 침대 앞 T자

    # ---- 라벨 ----
    lc = '#999999'
    big = 13 if annotate else 26
    for x, y, s, fs in [(390, 470, '거실 Living Room', big),
                        (820, 330, '주방 Kitchen', 11 if annotate else 22),
                        (762, 545, '안방 Bedroom', 10 if annotate else 20)]:
        ax.text(x, y, s, ha='center', fontsize=fs,
                fontproperties=prop, color=lc, fontweight='bold')
    ax.text(170, 300, '로봇 스테이션', ha='center', va='center',
            fontsize=8 if annotate else 16, fontproperties=prop, color='#b8860b')

    if annotate:
        ax.text(130, 60, '스테이션 T자\n(귀환 도착)', ha='center', fontsize=8,
                fontproperties=prop, color='#B00000')
        ax.text(742, 443, '침대 앞 T자', ha='center', fontsize=8,
                fontproperties=prop, color='#B00000')
        ax.annotate('R150', (505, 245), fontsize=8, color='#B00000', fontproperties=prop)
        ax.annotate('R150', (660, 435), fontsize=8, color='#B00000', fontproperties=prop)
        ax.text(500, -40, '매트 1000×600mm | 라인 폭 20mm | 곡선 R150 | 라인 양끝 T자 | 무광(매트) 인쇄',
                ha='center', fontsize=10, fontproperties=prop, color='#333333')

# ---- 도안 (주석 포함) ----
fig, ax = plt.subplots(figsize=(10, 6.6), dpi=150)
ax.set_xlim(-40, 1040); ax.set_ylim(-70, 680)
ax.set_aspect('equal'); ax.axis('off')
draw_mat(ax, annotate=True)
ax.text(500, 625, '지킴이 로봇 시연 매트 1000×600 — 양끝 T자 (왕복형)', ha='center', fontsize=14,
        fontproperties=prop, fontweight='bold')
plt.tight_layout()
plt.savefig('demo_mat_1000x600_design.png', bbox_inches='tight', facecolor='white')

# ---- 실측 인쇄용 PDF (1000×600mm) ----
MM2IN = 1/25.4
fig2, ax2 = plt.subplots(figsize=(W*MM2IN, H*MM2IN))
ax2.set_xlim(0, W); ax2.set_ylim(0, H)
ax2.set_aspect('equal'); ax2.axis('off')
ax2.set_position([0, 0, 1, 1])
draw_mat(ax2, annotate=False)
plt.savefig('demo_mat_1000x600_print.pdf', facecolor='white')

# ---- 인쇄소 접수용: 테두리 없는 실측 150dpi PNG ----
fig3, ax3 = plt.subplots(figsize=(W*MM2IN, H*MM2IN))
ax3.set_xlim(0, W); ax3.set_ylim(0, H)
ax3.set_aspect('equal'); ax3.axis('off')
ax3.set_position([0, 0, 1, 1])
draw_mat(ax3, annotate=False, border=False)
plt.savefig('mat_print_rgb_150dpi.png', dpi=150, facecolor='white')
print('OK')
