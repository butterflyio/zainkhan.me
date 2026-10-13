/*
  go.zainkhan.me -> Telegram, with click logging.

  Each hit is logged (timestamp, path, referrer, user agent, country, city, IP)
  to Cloudflare Analytics Engine (dataset "go_redirect") and to the console
  (visible with: npx wrangler tail). Then the visitor is redirected to Telegram.

  Set the destination in wrangler.toml under [vars] TELEGRAM_URL.
*/
export default {
  async fetch(request, env) {
    const dest = env.TELEGRAM_URL;
    const url = new URL(request.url);

    const log = {
      ts: new Date().toISOString(),
      path: url.pathname + url.search,
      ref: request.headers.get("referer") || "",
      ua: request.headers.get("user-agent") || "",
      country: (request.cf && request.cf.country) || "",
      city: (request.cf && request.cf.city) || "",
      ip: request.headers.get("cf-connecting-ip") || "",
    };

    if (env.CLICKS) {
      env.CLICKS.writeDataPoint({
        indexes: [log.ts],
        blobs: [log.path, log.ref, log.ua, log.country, log.city, log.ip],
        doubles: [1],
      });
    }
    console.log("go-redirect", JSON.stringify(log));

    if (!dest) {
      return new Response("go.zainkhan.me is not configured yet.", { status: 503 });
    }
    return Response.redirect(dest, 302);
  },
};
