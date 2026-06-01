const JCC_URL = process.env.JCC_URL || "https://jcc.jaykimsly.co.za";
const SITE_DOMAIN = process.env.SITE_DOMAIN || "final-project-six-alpha.vercel.app";
const CACHE_TTL = 60_000;

let cached: { status: string; expiresAt: number } | null = null;

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.match(/\.(js|css|png|jpg|svg|ico|woff2?)$/)) return;

  if (cached && Date.now() < cached.expiresAt && cached.status === "ACTIVE") return;

  try {
    const res = await fetch(`${JCC_URL}/api/status/${SITE_DOMAIN}`);
    if (res.ok) {
      const data = await res.json();
      cached = { status: data.status, expiresAt: Date.now() + CACHE_TTL };
      if (data.status !== "ACTIVE") {
        return new Response(suspensionPage(data.message), {
          status: 503,
          headers: { "Content-Type": "text/html", "Retry-After": "3600" },
        });
      }
    }
  } catch {}
}

export const config = { matcher: ["/((?!favicon.ico).*)"] };

function suspensionPage(message?: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unavailable</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb}
.c{text-align:center;padding:2rem;max-width:420px}h1{font-size:1.25rem;margin-bottom:.5rem}p{color:#6b7280;font-size:.9rem}</style>
</head><body><div class="c"><h1>Service Temporarily Unavailable</h1>
<p>${message || "Please try again later."}</p>
</div></body></html>`;
}
