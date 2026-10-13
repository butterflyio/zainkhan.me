#!/usr/bin/env python3
"""
Build index.html from content.md.

Edit content.md, then run:  python3 build_content.py
Markers in index.html:  <!-- hero:start --> ... etc.

This regenerates the meta tags, hero, topbar links, social links, the catalog
sections, and the timeline. Everything else in index.html is left alone.
"""
import hashlib
import html
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(ROOT, "content.md")
INDEX = os.path.join(ROOT, "index.html")
IMG_DIR = os.path.join(ROOT, "images", "timeline")


def buildid():
    h = hashlib.sha1()
    for f in ("css/site.css", "js/app.js"):
        h.update(open(os.path.join(ROOT, f), "rb").read())
    return h.hexdigest()[:8]
RTL = {"ar", "ur", "he", "fa", "yi"}
CSSV = "15"
FONTS = ("https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@700"
         "&family=Noto+Sans+Devanagari:wght@700&family=Noto+Nastaliq+Urdu:wght@700"
         "&family=Noto+Sans+JP:wght@700&family=Noto+Sans+SC:wght@700&family=Noto+Sans+Thai:wght@700&display=swap")

PAGE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>__TITLE__</title>
  <meta name="description" content="__DESC__">
  <meta name="theme-color" content="#171411">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="__CANONICAL__">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="images/apple-touch-icon.png">
  <link rel="stylesheet" href="fonts/fonts.css?v=1">
  <link rel="stylesheet" href="css/site.css?v=__CSSV__">
</head>
<body data-state="home">
  <a class="skip" href="#main">Skip to content</a>
  <header class="topbar">
    <button type="button" class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="site-menu">Menu</button>
    <nav class="toplinks" id="site-menu" aria-label="Elsewhere">
__TOPBAR__
    </nav>
    <button type="button" class="brandmark" id="logo" aria-label="Zain Khan, go home" title="Home">
      <span class="wordmark">Zain<span class="dot">.</span></span>
    </button>
  </header>
  <main id="main" class="legal">
    <p class="signal-num">__KICKER__</p>
    <h1>__HEADING__</h1>
    <div class="essay">
__BODY__
    </div>
    <p class="back"><a class="linklike" href="index.html">&larr; Home</a></p>
  </main>
  <footer class="site-footer">
__FOOTER__
  </footer>
  <script src="js/app.js?v=__CSSV__"></script>
</body>
</html>
"""


def esc(s):
    return html.escape(str(s), quote=False)


def parse():
    lines = open(CONTENT, encoding="utf-8").read().splitlines()
    data = {"meta": {}, "hero": {"greetings": []}, "topbar": [], "social": [], "sections": [], "timeline": [], "privacy": []}
    cur = None
    in_greet = False
    sec = None
    ev = None

    def flush_sec():
        nonlocal sec
        if sec is not None:
            data["sections"].append(sec)
            sec = None

    def flush_ev():
        nonlocal ev
        if ev is not None:
            data["timeline"].append(ev)
            ev = None

    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("<!--"):
            continue
        if line.startswith("## "):
            flush_sec(); flush_ev()
            cur = line[3:].strip(); in_greet = False
            continue
        if line.startswith("### "):
            head = line[4:].strip()
            if cur == "Sections":
                flush_sec()
                num, _, title = head.partition("|")
                sec = {"num": num.strip(), "title": title.strip(), "paras": [], "tagline": ""}
            elif cur == "Timeline":
                flush_ev()
                year, _, title = head.partition("|")
                ev = {"year": year.strip(), "title": title.strip(), "photo": "", "caption": ""}
            elif cur == "Hero" and head.lower() == "greetings":
                in_greet = True
            continue
        if cur == "Meta":
            k, _, v = line.partition(":"); data["meta"][k.strip()] = v.strip()
        elif cur == "Hero":
            if in_greet:
                code, _, text = line.partition(":"); data["hero"]["greetings"].append((code.strip(), text.strip()))
            else:
                k, _, v = line.partition(":"); data["hero"][k.strip()] = v.strip()
        elif cur == "Topbar links":
            p = [x.strip() for x in line.split("|")]
            data["topbar"].append({"label": p[0], "href": p[1] if len(p) > 1 else "#"})
        elif cur == "Social links":
            p = [x.strip() for x in line.split("|")]
            data["social"].append({"label": p[0], "url": p[1] if len(p) > 1 else "", "icon": p[2] if len(p) > 2 else p[0].lower()})
        elif cur == "Sections" and sec is not None:
            if line.startswith("Tagline:"):
                sec["tagline"] = line.split(":", 1)[1].strip()
            else:
                sec["paras"].append(line)
        elif cur == "Timeline" and ev is not None:
            if line.startswith("photo:"):
                ev["photo"] = line.split(":", 1)[1].strip()
            elif line.startswith("caption:"):
                ev["caption"] = line.split(":", 1)[1].strip()
        elif cur == "Privacy":
            if line.lower().startswith("last-updated:"):
                data["privacy_last"] = line.split(":", 1)[1].strip()
            else:
                data["privacy"].append(line)
    flush_sec(); flush_ev()
    return data


def countdown_html(target):
    u = '<span class="unit"><b id="cd-%s">%s</b><i>%s</i></span>'
    return (
        '<span class="countdown" data-target="%s">' % esc(target) +
        (u % ("d", "000", "days")) + '<span class="sep">:</span>' +
        (u % ("h", "00", "hrs")) + '<span class="sep">:</span>' +
        (u % ("m", "00", "min")) + '<span class="sep">:</span>' +
        (u % ("s", "00", "sec")) +
        "</span>"
    )


def para_html(text, target):
    if "{{countdown}}" in text:
        before, _, after = text.partition("{{countdown}}")
        return "                <p>%s%s%s</p>" % (esc(before), countdown_html(target), esc(after))
    return "                <p>%s</p>" % esc(text)


def build_hero(d):
    gs = d["hero"]["greetings"]
    spans = []
    for i, (code, text) in enumerate(gs):
        cls = "g is-on" if i == 0 else "g"
        direction = "rtl" if code in RTL else "ltr"
        spans.append('          <span class="%s" lang="%s" dir="%s">%s</span>' % (cls, code, direction, esc(text)))
    first = gs[0][1] if gs else ""
    sr = "%s %s %s" % (first, d["hero"].get("greeting-label", ""), d["hero"].get("name", ""))
    return "\n".join([
        '        <p class="hello" aria-hidden="true" id="hello">',
        "\n".join(spans),
        "        </p>",
        '        <h1 class="sr-only">%s</h1>' % esc(sr.strip()),
    ])


def build_topbar(d, for_privacy=False):
    out = []
    for it in d["topbar"]:
        if it["href"] == "timeline" and not for_privacy:
            out.append('      <button type="button" class="linklike" data-view="timeline">%s</button>' % esc(it["label"]))
        elif it["href"] == "timeline":
            out.append('      <a href="index.html">%s</a>' % esc(it["label"]))
        else:
            out.append('      <a href="%s">%s</a>' % (esc(it["href"]), esc(it["label"])))
    out.append('      <a href="privacy.html" class="only-mobile">Privacy</a>')
    return "\n".join(out)


def build_footer(d, for_inner=False):
    items = []
    for it in d["topbar"]:
        if it["href"] == "timeline" and not for_inner:
            items.append('<button type="button" class="linklike" data-view="timeline">%s</button>' % esc(it["label"]))
        elif it["href"] == "timeline":
            items.append('<a href="index.html">%s</a>' % esc(it["label"]))
        else:
            items.append('<a href="%s">%s</a>' % (esc(it["href"]), esc(it["label"])))
    items.append('<a href="privacy.html">Privacy</a>')
    links = "\n        ".join(items)
    return ('      <nav class="footer-links" aria-label="Footer">\n        ' + links + '\n      </nav>\n'
            '      <span class="footer-brand">Zain<span class="dot">.</span></span>')


def build_social(d):
    out = []
    for it in d["social"]:
        url = it["url"] or "#top"
        out.append('        <a class="soc soc-%s" href="%s" aria-label="%s"><span class="ico"></span></a>'
                   % (esc(it["icon"]), esc(url), esc(it["label"])))
    return "\n".join(out)


def build_catalog(d, target):
    out = []
    for s in d["sections"]:
        sid = "s" + s["num"].replace(".", "")
        essay = [para_html(p, target) for p in s["paras"]]
        if s["tagline"]:
            essay.append('                <p class="tagline">%s</p>' % esc(s["tagline"]))
        out.append(
            '        <li data-id="%s">\n'
            '          <details class="cat-entry">\n'
            '            <summary class="cat-item"><span class="num">%s</span><span class="desc">%s</span></summary>\n'
            '            <div class="cat-body">\n'
            '              <div class="essay">\n%s\n'
            '              </div>\n'
            '            </div>\n'
            '          </details>\n'
            '        </li>' % (sid, esc(s["num"]), esc(s["title"]), "\n".join(essay))
        )
    return "\n\n".join(out)


def build_timeline(d):
    out = ['        <div class="tl">']
    for e in d["timeline"]:
        photo = e.get("photo")
        alt = esc(e.get("caption") or e["title"])
        if photo and os.path.exists(os.path.join(IMG_DIR, photo)):
            media = ('<img src="images/timeline/%s" alt="%s" loading="lazy" '
                     'decoding="async" width="1600" height="1000">' % (esc(photo), alt))
            attrs = ""
        else:
            media = "<span>Photo</span>"
            attrs = ' role="img" aria-label="Photo coming soon"'
        cap = '\n          <p class="cap">%s</p>' % esc(e["caption"]) if e.get("caption") else ""
        out.append(
            '        <div class="ev"><span class="dot" aria-hidden="true"></span><div class="card">\n'
            '          <p class="year">%s</p><h2>%s</h2>\n'
            '          <div class="media"%s>%s</div>%s\n'
            '        </div></div>' % (esc(e["year"]), esc(e["title"]), attrs, media, cap)
        )
    out.append("        </div>")
    return "\n".join(out)



CV_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CV - Zain Khan</title>
  <meta name="description" content="Zain Khan, Brand and Growth Marketing Lead. Download the CV.">
  <meta name="theme-color" content="#171411">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="https://zainkhan.me/cv.html">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="images/apple-touch-icon.png">
  <link rel="stylesheet" href="fonts/fonts.css?v=1">
  <link rel="stylesheet" href="css/site.css?v=__CSSV__">
  <link rel="stylesheet" href="css/cv.css?v=__CSSV__">
</head>
<body data-state="home">
  <a class="skip" href="#main">Skip to content</a>
  <header class="topbar">
    <button type="button" class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="site-menu">Menu</button>
    <nav class="toplinks" id="site-menu" aria-label="Elsewhere">
__TOPBAR__
    </nav>
    <button type="button" class="brandmark" id="logo" aria-label="Zain Khan, go home" title="Home">
      <span class="wordmark">Zain<span class="dot">.</span></span>
    </button>
  </header>
  <main id="main" class="cv">
__CVBODY__
  </main>
  <footer class="site-footer">
__FOOTER__
  </footer>
  <script src="js/app.js?v=__CSSV__"></script>
</body>
</html>
"""

def render_page(d, title, desc, canonical, kicker, heading, body, for_privacy=True):
    return (PAGE_TEMPLATE
            .replace("__TOPBAR__", build_topbar(d, for_privacy=for_privacy))
            .replace("__TITLE__", title)
            .replace("__DESC__", desc)
            .replace("__CANONICAL__", canonical)
            .replace("__KICKER__", kicker)
            .replace("__HEADING__", heading)
            .replace("__BODY__", body)
            .replace("__FOOTER__", build_footer(d, True))
            .replace("__FONTS__", FONTS)
            .replace("__CSSV__", CSSV))


def build_privacy(d):
    body = "\n".join('        <p>%s</p>' % esc(p) for p in d["privacy"])
    last = d.get("privacy_last")
    if last:
        body += '\n        <p class="meta-note">Last updated: %s.</p>' % esc(last)
    return render_page(d, "Privacy - Zain Khan", "How this site handles privacy. Short and plain.",
                       "https://zainkhan.me/privacy.html", "Privacy", "Privacy.", body)


def build_404(d):
    body = ('        <p>That page does not exist. It may have moved, or it was never here.</p>\n'
            '        <p>Head back to the start and pick an idea.</p>')
    return render_page(d, "Not found - Zain Khan", "Page not found.",
                       "https://zainkhan.me/404.html", "404", "Not found.", body)



def build_cv(d, body):
    return (CV_TEMPLATE
            .replace("__TOPBAR__", build_topbar(d, for_privacy=True))
            .replace("__CVBODY__", body)
            .replace("__FOOTER__", build_footer(d, True))
            .replace("__CSSV__", CSSV))


def replace_block(src, name, content):
    start = "<!-- %s:start -->" % name
    end = "<!-- %s:end -->" % name
    pat = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    if not pat.search(src):
        print("ERROR: markers for '%s' not found in index.html" % name, file=sys.stderr)
        sys.exit(1)
    return pat.sub(lambda m: start + "\n" + content + "\n" + end, src)


def replace_meta(src, d):
    title = d["meta"].get("title", "")
    desc = d["meta"].get("description", "")
    src = re.sub(r"<title>.*?</title>", lambda m: "<title>%s</title>" % esc(title), src, count=1)
    src = re.sub(r'(<meta name="description" content=")[^"]*(">)', lambda m: m.group(1) + esc(desc) + m.group(2), src, count=1)
    src = re.sub(r'(<meta property="og:title" content=")[^"]*(">)', lambda m: m.group(1) + esc(title) + m.group(2), src, count=1)
    src = re.sub(r'(<meta property="og:description" content=")[^"]*(">)', lambda m: m.group(1) + esc(desc) + m.group(2), src, count=1)
    src = re.sub(r'(<meta name="twitter:title" content=")[^"]*(">)', lambda m: m.group(1) + esc(title) + m.group(2), src, count=1)
    src = re.sub(r'(<meta name="twitter:description" content=")[^"]*(">)', lambda m: m.group(1) + esc(desc) + m.group(2), src, count=1)
    return src


def main():
    global CSSV
    CSSV = buildid()
    d = parse()
    target = d["hero"].get("countdown-target", "2030-12-16T00:00:00")
    src = open(INDEX, encoding="utf-8").read()
    src = replace_meta(src, d)
    src = replace_block(src, "hero", build_hero(d))
    src = replace_block(src, "topbar", build_topbar(d))
    src = replace_block(src, "social", build_social(d))
    src = replace_block(src, "catalog", build_catalog(d, target))
    src = replace_block(src, "timeline", build_timeline(d))
    src = replace_block(src, "footer", build_footer(d, False))
    src = re.sub(r'site\.css\?v=[^"]*', 'site.css?v=' + CSSV, src)
    src = re.sub(r'app\.js\?v=[^"]*', 'app.js?v=' + CSSV, src)
    open(INDEX, "w", encoding="utf-8").write(src)
    open(os.path.join(ROOT, "privacy.html"), "w", encoding="utf-8").write(build_privacy(d))
    open(os.path.join(ROOT, "404.html"), "w", encoding="utf-8").write(build_404(d))
    cv_body = open(os.path.join(ROOT, "cv-body.html"), encoding="utf-8").read()
    open(os.path.join(ROOT, "cv.html"), "w", encoding="utf-8").write(build_cv(d, cv_body))
    photos = sum(1 for e in d["timeline"] if e.get("photo") and os.path.exists(os.path.join(IMG_DIR, e["photo"])))
    print("built: %d sections, %d timeline events (%d with photos), privacy %d paras"
          % (len(d["sections"]), len(d["timeline"]), photos, len(d["privacy"])))


if __name__ == "__main__":
    main()
