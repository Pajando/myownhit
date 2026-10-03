"""Draws the link-preview cards (og-card.jpg, og-card-es.jpg) and the icons.
Run from the repo root:  python3 setup/make_images.py
Uses fonts that ship with macOS (Georgia Bold Italic, Futura), so no downloads."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random, os

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets"))
random.seed(7)
INK = (22, 19, 61); PURPLE = (90, 0, 200); ROSA = (228, 0, 124); GOLD = (246, 168, 33); PAPER = (255, 244, 230); MUTED = (217, 212, 245)
G = "/System/Library/Fonts/Supplemental/Georgia Bold Italic.ttf"
FUT = "/System/Library/Fonts/Supplemental/Futura.ttc"


def record(size):
    S = size * 2  # draw large, shrink for smooth edges
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = S / 2
    d.ellipse([0, 0, S, S], fill=(12, 12, 16))
    r = c * 0.985
    while r > c * 0.37:
        v = random.randint(20, 38); d.ellipse([c - r, c - r, c + r, c + r], outline=(v, v, v + 4), width=max(1, S // 700)); r -= S / 260
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    sd.pieslice([0, 0, S, S], -58, -40, fill=(255, 236, 250, 22)); sd.pieslice([0, 0, S, S], 122, 138, fill=(255, 236, 250, 14))
    sh = sh.filter(ImageFilter.GaussianBlur(S / 60))
    lr = c * 0.37
    hole = Image.new("L", (S, S), 255); ImageDraw.Draw(hole).ellipse([c - lr, c - lr, c + lr, c + lr], fill=0)
    disc = Image.new("L", (S, S), 0); ImageDraw.Draw(disc).ellipse([0, 0, S, S], fill=255)
    from PIL import ImageChops
    sh.putalpha(ImageChops.multiply(sh.getchannel("A"), ImageChops.multiply(hole, disc)))
    im = Image.alpha_composite(im, sh); d = ImageDraw.Draw(im)
    lr = c * 0.34
    d.ellipse([c - lr, c - lr, c + lr, c + lr], fill=ROSA)
    m = S * 0.014
    d.ellipse([c - lr + m, c - lr + m, c + lr - m, c + lr - m], outline=GOLD, width=max(2, S // 180))
    d.ellipse([c - S * 0.012, c - S * 0.012, c + S * 0.012, c + S * 0.012], fill=INK)
    return im.resize((size, size), Image.LANCZOS)


def card(path, small, h1a, h1b, sub):
    W, H = 1200, 630
    # neon purple (left) meeting neon blue (right), like the site background
    im = Image.new("RGBA", (W, H))
    stops = [(0, (90, 0, 200)), (0.38, (76, 8, 204)), (0.5, (58, 25, 207)), (0.62, (10, 47, 212)), (1, (0, 54, 214))]
    px = im.load()
    for x in range(W):
        t = x / (W - 1)
        for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
            if t0 <= t <= t1:
                k = (t - t0) / (t1 - t0); col = tuple(int(c0[i] + (c1[i] - c0[i]) * k) for i in range(3)); break
        for y in range(H): px[x, y] = col + (255,)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    g.ellipse([-500, -150, 260, 780], fill=(176, 38, 255, 150)); g.ellipse([940, -150, 1700, 780], fill=(0, 179, 255, 130))
    im = Image.alpha_composite(im, glow.filter(ImageFilter.GaussianBlur(70)))
    rec = record(500).resize((500, 318), Image.LANCZOS)  # squash into an ellipse for a tilted look
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(shadow).ellipse([725, 240, 1225, 568], fill=(0, 0, 0, 150))
    im = Image.alpha_composite(im, shadow.filter(ImageFilter.GaussianBlur(24)))
    im.alpha_composite(rec, (705, 196))
    d = ImageDraw.Draw(im)
    d.text((70, 70), small, font=ImageFont.truetype(G, 40), fill=PAPER)
    f = ImageFont.truetype(G, 96)
    d.text((66, 172), h1a, font=f, fill=PAPER); d.text((66, 284), h1b, font=f, fill=PAPER)
    fs = ImageFont.truetype(FUT, 34); y = 432
    for line in sub:
        d.text((70, y), line, font=fs, fill=MUTED); y += 46
    d.rectangle([70, 556, 190, 562], fill=(255, 201, 77))
    im.convert("RGB").save(path, quality=88)


card("og-card.jpg", "My Own Hit", "Your story.", "Your song.", ["A real song about your life,", "in English, Spanish, or both."])
card("og-card-es.jpg", "Mi Propio Hit", "Tu historia.", "Tu canción.", ["Una canción de verdad sobre tu vida,", "en español, inglés o los dos."])
for size, name in [(180, "apple-touch-icon.png"), (32, "favicon-32.png"), (512, "icon-512.png")]:
    bg = Image.new("RGBA", (size, size), PURPLE + (255,))
    r = record(int(size * 0.86)); bg.alpha_composite(r, ((size - r.width) // 2, (size - r.height) // 2))
    bg.convert("RGB").save(name)
print("done")
