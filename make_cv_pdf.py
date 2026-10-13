#!/usr/bin/env python3
"""
Generate an ATS-friendly one-page CV PDF (zain-khan-cv.pdf).

Rules applied for ATS compatibility:
- single column, no tables, no text boxes, no images
- standard built-in font (Helvetica), selectable text
- standard section headings, reverse-chronological experience
- plain ASCII, plain hyphens, no emoji or icons

Run:  python3 make_cv_pdf.py
"""
import os
from fpdf import FPDF
from fpdf.enums import XPos, YPos

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "zain-khan-cv.pdf")

NAME = "Zain Khan"
TITLE = "Brand & Growth Marketing Lead"
CONTACT = [
    "Dubai, UAE (open to relocating to Saudi Arabia)",
    "hello@zainkhan.me",
    "linkedin.com/in/01z",
]
SUMMARY = (
    "Brand and growth marketing lead with global DLT/Web3 experience. Built marketing "
    "functions from zero, secured 60+ partnerships, and scaled brands across regions. "
    "Now leading an AI-visibility practice and writing a book on GEO/SEO and AI search. "
    "Hands-on and outcome-focused."
)
SKILLS = [
    "Brand strategy & positioning",
    "Growth marketing & SEO/GEO",
    "Content & thought leadership",
    "Partnerships & business development",
    "Web3 / DLT marketing",
    "Marketing operations",
]
EXPERIENCE = [
    ("Founder, Brand & Growth Consultant", "OxD LLC", "Current", [
        "Leading an AI-visibility practice. Building Promptraise (AI-visibility suite) and Buzzz Agentic (agentic-AI marketing harness).",
        "Authoring a book on GEO/SEO and how brands win in AI search.",
    ]),
    ("Head of Marketing (ground-up)", "Itheum", "Dates to confirm", [
        "Built the marketing function from scratch for a global Web3/DLT startup.",
        "Secured 60+ global partnerships and established the brand across a global market.",
    ]),
    ("Marketing Operations", "Cointelegraph", "Dates to confirm", [
        "Scaled marketing operations across the UAE for the leading DLT media brand.",
        "Developed a global events platform and diversified the product line into node infrastructure.",
    ]),
    ("Earlier experience", "", "", [
        "Global trade and education background including olive-oil import/trade (Top Buyer, Fiera Milano 2015), EFL/trainer certification, and research consultancy.",
    ]),
]
EDUCATION = ["BSc Biotechnology", "MSc Anthropology", "TEFL / EFL trainer certification"]
CERTIFICATIONS = [
    "AIQI ISO/IEC 42001 (UKAS)",
    "L3 Master Trainer - CELPIP/CAEL, PTE",
    "Red Hat AI Foundations Executive",
    "Certified Career Coach",
    "WADA Anti-Doping Official",
]


def main():
    pdf = FPDF(format="A4", unit="mm")
    pdf.set_auto_page_break(auto=True, margin=13)
    pdf.set_margins(16, 13, 16)
    pdf.add_page()
    width = pdf.w - pdf.l_margin - pdf.r_margin
    NEXT = dict(new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def para(txt, size=9.5, style="", lh=4.6, color=(30, 30, 30)):
        pdf.set_font("Helvetica", style, size)
        pdf.set_text_color(*color)
        pdf.multi_cell(width, lh, txt, **NEXT)

    def heading(title):
        pdf.ln(2.6)
        pdf.set_font("Helvetica", "B", 10.5)
        pdf.set_text_color(20, 20, 20)
        pdf.cell(width, 5.5, title.upper(), **NEXT)
        y = pdf.get_y() + 0.6
        pdf.set_draw_color(170, 170, 170)
        pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)
        pdf.ln(2)

    def bullets(items):
        for it in items:
            pdf.set_font("Helvetica", "", 9.5)
            pdf.set_text_color(30, 30, 30)
            pdf.set_x(pdf.l_margin)
            pdf.cell(5, 4.6, "-")
            pdf.multi_cell(width - 5, 4.6, it, **NEXT)

    para(NAME, size=22, style="B", lh=10, color=(15, 15, 15))
    para(TITLE, size=11.5, style="B", lh=6, color=(60, 60, 60))
    pdf.ln(1.4)
    para("  |  ".join(CONTACT), size=9.5, lh=4.6, color=(70, 70, 70))

    heading("Professional Summary")
    para(SUMMARY)

    heading("Core Skills")
    para("  |  ".join(SKILLS))

    heading("Experience")
    for role, company, when, points in EXPERIENCE:
        line = role + (",  " + company if company else "")
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(20, 20, 20)
        pdf.cell(width, 5.2, line, **NEXT)
        if when:
            pdf.set_font("Helvetica", "I", 8.5)
            pdf.set_text_color(90, 90, 90)
            pdf.cell(width, 4.2, when, **NEXT)
        bullets(points)
        pdf.ln(1.4)

    heading("Education")
    bullets(EDUCATION)

    heading("Certifications")
    bullets(CERTIFICATIONS)

    pdf.output(OUT)
    print("wrote %s (%d page(s))" % (os.path.basename(OUT), pdf.pages_count))


if __name__ == "__main__":
    main()
