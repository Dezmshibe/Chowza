import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { renderBusinessPage } from "./dist/server/entry-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 10000;
const DIST_DIR = path.join(__dirname, "dist");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

/*
|--------------------------------------------------------------------------
| Static assets
|--------------------------------------------------------------------------
*/

app.use(express.static(DIST_DIR));

/*
|--------------------------------------------------------------------------
| Public Business SSR
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| XML Sitemap
|--------------------------------------------------------------------------
*/

app.get("/sitemap.xml", async (req, res) => {
  try {
    const { data: businesses, error } = await supabase
      .from("businesses")
      .select("slug")
      .eq("is_published", true)
      .order("slug", { ascending: true });

    if (error) {
      console.error("Sitemap business lookup failed:", error);
      return res.status(500).type("text/plain").send("Unable to generate sitemap.");
    }

    const baseUrl = "https://chowza-jku1.onrender.com";

    const urls = [
      `${baseUrl}/`,
      `${baseUrl}/privacy`,
      `${baseUrl}/terms`,
      `${baseUrl}/refunds`,
      ...(businesses || []).map(
        (business) =>
          `${baseUrl}/business/${encodeURIComponent(business.slug)}`,
      ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`,
  )
  .join("\n")}
</urlset>`;

    return res
      .status(200)
      .type("application/xml")
      .set("Cache-Control", "public, max-age=3600")
      .send(xml);
  } catch (error) {
    console.error("Sitemap error:", error);
    return res.status(500).type("text/plain").send("Server error.");
  }
});
/*
|--------------------------------------------------------------------------
| Robots.txt
|--------------------------------------------------------------------------
*/

app.get("/robots.txt", (req, res) => {
  const robots = `User-agent: *
Allow: /

Sitemap: https://chowza-jku1.onrender.com/sitemap.xml
`;

  return res
    .status(200)
    .type("text/plain")
    .set("Cache-Control", "public, max-age=3600")
    .send(robots);
});
app.get("/business/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    /*
    |--------------------------------------------------------------------------
    | Load published business
    |--------------------------------------------------------------------------
    */

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select(
        "id, name, slug, description, logo_url, public_phone, whatsapp_number, public_address, is_published",
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (businessError) {
      console.error("Business lookup failed:", businessError);

      return res
        .status(500)
        .send("Unable to load business.");
    }

    if (!business) {
      return res
        .status(404)
        .send("Business not found.");
    }

    /*
    |--------------------------------------------------------------------------
    | Load available menu items
    |--------------------------------------------------------------------------
    */

    const { data: items, error: itemsError } = await supabase
      .from("menu_items")
      .select(
        "id, name, description, price, image_url, is_available, sort_order",
      )
      .eq("business_id", business.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("Menu lookup failed:", itemsError);

      return res
        .status(500)
        .send("Unable to load menu.");
    }

    /*
    |--------------------------------------------------------------------------
    | Render business HTML
    |--------------------------------------------------------------------------
    */

    const html = renderBusinessPage(
      business,
      items || [],
    );

    /*
    |--------------------------------------------------------------------------
    | SEO metadata
    |--------------------------------------------------------------------------
    */

    const title = `${business.name} | Chowza`;

    const description =
      business.description ||
      `Order from ${business.name} on Chowza.`;

    const previewImage =
      business.logo_url ||
      "https://chowza-jku1.onrender.com/icon.svg";

    const canonicalUrl =
      `https://chowza.onrender.com/business/${encodeURIComponent(slug)}`;

    /*
    |--------------------------------------------------------------------------
    | Structured data
    |--------------------------------------------------------------------------
    */

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: business.name,
      description,
      url: canonicalUrl,
      image: previewImage,
      telephone: business.public_phone || undefined,

      address: business.public_address
        ? {
            "@type": "PostalAddress",
            streetAddress: business.public_address,
          }
        : undefined,

      servesCuisine: "Food",

      provider: {
        "@type": "Organization",
        name: "Chowza",
        url: "https://chowza.onrender.com/",
      },
    };

    /*
    |--------------------------------------------------------------------------
    | Safely serialise JSON-LD
    |--------------------------------------------------------------------------
    */

    const jsonLd = JSON.stringify(structuredData)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

    /*
    |--------------------------------------------------------------------------
    | Complete HTML document
    |--------------------------------------------------------------------------
    */

    const fullHtml = `<!doctype html>
<html lang="en">

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>${escapeXml(title)}</title>

  <meta
    name="description"
    content="${escapeXml(description)}"
  />

  <link
    rel="canonical"
    href="${escapeXml(canonicalUrl)}"
  />

  <!-- Open Graph -->

  <meta
    property="og:title"
    content="${escapeXml(title)}"
  />

  <meta
    property="og:description"
    content="${escapeXml(description)}"
  />

  <meta
    property="og:type"
    content="website"
  />

  <meta
    property="og:url"
    content="${escapeXml(canonicalUrl)}"
  />

  <meta
    property="og:image"
    content="${escapeXml(previewImage)}"
  />

  <meta
    property="og:image:alt"
    content="${escapeXml(business.name)} on Chowza"
  />

  <!-- Twitter -->

  <meta
    name="twitter:card"
    content="summary_large_image"
  />

  <meta
    name="twitter:title"
    content="${escapeXml(title)}"
  />

  <meta
    name="twitter:description"
    content="${escapeXml(description)}"
  />

  <meta
    name="twitter:image"
    content="${escapeXml(previewImage)}"
  />

  <!-- Structured Data -->

  <script type="application/ld+json">${jsonLd}</script>

  <!-- Favicon -->

  <link
    rel="icon"
    type="image/svg+xml"
    href="/icon.svg"
  />

  <!-- Generated CSS -->

  <link
    rel="stylesheet"
    href="${getCssAsset()}"
  />

</head>

<body>

  <div id="root">${html}</div>

  <!-- Tell the client that this page was server-rendered -->

  <script>
    window.__CHOWZA_SSR__ = true;
  </script>

  <!-- Generated React application -->

  <script
    type="module"
    src="${getJsAsset()}"
  ></script>

</body>

</html>`;

    return res.send(fullHtml);

  } catch (error) {

    console.error("SSR error:", error);

    return res
      .status(500)
      .send("Server error.");
  }
});

/*
|--------------------------------------------------------------------------
| Client-side application fallback
|--------------------------------------------------------------------------
|
| Everything else continues to use the normal React application.
|
*/

app.get("*", (req, res) => {
  res.sendFile(
    path.join(DIST_DIR, "index.html"),
  );
});

/*
|--------------------------------------------------------------------------
| Google Search Console verification
|--------------------------------------------------------------------------
*/

app.get("/google0f9a3b5ae4cf7087.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "google0f9a3b5ae4cf7087.html"),
  );
});

/*
|--------------------------------------------------------------------------
| Client-side application fallback
|--------------------------------------------------------------------------
|
| Everything else continues to use the normal React application.
|
*/

app.get("*", (req, res) => {
  res.sendFile(
    path.join(DIST_DIR, "index.html"),
  );
});

/*
|--------------------------------------------------------------------------
| Start server
|--------------------------------------------------------------------------
*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Chowza server running on port ${PORT}`,
  );
});

/*
|--------------------------------------------------------------------------
| HTML escaping
|--------------------------------------------------------------------------
*/

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/*
|--------------------------------------------------------------------------
| Find generated CSS
|--------------------------------------------------------------------------
*/

function getCssAsset() {
  const assetsDir = path.join(
    DIST_DIR,
    "assets",
  );

  const file = fs
    .readdirSync(assetsDir)
    .find((name) => name.endsWith(".css"));

  if (!file) {
    throw new Error(
      "Could not find generated CSS asset.",
    );
  }

  return `/assets/${file}`;
}

/*
|--------------------------------------------------------------------------
| Find generated JavaScript
|--------------------------------------------------------------------------
*/

function getJsAsset() {
  const assetsDir = path.join(
    DIST_DIR,
    "assets",
  );

  const file = fs
    .readdirSync(assetsDir)
    .find(
      (name) =>
        name.endsWith(".js") &&
        name.startsWith("index-"),
    );

  if (!file) {
    throw new Error(
      "Could not find generated JavaScript asset.",
    );
  }

  return `/assets/${file}`;
}