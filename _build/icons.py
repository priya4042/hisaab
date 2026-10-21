# Icons and share card for Hisaab, drawn with Pillow.
import os
from PIL import Image, ImageDraw, ImageFont
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); A = os.path.join(R, "assets")
INK, RED, SAF, PAGE = (14, 77, 69), (240, 123, 123), (242, 159, 5), (242, 246, 245)
def mark(size, pad, bg):
    S = size * 4; im = Image.new("RGBA", (S, S), bg); d = ImageDraw.Draw(im); k = S * (1 - 2 * pad) / 34; o = S * pad
    P = lambda x, y: (o + x * k, o + y * k)
    d.rounded_rectangle((*P(3, 2), *P(29, 32)), radius=4 * k, fill=INK)
    for x in (10, 12.5): d.line([P(x, 2.6), P(x, 31.4)], fill=RED, width=max(1, int(1.4 * k)))
    for y, x2 in ((11, 25), (17, 25), (23, 22)): d.line([P(15, y), P(x2, y)], fill=(225, 238, 235), width=int(2 * k))
    d.ellipse((*P(20, 19), *P(32, 31)), fill=SAF, outline=(255, 255, 255), width=int(1.8 * k))
    return im.resize((size, size), Image.LANCZOS)
mark(192, .04, (*PAGE, 255)).save(os.path.join(A, "icon-192.png"))
mark(512, .04, (*PAGE, 255)).save(os.path.join(A, "icon-512.png"))
mark(512, .16, (*PAGE, 255)).save(os.path.join(A, "icon-maskable.png"))
W, H = 1200, 630; im = Image.new("RGB", (W, H), (255, 255, 255)); d = ImageDraw.Draw(im)
for y in range(46, H, 44): d.line([(0, y), (W, y)], fill=(225, 233, 231), width=2)
for x in (70, 80): d.line([(x, 0), (x, H)], fill=(214, 69, 69), width=2)
F = lambda n, s: ImageFont.truetype(os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", n), s)
m = mark(120, 0, (0, 0, 0, 0)); im.paste(m, (120, 70), m)
d.text((260, 92), "Hisaab", font=F("segoeuib.ttf", 76), fill=INK)
rows = [("Income tax, old vs new", "FY 2026-27"), ("Salary, GST, FD, PPF", "SIP, EMI, HRA"), ("Free, English and Hindi", "no sign-up")]
for i, (a, b) in enumerate(rows):
    y = 270 + i * 88; d.text((120, y), a, font=F("segoeuib.ttf", 46), fill=(23, 32, 30))
    d.text((1080, y + 8), b, font=F("segoeui.ttf", 36), fill=(85, 101, 95), anchor="ra")
d.line([(120, 540), (1080, 540)], fill=(23, 32, 30), width=3); d.line([(120, 550), (1080, 550)], fill=(23, 32, 30), width=3)
im.save(os.path.join(A, "og.png"), optimize=True); print("ok")
