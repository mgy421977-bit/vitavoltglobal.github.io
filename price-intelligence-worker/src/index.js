/**
 * VITAVOLT GLOBAL — VITA Price Intelligence Gateway
 * Server-side source collector. No ANNE API and no browser-side supplier fetching.
 *
 * Deploy as a Cloudflare Worker.
 * Optional environment:
 *   ALLOWED_ORIGIN = https://vitavoltglobal.com
 *   SEARCH_API_URL = external search endpoint returning {results:[{url,title,snippet}]}
 *   SEARCH_API_KEY = secret for that endpoint, if required
 *
 * POST /price-intelligence
 * {
 *   market:"TR", items:[{
 *     bomIndex,item,unit,category,
 *     sourceUrls:[...]
 *   }]
 * }
 *
 * The gateway NEVER marks a price VERIFIED. It only returns evidence records.
 */
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function response(body, status = 200, origin = "*") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, "access-control-allow-origin": origin, "access-control-allow-methods": "POST,OPTIONS", "access-control-allow-headers": "content-type" }
  });
}

function num(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v ?? "").replace(/\s/g, "").replace(/\.(?=\d{3}(?:,|$))/g, "").replace(",", ".");
  const n = Number(s.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function normalizeCurrency(v) {
  const s = String(v || "").toUpperCase();
  if (s === "₺" || s === "TL" || s === "TRY") return "TRY";
  if (s === "$" || s === "USD") return "USD";
  if (s === "€" || s === "EUR") return "EUR";
  return s || null;
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\\s\\S]*?<\\/script>/gi, " ")
    .replace(/<style[\\s\\S]*?<\\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\\s+/g, " ")
    .trim();
}

function jsonLdProducts(html) {
  const out = [];
  const re = /<script[^>]*type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1].trim());
      const list = Array.isArray(data) ? data : [data];
      list.forEach(x => {
        const items = x && Array.isArray(x["@graph"]) ? x["@graph"] : [x];
        items.forEach(y => {
          if (!y || typeof y !== "object") return;
          const types = Array.isArray(y["@type"]) ? y["@type"] : [y["@type"]];
          if (!types.some(t => /product/i.test(String(t)))) return;
          const offers = Array.isArray(y.offers) ? y.offers : [y.offers];
          offers.filter(Boolean).forEach(o => {
            out.push({
              product: y.name || "",
              brand: y.brand && (y.brand.name || y.brand) || "",
              sku: y.sku || y.mpn || "",
              price: num(o.price),
              currency: normalizeCurrency(o.priceCurrency),
              availability: o.availability || "",
              url: o.url || ""
            });
          });
        });
      });
    } catch (_) {}
  }
  return out;
}

function visiblePriceHints(text) {
  const out = [];
  const re = /(?:₺|TL|TRY|USD|EUR|€|\\$)\\s*[0-9]{1,3}(?:[.\\s][0-9]{3})*(?:,[0-9]{1,2})?|[0-9]{1,3}(?:[.\\s][0-9]{3})*(?:,[0-9]{1,2})?\\s*(?:₺|TL|TRY|USD|EUR|€|\\$)/gi;
  let m;
  while ((m = re.exec(text)) && out.length < 12) out.push(m[0]);
  return out;
}

async function fetchSource(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Vitavolt-Price-Intelligence/1.0 (+https://vitavoltglobal.com/)",
        "accept": "text/html,application/xhtml+xml,application/json"
      }
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, contentType: res.headers.get("content-type") || "", body: text };
  } finally {
    clearTimeout(timer);
  }
}

async function search(item, env) {
  if (!env.SEARCH_API_URL) return [];
  const u = new URL(env.SEARCH_API_URL);
  u.searchParams.set("q", item.item + " " + item.category + " Türkiye fiyat");
  const headers = { "accept": "application/json" };
  if (env.SEARCH_API_KEY) headers.authorization = "Bearer " + env.SEARCH_API_KEY;
  try {
    const r = await fetch(u, { headers });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d.results) ? d.results.slice(0, 5) : [];
  } catch (_) {
    return [];
  }
}

async function collect(item, env) {
  const urls = Array.isArray(item.sourceUrls) ? item.sourceUrls.filter(Boolean).slice(0, 8) : [];
  const searchResults = await search(item, env);
  searchResults.forEach(x => { if (x && x.url) urls.push(x.url); });
  const unique = [...new Set(urls)];
  const evidence = [];
  for (const url of unique.slice(0, 8)) {
    try {
      const r = await fetchSource(url);
      if (!r.ok) continue;
      const products = jsonLdProducts(r.body);
      const text = stripHtml(r.body);
      const hints = visiblePriceHints(text);
      if (products.length) {
        products.forEach(p => {
          if (p.price && p.currency) evidence.push({
            bomIndex:item.bomIndex, item:item.item, unit:item.unit,
            researchedProduct:p.product, model:p.sku, brand:p.brand,
            unitPrice:p.price, currency:p.currency, priceBasis:"DIRECT_SOURCE",
            sourceUrl:url, sourceDate:new Date().toISOString().slice(0,10),
            confidence:"MEDIUM", verificationStatus:"REVIEW",
            evidence: p, notes:"JSON-LD Product/Offer kaynağından alındı."
          });
        });
      } else if (hints.length) {
        evidence.push({
          bomIndex:item.bomIndex, item:item.item, unit:item.unit,
          unitPrice:null, currency:null, priceBasis:"VISIBLE_PRICE_HINT",
          sourceUrl:url, sourceDate:new Date().toISOString().slice(0,10),
          confidence:"LOW", verificationStatus:"REVIEW",
          evidence:{priceHints:hints.slice(0,5)}, notes:"Sayfada fiyat işareti bulundu; ürün/birim eşleşmesi insan/ANNE incelemesi gerektirir."
        });
      }
    } catch (_) {}
  }
  return evidence;
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || "*";
    if (request.method === "OPTIONS") return response({}, 204, origin);
    const url = new URL(request.url);
    if (url.pathname === "/health") return response({ ok:true, service:"VITA Price Intelligence Gateway", version:"1.0.0" }, 200, origin);
    if (url.pathname !== "/price-intelligence" || request.method !== "POST") return response({error:"Not found"},404,origin);
    try {
      const body = await request.json();
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length) return response({error:"items gerekli"},400,origin);
      const records = [];
      for (const item of items.slice(0, 30)) records.push(...await collect(item, env));
      return response({
        schema:"VITA_PRICE_RESEARCH_RESULT",
        version:"1.0",
        market:body.market || "TR",
        researchedAt:new Date().toISOString(),
        records,
        policy:{ autoVerify:false, noSourceNoPrice:true, derivedExcluded:true }
      },200,origin);
    } catch (e) {
      return response({error:String(e && e.message || e)},400,origin);
    }
  }
};
