# -*- coding: utf-8 -*-
"""Builds every Hisaab page from pages.py. Run: python _build/build.py"""
import os, html, json, sys
sys.path.insert(0, os.path.dirname(__file__))
from pages import PAGES, GROUPS

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://priya4042.github.io/hisaab/"
esc = lambda s: html.escape(str(s), quote=True)
def bi(en, hi): return f'<span data-only="en">{esc(en)}</span><span data-only="hi">{esc(hi)}</span>'

LOGO = ('<svg viewBox="0 0 34 34" aria-hidden="true"><rect x="3" y="2" width="26" height="30" rx="4" fill="#0E4D45"/>'
        '<path d="M10 2v30M12.5 2v30" stroke="#F07B7B" stroke-width="1.4"/><path d="M15 11h10M15 17h10M15 23h7" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>'
        '<circle cx="26" cy="25" r="6" fill="#F29F05" stroke="#fff" stroke-width="1.8"/></svg>')

def head(title, desc, path):
    url = BASE + path
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{BASE}assets/og.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0E4D45">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="assets/hisaab.css">
'''

def header(cur):
    links = [("./", "Calculators", "सभी कैलकुलेटर"), ("income-tax-calculator.html", "Income tax", "इनकम टैक्स"), ("salary-calculator.html", "Salary", "सैलरी"),
             ("emi-calculator.html", "EMI", "EMI"), ("gst-calculator.html", "GST", "GST")]
    here = ' aria-current="page"'
    nav = "".join(f'<a href="{h}"{here if h == cur else ""}>{bi(e, i)}</a>' for h, e, i in links)
    return f'''<a class="skip" href="#main">{bi("Skip to content", "सामग्री पर जाएँ")}</a>
<header class="top"><div class="wrap">
  <a class="brand" href="./">{LOGO}Hisaab</a>
  <nav class="nav" id="nav" aria-label="Main">{nav}</nav>
  <button class="tbtn nav-tog" id="nav-btn" aria-controls="nav" aria-expanded="false" aria-label="Menu">&#9776;</button>
  <button class="tbtn" id="lang-btn" type="button">हिं</button>
  <button class="tbtn" id="theme-btn" type="button" aria-label="Dark or light theme">&#9681;</button>
</div></header>
'''

def footer(scripts):
    links = "".join(f'<a href="{p["slug"]}.html">{bi(*p["name"])}</a>' for p in PAGES)
    return f'''<aside class="get-app" aria-label="Android app"><div class="wrap"><img src="https://priya4042.github.io/assets/apps/hisaab.png" alt="" width="52" height="52" loading="lazy"><p><b>{bi("Get the Hisaab app", "Hisaab ऐप पाएँ")}</b><span>{bi("Works offline, with reminders and more. Free for Android.", "ऑफ़लाइन चलता है, रिमाइंडर और भी बहुत कुछ। Android के लिए मुफ़्त।")}</span></p><a class="get-btn" href="https://github.com/priya4042/priya4042.github.io/releases/download/apps/hisaab-1.0.0-arm64.apk" download>{bi("Download for Android", "Android के लिए डाउनलोड")} <small>APK, 33 MB</small></a><span class="get-more"><a href="https://github.com/priya4042/priya4042.github.io/releases/download/apps/hisaab-1.0.0-old-phones.apk" download>{bi("Older phone?", "पुराना फ़ोन?")}</a> &middot; <a href="https://priya4042.github.io/download.html#how">{bi("How to install", "इंस्टॉल कैसे करें")}</a></span></div></aside><footer class="foot"><div class="wrap">
  <span>&copy; <span id="year">2026</span> Hisaab. {bi("A free tool by", "एक मुफ़्त टूल,")} <a href="https://priya4042.github.io/">Priya Tech Labs</a>. <a href="privacy.html">{bi("Privacy", "प्राइवेसी")}</a></span>
  <nav aria-label="All calculators">{links}</nav>
  <span>{bi("For planning only. Check final figures with your bank, employer or a tax professional.", "सिर्फ़ योजना के लिए। अंतिम आँकड़े अपने बैंक, कंपनी या टैक्स सलाहकार से जाँचें।")}</span>
  <span>{bi("Hisaab is not affiliated with the Income Tax Department, GST Council or any government body. Tax rules are taken from the Finance Act and incometax.gov.in; savings rates from the Department of Economic Affairs.", "Hisaab का आयकर विभाग, GST परिषद या किसी सरकारी संस्था से कोई संबंध नहीं है। टैक्स नियम वित्त अधिनियम और incometax.gov.in से, बचत दरें आर्थिक कार्य विभाग से ली गई हैं।")}</span>
</div></footer>
{scripts}
</body>
</html>
'''

def field(f):
    lab = bi(f["en"], f["hi"]); n = f["name"]; hid = f"f-{n}"
    help_ = f'<small>{bi(*f["help"])}</small>' if f.get("help") else ""
    if f["t"] == "num":
        attrs = f'type="number" id="{hid}" name="{n}" value="{f["d"]}" inputmode="decimal" step="{f["step"]}"'
        if f["mn"] is not None: attrs += f' min="{f["mn"]}"'
        if f["mx"] is not None: attrs += f' max="{f["mx"]}"'
        if f["money"]: attrs += " data-money"
        pre = f'<span class="pre">{esc(f["pre"])}</span>' if f["pre"] else ""
        suf = f'<span class="suf">{esc(f["suf"])}</span>' if f["suf"] else ""
        words = '<small data-words aria-hidden="true"></small>' if f["money"] and not help_ else ""
        return f'<div class="fld"><label for="{hid}">{lab}</label><div class="inp">{pre}<input {attrs}>{suf}</div>{help_}{words}</div>'
    if f["t"] == "seg":
        opts = "".join(f'<label><input type="radio" name="{n}" value="{v}"{" checked" if v == f["d"] else ""}><span>{bi(e, i)}</span></label>' for v, e, i in f["opts"])
        return f'<div class="fld" role="radiogroup" aria-labelledby="{hid}-l"><span class="lbl" id="{hid}-l">{lab}</span><div class="seg">{opts}</div></div>'
    if f["t"] == "sel":
        opts = "".join(f'<option value="{v}"{" selected" if v == f["d"] else ""}>{esc(e)}</option>' for v, e, i in f["opts"])
        return f'<div class="fld"><label for="{hid}">{lab}</label><select id="{hid}" name="{n}" data-hi=\'{esc(json.dumps([i for v, e, i in f["opts"]], ensure_ascii=False))}\'>{opts}</select></div>'
    if f["t"] == "chk":
        return f'<label class="check"><input type="checkbox" name="{n}"{" checked" if f["d"] else ""}>{lab}</label>'
    if f["t"] == "date":
        return f'<div class="fld"><label for="{hid}">{lab}</label><input type="date" id="{hid}" name="{n}" value="{f["d"]}"></div>'

def calc_page(p):
    sets = ""
    for legend, fields in p["sets"]:
        lg = f"<legend>{bi(*legend)}</legend>" if legend else f'<legend class="sr-only" hidden>{bi("Inputs", "इनपुट")}</legend>'
        sets += f'<fieldset>{lg}<div class="fgrid">{"".join(field(f) for f in fields)}</div></fieldset>'
    asof = f'<p><span class="asof">{bi(*p["asof"])}</span></p>' if p.get("asof") else ""
    about = "".join(f"<p>{bi(e, i)}</p>" for e, i in p.get("about", []))
    formula = f'<h2>{bi("The formula", "फ़ॉर्मूला")}</h2><p class="formula">{bi(*p["formula"])}</p>' if p.get("formula") else ""
    faq = "".join(f"<details><summary>{bi(q, qh)}</summary><p>{bi(a, ah)}</p></details>" for q, qh, a, ah in p.get("faq", []))
    names = {x["slug"]: x["name"] for x in PAGES}
    rel = "".join(f'<a href="{s}.html">{bi(*names[s])}</a>' for s in p.get("related", []))
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebApplication", "name": p["name"][0] + " calculator", "url": BASE + p["slug"] + ".html", "applicationCategory": "FinanceApplication",
         "operatingSystem": "Any", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "INR"}},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, qh, a, ah in p.get("faq", [])]}]}
    body = f'''<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
{header(p["slug"] + ".html")}
<main id="main" class="wrap">
  <section class="intro">
    <div class="crumbs"><a href="./">Hisaab</a> / {bi(*p["name"])}</div>
    <h1>{bi(*p["h1"])}</h1>
    <p class="lede">{bi(*p["lede"])}</p>
    {asof}
  </section>
  <div class="calc">
    <form class="form" id="calc-form" novalidate>{sets}<p class="hint">{bi("The result updates as you type.", "टाइप करते ही नतीजा बदलता है।")}</p></form>
    <section class="ledger" id="ledger" aria-live="polite" aria-label="Result"></section>
  </div>
  <details class="yt" id="yt" hidden><summary></summary><div class="tw"></div></details>
  <section class="sec">
    {f'<h2>{bi("How it works", "यह कैसे काम करता है")}</h2>{about}' if about else ""}
    {formula}
    {f'<h2>{bi("Questions", "सवाल")}</h2><div class="faq">{faq}</div>' if faq else ""}
    {f'<h2>{bi("Related calculators", "जुड़े कैलकुलेटर")}</h2><div class="related">{rel}</div>' if rel else ""}
  </section>
</main>
'''
    scripts = f'<script>window.HISAAB_CALC = "{p["calc"]}";</script>\n<script src="assets/calcs.js"></script>\n<script src="assets/core.js"></script>'
    return head(p["title"], p["desc"], p["slug"] + ".html") + body + footer(scripts)

def index():
    groups = ""
    for gid, gname in GROUPS:
        cards = "".join(f'<a class="card" href="{p["slug"]}.html" data-k="{esc(p["key"])}"><b>{bi(*p["name"])}</b><small>{bi(*p["lede"])}</small></a>'
                        for p in PAGES if p["group"] == gid)
        groups += f'<section class="group" aria-label="{esc(gname[0])}"><h2>{bi(*gname)}</h2><div class="cards">{cards}</div></section>'
    quick = (f'<fieldset><legend hidden>Quick tax check</legend><div class="fgrid">'
             f'{field(dict(t="num", name="salary", en="Your yearly salary", hi="आपकी सालाना सैलरी", d=1500000, pre="₹", suf=None, mn=0, mx=None, step="any", money=True, help=None))}'
             f'{field(dict(t="num", name="c80", en="80C investments (old regime)", hi="80C निवेश (पुरानी व्यवस्था)", d=150000, pre="₹", suf=None, mn=0, mx=None, step="any", money=True, help=None))}'
             f'</div></fieldset><p class="hint"><a href="income-tax-calculator.html">{bi("Add HRA, home loan and other deductions", "HRA, होम लोन और बाकी कटौतियाँ जोड़ें")}</a></p>')
    ld = {"@context": "https://schema.org", "@type": "WebSite", "name": "Hisaab", "url": BASE, "inLanguage": ["en-IN", "hi-IN"]}
    body = f'''<script type="application/ld+json">{json.dumps(ld)}</script>
</head>
<body>
{header("./")}
<main id="main" class="wrap">
  <section class="hero-calc">
    <div>
      <h1>{bi("Every money sum an Indian household does, worked out", "हर घर का पैसों का हिसाब, एक जगह")}</h1>
      <p class="lede" style="color:var(--muted);font-size:1.15rem">{bi("Income tax, salary, GST, FD, PPF, EMI and more. Free, in English and Hindi, and nothing you type leaves your phone.", "इनकम टैक्स, सैलरी, GST, FD, PPF, EMI और भी बहुत कुछ। मुफ़्त, हिंदी और अंग्रेज़ी में, और आपका डाला कुछ भी फ़ोन से बाहर नहीं जाता।")}</p>
      <p><span class="asof">{bi("Updated for Budget 2026", "बजट 2026 के अनुसार")}</span></p>
      <div class="find"><label for="find" class="lbl" style="font-weight:650">{bi("Find a calculator", "कैलकुलेटर ढूँढें")}</label><input id="find" type="search" placeholder="GST, PPF, EMI..." autocomplete="off"></div>
    </div>
    <div>
      <form class="form" id="calc-form" novalidate>{quick}</form>
    </div>
  </section>
  <section class="ledger" id="ledger" aria-live="polite" aria-label="Quick tax result" style="position:relative;top:auto;margin-top:4px"></section>
  {groups}
</main>
'''
    scripts = '<script>window.HISAAB_CALC = "quick";</script>\n<script src="assets/calcs.js"></script>\n<script src="assets/core.js"></script>'
    return head("Hisaab - Income Tax, Salary, GST, EMI and PPF Calculators", "Free Indian money calculators: income tax old vs new regime FY 2026-27, in-hand salary, GST, FD, RD, PPF, SIP, EMI, loan prepayment, HRA, age and percentage. In English and Hindi.", "") + body + footer(scripts)

def privacy():
    paras = [("Every calculation happens inside your browser. The numbers you type are not sent anywhere or stored on a server.", "हर गणना आपके ब्राउज़र में ही होती है। आपके डाले नंबर कहीं नहीं भेजे जाते, न किसी सर्वर पर रखे जाते हैं।"),
             ("Your inputs are kept in the page link so you can share a result. Anyone you send that link to will see those numbers.", "आपके इनपुट पेज के लिंक में रहते हैं ताकि आप नतीजा शेयर कर सकें। जिसे आप लिंक भेजेंगे, वह ये नंबर देखेगा।"),
             ("Your browser remembers your language and theme, and keeps the site files for offline use. The site is hosted on GitHub Pages and loads fonts from Google Fonts.", "आपका ब्राउज़र भाषा और थीम याद रखता है, और ऑफ़लाइन के लिए साइट की फ़ाइलें रखता है। साइट GitHub Pages पर है और फ़ॉन्ट Google Fonts से लेती है।")]
    body = f'''</head>
<body>
{header("privacy.html")}
<main id="main" class="wrap"><section class="intro">
<h1>{bi("Privacy", "प्राइवेसी")}</h1>{"".join(f"<p>{bi(e, h)}</p>" for e, h in paras)}
<p><a href="mailto:priyatechlabs9@gmail.com">priyatechlabs9@gmail.com</a></p></section></main>
'''
    return head("Privacy - Hisaab", "Hisaab works in your browser. Nothing you type is uploaded.", "privacy.html") + body + footer('<script src="assets/core.js"></script>')

def write(name, s):
    open(os.path.join(R, name), "w", encoding="utf-8", newline="\n").write(s); print("built", name)

if __name__ == "__main__":
    for p in PAGES: write(p["slug"] + ".html", calc_page(p))
    write("index.html", index()); write("privacy.html", privacy())
    urls = [""] + [p["slug"] + ".html" for p in PAGES] + ["privacy.html"]
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          "".join(f"  <url><loc>{BASE}{u}</loc></url>\n" for u in urls) + "</urlset>\n")
    write("robots.txt", f"User-agent: *\nAllow: /\nSitemap: {BASE}sitemap.xml\n")
    core = ["./", "index.html", "privacy.html", "assets/hisaab.css", "assets/core.js", "assets/calcs.js", "assets/icon.svg"] + [p["slug"] + ".html" for p in PAGES]
    sw = open(os.path.join(R, "_build", "sw.tpl.js"), encoding="utf-8").read().replace("/*CORE*/", json.dumps(core))
    write("sw.js", sw)
