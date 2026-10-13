# go.zainkhan.me - short link + click tracking (PARKED)

Status: **not deployed.** Parked on purpose until we run ads or want attribution.
The site currently links the Telegram icon straight to Telegram, no redirect.

## What this does when enabled

A Cloudflare Worker on `go.zainkhan.me` (and any future short links such as
`go.zainkhan.me/x`, `go.zainkhan.me/linkedin`, etc.) that:

1. Receives the click.
2. Logs timestamp, path, referrer, user agent, country, city, and IP to
   Cloudflare Analytics Engine (dataset `go_redirect`) and to the console.
3. 302-redirects the visitor to the real destination.

This lets us attribute traffic from ads, posts, and the site itself, and lets us
change a destination without touching the website.

## Why we parked it

Tracking matters most when paying for ads. No ads yet, so a direct link is
simpler and there is nothing to maintain or break.

## To enable later

1. Set the real destination in `wrangler.toml` under `[vars] TELEGRAM_URL`.
2. Deploy:
   - `cd edge/go-redirect`
   - `npx wrangler login`
   - `npx wrangler deploy`
   Or give the agent a Cloudflare API token with:
   - Workers Scripts: Edit
   - Workers Routes: Edit
   - Workers Analytics Engine: Edit
   plus the Account ID. Store the token with `agent-key add cloudflare`.
3. Point the site icon (in `content.md`) at `https://go.zainkhan.me`.
4. Read the click log via the Analytics Engine SQL API, or `npx wrangler tail`.

## Upgrade path for real attribution

A plain redirect tells you *that* someone clicked and roughly where they are,
not *who* they are. For per-person attribution, point the short link at a
Telegram **bot** with a `?start=` deep link, so the bot learns the source. That
is the automation step for later.
