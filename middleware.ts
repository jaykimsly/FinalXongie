const JCC_URL = process.env.JCC_URL || "https://jcc.jaykimsly.co.za";
const SITE_DOMAIN = process.env.SITE_DOMAIN || "final-project-six-alpha.vercel.app";
const CACHE_TTL = 60_000;

let cached: { status: string; html: string | null; expiresAt: number } | null = null;

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.match(/\.(js|css|png|jpg|svg|ico|woff2?)$/)) return;

  if (cached && Date.now() < cached.expiresAt && cached.status === "ACTIVE") return;

  try {
    const res = await fetch(`${JCC_URL}/api/status/${SITE_DOMAIN}`);
    if (res.ok) {
      const data = await res.json();
      cached = { status: data.status, html: data.html, expiresAt: Date.now() + CACHE_TTL };
      if (data.status !== "ACTIVE") {
        return new Response(data.html || fallbackPage(), {
          status: 503,
          headers: { "Content-Type": "text/html", "Retry-After": "3600" },
        });
      }
    }
  } catch {}
}

export const config = { matcher: ["/((?!favicon.ico).*)"] };

function fallbackPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unavailable</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f1117;color:#e2e8f0}.c{text-align:center;padding:2rem}h1{font-size:1.25rem;margin-bottom:.5rem}</style>
</head><body><div class="c"><h1>Service Temporarily Unavailable</h1><p>Please try again later.</p></div></body></html>`;
}
