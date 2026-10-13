# Roadmap and parked ideas

Things we deliberately deferred. Nothing here is live.

## Outbound click tracking and short links
- Status: parked (enable when running ads)
- Where: `edge/go-redirect/`
- What: `go.zainkhan.me` and future short links that log the click, then redirect.
- Needs: Cloudflare API token (Workers Scripts:Edit, Workers Routes:Edit, Workers Analytics Engine:Edit) and Account ID.
- Later: Telegram bot deep link for per-person attribution.

## Analytics
- Cloudflare Web Analytics: cookieless, no consent banner. Optional.
- Microsoft Clarity: session replays, but needs a consent banner for UK/EU visitors. Only if replays are genuinely wanted.

## Search engines
- Google Search Console and Bing Webmaster Tools: verify the domain and submit `sitemap.xml`.

## CV
- Real experience dates to replace "Dates to confirm" in both `cv-body.html` and `make_cv_pdf.py`.
- Optionally unify the CV content into one editable source.

## Timeline
- Add photos and captions by dropping files in `incoming/`.

## Socials
- YouTube URL still a placeholder.
