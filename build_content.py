#!/usr/bin/env python3
"""
Build index.html from content.md.

Edit content.md, then run:  python3 build_content.py
Markers in index.html:  <!-- hero:start --> ... etc.

This regenerates the meta tags, hero, topbar links, social links, the catalog
sections, and the timeline. Everything else in index.html is left alone.
"""
import html
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(ROOT, "content.md")
INDEX = os.path.join(ROOT, "index.html")
IMG_DIR = os.path.join(ROOT, "images", "timeline")
RTL = {"ar", "ur", "he", "fa", "yi"}


def esc(s):
    return html.escape(str(s), quote=False)


def parse():
    lines = open(CONTENT, encoding="utf-8").read().splitlines()
    data = {"meta": {}, "hero": {"greetings": []}, "topbar": [], "social": [], "sections": [], "timeline": []}
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
        '        <p class="nameintro">%s</p>' % esc(d["hero"].get("greeting-label", "")),
        '        <h1 class="name">%s</h1>' % esc(d["hero"].get("name", "")),
        '        <p class="sr-only">%s</p>' % esc(sr.strip()),
    ])


def build_topbar(d):
    out = []
    for it in d["topbar"]:
        if it["href"] == "timeline":
            out.append('      <button type="button" class="linklike" data-view="timeline">%s</button>' % esc(it["label"]))
        else:
            out.append('      <a href="%s">%s</a>' % (esc(it["href"]), esc(it["label"])))
    return "\n".join(out)


def build_social(d):
    out = []
    for it in d["social"]:
        url = it["url"] or "#top"
        out.append('        <a href="%s" aria-label="%s"><img src="images/%s.svg" alt="" width="24" height="24"></a>'
                   % (esc(url), esc(it["label"]), esc(it["icon"])))
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
    d = parse()
    target = d["hero"].get("countdown-target", "2030-12-16T00:00:00")
    src = open(INDEX, encoding="utf-8").read()
    src = replace_meta(src, d)
    src = replace_block(src, "hero", build_hero(d))
    src = replace_block(src, "topbar", build_topbar(d))
    src = replace_block(src, "social", build_social(d))
    src = replace_block(src, "catalog", build_catalog(d, target))
    src = replace_block(src, "timeline", build_timeline(d))
    open(INDEX, "w", encoding="utf-8").write(src)
    photos = sum(1 for e in d["timeline"] if e.get("photo") and os.path.exists(os.path.join(IMG_DIR, e["photo"])))
    print("built: %d sections, %d timeline events (%d with photos)" % (len(d["sections"]), len(d["timeline"]), photos))


if __name__ == "__main__":
    main()
