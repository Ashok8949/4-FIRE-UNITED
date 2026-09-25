const API_ROOT = "http://siambhau69.eu.cc";
const API_BASE = `${API_ROOT}/freefireinfo`;

// Secondary free API
const SECONDARY_API_ROOT = "https://freefireinfo-zy9l.onrender.com/api/v1";


// HL Gaming Official unified Banner + Outfit image API.
// Credentials MUST stay in Worker environment variables.
const HL_GAMING_API_ROOT =
  "https://proapis.hlgamingofficial.com/main/games/freefire/meta/api";

function getHLGamingCredentials(env) {
  return {
    userUid:
      env.HL_GAMING_USER_UID ||
      env.HL_USER_UID ||
      "",
    apiKey:
      env.HL_GAMING_API_KEY ||
      env.HL_API_KEY ||
      "",
  };
}

/* =========================================================
   BACKBLAZE B2 PERMANENT FREE FIRE ASSET STORAGE
   Banner/outfit image delivery is B2-only.
   The HL image endpoint is never used for these assets.
   ========================================================= */

let b2AuthCache = null;

function getB2Credentials(env) {
  return {
    keyId: env.B2_KEY_ID || "",
    applicationKey: env.B2_APPLICATION_KEY || "",
    bucketName: env.B2_BUCKET_NAME || "4fu-freefire-assets",
  };
}

async function b2Authorize(env) {
  const { keyId, applicationKey } = getB2Credentials(env);
  if (!keyId || !applicationKey) return null;

  const now = Date.now();
  if (b2AuthCache && b2AuthCache.expiresAt > now) {
    return b2AuthCache.data;
  }

  const basic = btoa(`${keyId}:${applicationKey}`);
  const response = await fetch(
    "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
    {
      method: "GET",
      headers: { Authorization: `Basic ${basic}` },
    }
  );

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Backblaze authorize returned HTTP ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(data?.message || `Backblaze authorize HTTP ${response.status}`);
  }

  // Keep the auth token in Worker isolate memory for up to 20 hours.
  b2AuthCache = {
    data,
    expiresAt: now + 20 * 60 * 60 * 1000,
  };

  return data;
}

async function b2DownloadFile(env, fileName) {
  const auth = await b2Authorize(env);

  // B2 credentials are missing/unavailable.
  // Return null so diagnostic routes can report this cleanly instead of
  // crashing with "Cannot read properties of null (reading 'downloadUrl')".
  if (!auth?.downloadUrl || !auth?.authorizationToken) {
    return null;
  }

  const url =
    `${auth.downloadUrl}/file/${encodeURIComponent(getB2Credentials(env).bucketName)}/${fileName}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: auth.authorizationToken,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Backblaze download HTTP ${response.status}: ${body}`
    );
  }

  return {
    body: await response.arrayBuffer(),
    contentType:
      response.headers.get("content-type") || "application/octet-stream",
  };
}

async function b2UploadFile(env, fileName, body, contentType) {
  const auth = await b2Authorize(env);
  if (!auth) return false;

  const bucketId = auth?.allowed?.bucketId;
  if (!bucketId) throw new Error("Backblaze application key is not scoped to a bucket");

  const uploadUrlResponse = await fetch(
    `${auth.apiUrl}/b2api/v2/b2_get_upload_url`,
    {
      method: "POST",
      headers: {
        Authorization: auth.authorizationToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bucketId }),
    }
  );

  const uploadUrlText = await uploadUrlResponse.text();
  let uploadInfo;
  try {
    uploadInfo = JSON.parse(uploadUrlText);
  } catch {
    throw new Error(`Backblaze upload URL returned HTTP ${uploadUrlResponse.status}`);
  }

  if (!uploadUrlResponse.ok) {
    throw new Error(uploadInfo?.message || `Backblaze upload URL HTTP ${uploadUrlResponse.status}`);
  }

  const uploadResponse = await fetch(uploadInfo.uploadUrl, {
    method: "POST",
    headers: {
      Authorization: uploadInfo.authorizationToken,
      "X-Bz-File-Name": encodeURIComponent(fileName),
      "Content-Type": contentType || "b2/x-auto",
      "X-Bz-Content-Sha1": "do_not_verify",
    },
    body,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`Backblaze upload HTTP ${uploadResponse.status}: ${text.slice(0, 200)}`);
  }

  return true;
}


async function b2ListProfileFileNames(env, uid) {
  const auth = await b2Authorize(env);
  if (!auth?.apiUrl || !auth?.authorizationToken || !auth?.allowed?.bucketId) {
    return [];
  }

  const url = `${auth.apiUrl}/b2api/v2/b2_list_file_names`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: auth.authorizationToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bucketId: auth.allowed.bucketId,
      prefix: `freefire/profiles/${String(uid)}`,
      maxFileCount: 1000,
    }),
  });

  if (!response.ok) return [];

  const data = await response.json().catch(() => null);
  return Array.isArray(data?.files)
    ? data.files.map((f) => f?.fileName).filter(Boolean)
    : [];
}

async function b2CachedProfile(uid, region, env) {
  const directNames = [
    `freefire/profiles/${uid}.json`,
    `freefire/profiles/${uid}_${region}.json`,
    `freefire/profiles/${uid}-${region}.json`,
    `freefire/profiles/${region}_${uid}.json`,
    `freefire/profiles/${uid}.txt`,
  ];

  const candidates = [...directNames];
  try {
    const listed = await b2ListProfileFileNames(env, uid);
    for (const name of listed) {
      if (!candidates.includes(name)) candidates.push(name);
    }
  } catch {
    // Direct candidates are still attempted below.
  }

  for (const fileName of candidates) {
    try {
      const stored = await b2DownloadFile(env, fileName);
      if (!stored) continue;

      const text = new TextDecoder().decode(stored.body).replace(/^\uFEFF/, "").trim();
      if (!text) continue;

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        continue;
      }

      // Accept common wrappers used by saved profile snapshots.
      const profile =
        data?.profile && typeof data.profile === "object" ? data.profile :
        data?.data && typeof data.data === "object" ? data.data :
        data?.result && typeof data.result === "object" ? data.result :
        data;

      return {
        data: profile,
        provider: "Backblaze-B2-profile-cache",
        fileName,
      };
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}


function b2CombinedCacheFileName(uid, region) {
  const safeUid = String(uid).replace(/[^0-9]/g, "");
  const safeRegion = String(region).replace(/[^A-Za-z0-9_-]/g, "").toUpperCase();
  return `freefire/profiles-cache/${safeUid}_${safeRegion}.json`;
}

async function b2ReadCombinedCache(uid, region, env) {
  const fileName = b2CombinedCacheFileName(uid, region);

  try {
    const stored = await b2DownloadFile(env, fileName);
    if (!stored) return null;

    const text = new TextDecoder()
      .decode(stored.body)
      .replace(/^\uFEFF/, "")
      .trim();

    if (!text) return null;

    const data = JSON.parse(text);
    if (!data || typeof data !== "object") return null;

    return {
      data: data.data && typeof data.data === "object" ? data.data : data,
      updatedAt:
        data.updatedAt ||
        data.cachedAt ||
        data.savedAt ||
        null,
      fileName,
    };
  } catch (error) {
    console.warn(
      "B2 combined profile cache read failed:",
      error?.message || error
    );
    return null;
  }
}

async function b2WriteCombinedCache(uid, region, env, data) {
  const fileName = b2CombinedCacheFileName(uid, region);

  const payload = {
    version: 1,
    uid: String(uid),
    region: String(region).toUpperCase(),
    updatedAt: new Date().toISOString(),
    data,
  };

  try {
    await b2UploadFile(
      env,
      fileName,
      JSON.stringify(payload),
      "application/json"
    );

    return {
      success: true,
      fileName,
      updatedAt: payload.updatedAt,
    };
  } catch (error) {
    console.warn(
      "B2 combined profile cache write failed:",
      error?.message || error
    );

    return {
      success: false,
      fileName,
      error: error?.message || String(error),
    };
  }
}

function b2AssetFileName(asset, imgCode) {
  const safeCode = String(imgCode).replace(/[^0-9A-Za-z_-]/g, "");
  const folder = asset === "banner" ? "banners" : "outfits";
  return `freefire/${folder}/${safeCode}.jpg`;
}

/*
 * Returns a SHA-256 fingerprint for an already-stored B2 object.
 * This is B2-only and never calls the HL image API.
 */
async function b2Sha256(env, fileName) {
  const stored = await b2DownloadFile(env, fileName);
  if (!stored) return null;

  const hashBuffer = await crypto.subtle.digest("SHA-256", stored.body);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return {
    sha256: hash,
    size: stored.body.byteLength,
    contentType: stored.contentType || "application/octet-stream",
  };
}


async function publicFFAsset(imgCode) {
  if (imgCode === undefined || imgCode === null || imgCode === "") return null;

  // Public Free Fire item-asset CDN. No API key and no HL quota.
  const url = `https://ffitems.devhubx.org/items/${encodeURIComponent(String(imgCode))}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "image/png,image/*;q=0.9" },
      cf: { cacheTtl: 86400, cacheEverything: true },
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.toLowerCase().startsWith("image/")) {
      return null;
    }

    const body = await response.arrayBuffer();
    if (body.byteLength < 256) return null;

    // Reject the known HL Gaming NOT FOUND placeholder even when it is
    // returned by an independent/public asset provider.
    const hashBuffer = await crypto.subtle.digest("SHA-256", body);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    if (
      hash ===
      "289b4937145d2768398466e627cf43fbc87bf0b581ed476227a9a2ca39a84c5d"
    ) {
      return null;
    }

    return {
      body,
      contentType: contentType || "image/png",
      source: "FF-Items-Public-CDN",
    };
  } catch (error) {
    console.warn("Public FF asset provider failed:", error?.message || error);
    return null;
  }
}


/*
 * Banner-specific public fallback.
 *
 * IMPORTANT:
 * - No HL image API call.
 * - Mobileverso is checked first because it has the exact item page for
 *   banner IDs and exposes the item image in the page metadata.
 * - Generic FF item CDNs are kept as later fallbacks.
 */
async function fetchPublicImage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.9",
      },
      cf: { cacheTtl: 86400, cacheEverything: true },
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.toLowerCase().startsWith("image/")) {
      return null;
    }

    const body = await response.arrayBuffer();
    if (body.byteLength < 256) return null;

    const hashBuffer = await crypto.subtle.digest("SHA-256", body);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    // Known HL Gaming NOT FOUND placeholder.
    if (
      hash ===
      "289b4937145d2768398466e627cf43fbc87bf0b581ed476227a9a2ca39a84c5d"
    ) {
      return null;
    }

    return {
      body,
      contentType,
      sourceUrl: url,
    };
  } catch (error) {
    console.warn(
      "Public image fetch failed:",
      url,
      error?.message || error
    );
    return null;
  }
}

async function publicFFBannerAsset(imgCode) {
  if (imgCode === undefined || imgCode === null || imgCode === "") {
    return null;
  }

  const id = encodeURIComponent(String(imgCode));

  // 1) Exact item page -> extract its real image URL.
  // This avoids using the small generic item endpoint as the first choice.
  const pageUrl = `https://mobileverso.com.br/id/freefire/item/${id}`;

  try {
    const pageResponse = await fetch(pageUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
      },
      cf: { cacheTtl: 21600, cacheEverything: true },
    });

    if (pageResponse.ok) {
      const html = await pageResponse.text();

      const candidates = [];
      const addCandidate = (value) => {
        if (!value) return;
        const decoded = value
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();

        if (!decoded) return;
        try {
          candidates.push(new URL(decoded, pageUrl).toString());
        } catch {}
      };

      // Prefer OpenGraph/Twitter image metadata.
      const metaPatterns = [
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
      ];

      for (const pattern of metaPatterns) {
        const match = html.match(pattern);
        if (match?.[1]) addCandidate(match[1]);
      }

      // Then look for an image URL associated with this exact item ID.
      const imageUrlPatterns = [
        new RegExp(
          `https?://[^"'\\\\s<>]+${String(imgCode).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[^"'\\\\s<>]*`,
          "ig"
        ),
        new RegExp(
          `(?:src|data-src)=["']([^"']*${String(imgCode).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[^"']*)["']`,
          "ig"
        ),
      ];

      for (const pattern of imageUrlPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          addCandidate(match[1] || match[0]);
        }
      }

      for (const candidate of [...new Set(candidates)]) {
        const image = await fetchPublicImage(candidate);
        if (image) {
          return {
            ...image,
            source: "Mobileverso-Item-Page",
          };
        }
      }
    }
  } catch (error) {
    console.warn(
      "Mobileverso banner provider failed:",
      error?.message || error
    );
  }

  // 2) Free Fire item image CDN.
  const genericUrls = [
    `https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG/${id}.png`,
    `https://ffitems.devhubx.org/items/${id}`,
  ];

  for (const url of genericUrls) {
    const image = await fetchPublicImage(url);
    if (image) {
      return {
        ...image,
        source: "FreeFire-Public-Item-CDN",
      };
    }
  }

  return null;
}

async function getPermanentHLAsset(
  asset,
  imgCode,
  env,
  uid = null,
  region = "IND",
  primaryKey = null
) {
  const fileName = b2AssetFileName(asset, imgCode);

  // =========================================================
  // B2-ONLY ASSET DELIVERY
  // Banner/outfit images are already permanently stored in B2.
  // NEVER fall back to primary/public/HL image providers here.
  // This guarantees zero HL image-API quota usage for assets.
  // =========================================================
  let stored;
  try {
    stored = await b2DownloadFile(env, fileName);
  } catch (error) {
    return json(
      {
        success: false,
        error: "Backblaze B2 asset lookup failed",
        details: error?.message || String(error),
        asset,
        img_code: String(imgCode),
        b2_file: fileName,
        imageApiCalled: false,
        imageApiQuotaUsed: false,
      },
      502
    );
  }

  if (!stored) {
    return json(
      {
        success: false,
        error: "Asset not found in Backblaze B2",
        asset,
        img_code: String(imgCode),
        b2_file: fileName,
        b2_bucket: getB2Credentials(env).bucketName,
        imageApiCalled: false,
        imageApiQuotaUsed: false,
        provider: "Backblaze-B2",
      },
      404
    );
  }

  // Reject the known bad placeholder if it somehow exists in B2.
  const storedHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    stored.body
  );
  const storedHash = Array.from(new Uint8Array(storedHashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (
    storedHash ===
    "289b4937145d2768398466e627cf43fbc87bf0b581ed476227a9a2ca39a84c5d"
  ) {
    return json(
      {
        success: false,
        error: "Backblaze B2 contains the known NOT FOUND placeholder",
        asset,
        img_code: String(imgCode),
        b2_file: fileName,
        imageApiCalled: false,
        imageApiQuotaUsed: false,
      },
      404
    );
  }

  return new Response(stored.body, {
    status: 200,
    headers: corsHeaders({
      "Content-Type": stored.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-4FU-Asset": asset,
      "X-4FU-Provider": "Backblaze-B2",
      "X-4FU-Cache": "HIT",
      "X-4FU-HL-Image-API": "NOT-CALLED",
      "X-4FU-B2-File": fileName,
    }),
  });
}

function collectNumericIds(value) {
  const found = [];
  const seen = new WeakSet();

  const add = (v) => {
    if (v === undefined || v === null || v === "") return;
    const s = String(v).trim();
    if (/^\d{3,20}$/.test(s) && !found.includes(s)) found.push(s);
  };

  const visit = (v, depth = 0) => {
    if (v === undefined || v === null || depth > 6) return;

    if (typeof v === "number") {
      if (Number.isFinite(v)) add(v);
      return;
    }

    if (typeof v === "string") {
      // Asset IDs are numeric. Ignore arbitrary text and URLs.
      add(v);
      return;
    }

    if (Array.isArray(v)) {
      for (const item of v) visit(item, depth + 1);
      return;
    }

    if (typeof v !== "object") return;
    if (seen.has(v)) return;
    seen.add(v);

    // Free Fire/HL responses use several names for equipped item IDs.
    const idKeys = [
      "id", "ID", "Id", "itemId", "ItemId", "ItemID",
      "clothesId", "ClothesId", "ClothesID", "outfitId", "OutfitId",
      "OutfitID", "skinId", "SkinId", "SkinID", "imageId", "ImageId",
      "imageCode", "ImageCode", "img_code", "imgCode", "code", "Code",
      "assetId", "AssetId", "AssetID",
    ];

    for (const key of idKeys) {
      if (Object.prototype.hasOwnProperty.call(v, key)) add(v[key]);
    }

    // Some providers wrap equipped items inside one of these containers.
    const nestedKeys = [
      "clothes", "Clothes", "equippedClothes", "EquippedClothes",
      "equippedOutfit", "EquippedOutfit", "items", "Items", "data",
      "result", "Result", "list", "List", "value", "Value",
    ];
    for (const key of nestedKeys) {
      if (Object.prototype.hasOwnProperty.call(v, key)) visit(v[key], depth + 1);
    }
  };

  visit(value);
  return found;
}

function firstNumericId(...values) {
  for (const value of values) {
    const ids = collectNumericIds(value);
    if (ids.length) return ids[0];
  }
  return null;
}

async function hlgamingAsset(
  asset,
  uid,
  region,
  env,
  profileData = null,
  outfitIndex = 0,
  primaryKey = null
) {
  // Resolve IDs first. This NEVER calls the HL image endpoint.
  let resolvedProfile = profileData;

  if (!resolvedProfile) {
    const profileResult = await profileDataWithFallback(
      uid,
      region,
      env
    );
    resolvedProfile = profileResult?.data || {};
  }

  function extractAssetIds(data) {
    const basic =
      data?.basicInfo ||
      data?.basic_info ||
      {};

    const profile =
      data?.profileInfo ||
      data?.profile_info ||
      {};

    const bannerId =
      basic.bannerId ??
      basic.bannerID ??
      basic.AccountBannerId ??
      basic.accountBannerId ??
      data?.bannerId ??
      data?.bannerID ??
      data?.AccountBannerId ??
      data?.accountBannerId ??
      null;

    const clothes = [
      profile.clothes,
      profile.Clothes,
      profile.equippedClothes,
      profile.equippedOutfit,
      profile.EquippedOutfit,
      data?.clothes,
      data?.Clothes,
      data?.equippedClothes,
      data?.equippedOutfit,
      data?.EquippedOutfit,
    ].filter((v) => v !== undefined && v !== null);

    const outfitIds = [
      ...collectNumericIds(clothes),
      ...collectNumericIds(profile.EquippedOutfit),
      ...collectNumericIds(profile.equippedOutfit),
    ].filter(
      (value, index, array) =>
        array.indexOf(value) === index
    );

    return { bannerId, outfitIds };
  }

  let ids = extractAssetIds(resolvedProfile);

  // If profile/secondary did not contain IDs, ask HL AccountInfo +
  // AccountProfileInfo for the numeric IDs. This is NOT the image API,
  // so it does not consume the HL image quota.
  const needBanner =
    asset === "banner" &&
    (ids.bannerId === null ||
      ids.bannerId === undefined ||
      ids.bannerId === "");

  const needOutfit =
    asset === "outfit" &&
    ids.outfitIds.length === 0;

  if (needBanner || needOutfit) {
    try {
      const hlProfile = await hlgamingProfile(
        uid,
        region,
        env
      );

      const hlIds = extractAssetIds(hlProfile);

      ids = {
        bannerId:
          ids.bannerId ??
          hlIds.bannerId ??
          null,
        outfitIds:
          ids.outfitIds.length > 0
            ? ids.outfitIds
            : hlIds.outfitIds,
      };
    } catch (error) {
      console.warn(
        "HL profile ID lookup failed:",
        error?.message || error
      );
    }
  }

  const safeIndex =
    Number.isInteger(outfitIndex) && outfitIndex >= 0
      ? outfitIndex
      : 0;

  const imgCode =
    asset === "banner"
      ? ids.bannerId
      : ids.outfitIds[safeIndex] ||
        ids.outfitIds[0];

  if (
    imgCode === undefined ||
    imgCode === null ||
    imgCode === ""
  ) {
    throw new Error(
      `No ${asset} img_code was found for UID ${uid}`
    );
  }

  // B2-only delivery: no HL image endpoint is called.
  return await getPermanentHLAsset(
    asset,
    imgCode,
    env,
    uid,
    region,
    primaryKey
  );
}

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    ...extra,
  };
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      ...extra,
    }),
  });
}

function clean(value) {
  return value === undefined || value === null ? null : value;
}

function first(...values) {
  return values.find(v => v !== undefined && v !== null && v !== "");
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function calculateStats(solo, duo, squad) {
  const rows = [solo, duo, squad].filter(Boolean);

  const sum = (key) =>
    rows.reduce(
      (total, row) =>
        total +
        (Number(
          row?.[key] ??
          row?.detailedstats?.[key] ??
          row?.detailedStats?.[key]
        ) || 0),
      0
    );

  const matches =
    sum("gamesplayed") ||
    sum("gamesPlayed") ||
    sum("matches");

  const wins =
    sum("wins") ||
    sum("booyah");

  const kills =
    sum("kills");

  const deathsRaw =
    sum("deaths");

  const deaths =
    deathsRaw ||
    Math.max(0, matches - wins);

  const headshots =
    sum("headshots");

  const headshotKills =
    sum("headshotkills") ||
    sum("headshotKills");

  return {
    matches,
    wins,
    kills,
    deaths,

    kd:
      deaths > 0
        ? Number((kills / deaths).toFixed(2))
        : 0,

    headshots,
    headshotKills,

    headshotRate:
      kills > 0
        ? Number(((headshotKills / kills) * 100).toFixed(2))
        : 0,

    booyahRate:
      matches > 0
        ? Number(((wins / matches) * 100).toFixed(2))
        : 0,
  };
}

function modeStatsFromRaw(rawStats) {
  const source = rawStats?.stats || rawStats || {};

  const solo =
    source.solostats ||
    source.solo ||
    source.soloStats ||
    source.soloCareer ||
    source.soloMode ||
    {};

  const duo =
    source.duostats ||
    source.duo ||
    source.duoStats ||
    source.duoCareer ||
    source.duoMode ||
    {};

  const squad =
    source.quadstats ||
    source.squad ||
    source.squadStats ||
    source.squadCareer ||
    source.quadMode ||
    source.squadMode ||
    {};

  return {
    solo,
    duo,
    squad,
  };
}

async function upstreamJSON(endpoint, uid, region, key) {
  const url = new URL(`${API_BASE}/${endpoint}`);

  url.searchParams.set("uid", uid);
  url.searchParams.set("region", region);
  url.searchParams.set("key", key);

  const response = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
    },
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = {
      raw: text,
    };
  }

  if (!response.ok) {
    throw new Error(
      `Upstream ${endpoint} returned HTTP ${response.status}`
    );
  }

  return data;
}

async function upstreamAsset(endpoint, uid, region, key) {
  const url = new URL(`${API_ROOT}/${endpoint}`);

  url.searchParams.set("uid", uid);
  url.searchParams.set("region", region);
  url.searchParams.set("key", key);

  const response = await fetch(url.toString());

  const body = await response.arrayBuffer();

  if (!response.ok) {
    return new Response(body, {
      status: response.status,
      headers: corsHeaders({
        "Content-Type":
          response.headers.get("content-type") ||
          "text/plain; charset=utf-8",

        "Cache-Control": "no-store",
      }),
    });
  }

  return new Response(body, {
    status: 200,

    headers: corsHeaders({
      "Content-Type":
        response.headers.get("content-type") ||
        "image/png",

      "Cache-Control":
        "public, max-age=300",

      "X-4FU-Asset":
        endpoint.includes("banner")
          ? "banner"
          : "outfit",
    }),
  });
}


/* =========================================================
   SECONDARY FREE API
   ========================================================= */

async function secondaryJSON(endpoint, params = {}) {
  const url = new URL(
    `${SECONDARY_API_ROOT}/${endpoint}`
  );

  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      url.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
      },
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        raw: text,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error:
          data?.error ||
          `Secondary API HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error:
        error?.message ||
        "Secondary API request failed",
    };
  }
}


/* =========================================================
   HL GAMING PROFILE FALLBACK
   Uses HL AccountInfo + AccountProfileInfo only.
   This is NOT the AllData endpoint.
   ========================================================= */

const HL_GAMING_ACCOUNT_API_ROOT =
  "https://proapis.hlgamingofficial.com/main/games/freefire/account/api";

async function hlgamingAccountJSON(sectionName, uid, region, env, subSec = null) {
  const { userUid, apiKey } = getHLGamingCredentials(env);
  if (!userUid || !apiKey) {
    throw new Error("HL Gaming credentials are not configured");
  }

  const url = new URL(HL_GAMING_ACCOUNT_API_ROOT);
  url.searchParams.set("sectionName", sectionName);
  url.searchParams.set("PlayerUid", String(uid));
  url.searchParams.set("region", String(region).toLowerCase());
  url.searchParams.set("useruid", userUid);
  url.searchParams.set("api", apiKey);
  if (subSec) url.searchParams.set("subSec", subSec);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`HL Gaming ${sectionName} returned non-JSON HTTP ${response.status}`);
  }

  if (!response.ok || data?.error) {
    throw new Error(
      data?.error || data?.message || `HL Gaming ${sectionName} HTTP ${response.status}`
    );
  }

  return data?.result ?? data;
}

function normalizeHLAccountInfo(result, uid, region) {
  const r = result || {};
  return {
    accountId: r.AccountId ?? r.accountId ?? String(uid),
    accountType: r.AccountType ?? r.accountType,
    nickname: r.AccountName ?? r.accountName ?? r.nickname,
    region: r.AccountRegion ?? r.accountRegion ?? region,
    level: r.AccountLevel ?? r.accountLevel,
    exp: r.AccountEXP ?? r.accountEXP,
    bannerId: r.AccountBannerId ?? r.accountBannerId,
    headPic: r.AccountAvatarId ?? r.accountAvatarId,
    rank: r.BrRank ?? r.brRank ?? r.Rank ?? r.rank,
    rankingPoints: r.BrRankPoint ?? r.brRankPoint ?? r.RankingPoints ?? r.rankingPoints,
    badgeCnt: r.AccountBPBadges ?? r.accountBPBadges ?? r.BadgeCnt ?? r.badgeCnt,
    badgeId: r.AccountBPid ?? r.accountBPid ?? r.BadgeId ?? r.badgeId,
    seasonId: r.AccountSeasonId ?? r.accountSeasonId,
    liked: r.AccountLikes ?? r.accountLikes ?? r.Liked ?? r.liked,
    lastLoginAt: r.AccountLastLogin ?? r.accountLastLogin ?? r.LastLoginAt ?? r.lastLoginAt,
    csRank: r.CsRank ?? r.csRank,
    csRankingPoints: r.CsRankPoint ?? r.csRankPoint,
    weaponSkinShows: r.EquippedWeapon ?? r.equippedWeapon ?? r.WeaponSkinShows ?? r.weaponSkinShows ?? [],
    maxRank: r.BrMaxRank ?? r.brMaxRank ?? r.MaxRank ?? r.maxRank,
    csMaxRank: r.CsMaxRank ?? r.csMaxRank,
    title: r.Title ?? r.title,
    clanName: r.ClanName ?? r.clanName,
    captainId: r.CaptainId ?? r.captainId,
    clanLevel: r.ClanLevel ?? r.clanLevel,
    capacity: r.Capacity ?? r.capacity,
    memberNum: r.MemberNum ?? r.memberNum,
    releaseVersion: r.ReleaseVersion ?? r.releaseVersion,
    showBrRank: r.ShowBrRank ?? r.showBrRank,
    showCsRank: r.ShowCsRank ?? r.showCsRank,
  };
}

async function hlgamingProfile(uid, region, env) {
  const [accountResult, profileResult] = await Promise.all([
    hlgamingAccountJSON("AccountInfo", uid, region, env),
    hlgamingAccountJSON("AccountProfileInfo", uid, region, env),
  ]);

  const clothes =
    profileResult?.EquippedOutfit ??
    profileResult?.equippedOutfit ??
    profileResult?.clothes ??
    profileResult?.Clothes ??
    profileResult?.data?.EquippedOutfit ??
    profileResult?.data?.equippedOutfit ??
    profileResult?.data?.clothes ??
    profileResult?.data?.Clothes ??
    [];

  return {
    basicInfo: normalizeHLAccountInfo(accountResult, uid, region),
    profileInfo: {
      avatarId: accountResult?.AccountAvatarId ?? accountResult?.accountAvatarId,
      clothes: Array.isArray(clothes) ? clothes : [],
      equippedSkills:
        profileResult?.EquippedSkills ??
        profileResult?.equippedSkills ??
        [],
    },
    source: "HL-Gaming-AccountInfo",
  };
}

async function profileDataWithFallback(uid, region, env) {
  const key = env.FREE_FIRE_API_KEY;
  let primaryError = null;

  if (key) {
    try {
      return {
        data: await upstreamJSON("bhau", uid, region, key),
        provider: "primary",
      };
    } catch (error) {
      primaryError = error?.message || String(error);
    }
  }

  const secondary = await secondaryJSON("player-profile", {
    uid,
    server: region,
  });

  if (secondary.success) {
    return {
      data: normalizeSecondaryProfile(secondary.data),
      provider: "secondary",
    };
  }

  try {
    return {
      data: await hlgamingProfile(uid, region, env),
      provider: "hl-gaming",
    };
  } catch (hlError) {
    const cachedProfile = await b2CachedProfile(uid, region, env);
    if (cachedProfile?.data) return cachedProfile;

    throw new Error(
      `Profile providers unavailable: primary=${primaryError || "not configured"}; secondary=${secondary.error || "failed"}; hl-gaming=${hlError?.message || "failed"}`
    );
  }
}

/* =========================================================
   NORMALIZE SECONDARY PROFILE
   ========================================================= */

function normalizeSecondaryProfile(data) {
  if (!data) {
    return {};
  }

  const basic =
    data.basicinfo ||
    data.basicInfo ||
    data.basic_info ||
    {};

  const clan =
    data.clanbasicinfo ||
    data.clanBasicInfo ||
    data.clan_basic_info ||
    {};

  const captain =
    data.captainbasicinfo ||
    data.captainBasicInfo ||
    data.captain_basic_info ||
    {};

  const pet =
    data.petinfo ||
    data.petInfo ||
    data.pet_info ||
    {};

  const social =
    data.socialinfo ||
    data.socialInfo ||
    data.social_info ||
    {};

  const credit =
    data.creditscoreinfo ||
    data.creditScoreInfo ||
    data.credit_score_info ||
    {};

  const profile =
    data.profileinfo ||
    data.profileInfo ||
    data.profile_info ||
    {};

  const clothes =
    profile.clothes ??
    profile.Clothes ??
    profile.equippedClothes ??
    profile.equippedOutfit ??
    data.clothes ??
    data.Clothes ??
    data.equippedClothes ??
    data.EquippedOutfit ??
    data.equippedOutfit ??
    [];

  return {
    basicInfo: basic,
    clanBasicInfo: clan,
    captainBasicInfo: captain,
    petInfo: pet,
    socialInfo: social,
    creditScoreInfo: credit,

    profileInfo: {
      ...profile,
      clothes: Array.isArray(clothes) ? clothes : [],
    },

    // Keep these at the top level too because some secondary responses
    // expose banner/outfit data outside profileInfo.
    bannerId:
      basic.bannerId ??
      basic.bannerID ??
      basic.AccountBannerId ??
      basic.accountBannerId ??
      data.bannerId ??
      data.bannerID ??
      data.AccountBannerId ??
      data.accountBannerId ??
      null,

    clothes: Array.isArray(clothes) ? clothes : [],

    userSparkInfo:
      data.userSparkInfo ||
      data.usersparkinfo ||
      null,

    diamondCostRes:
      data.diamondcostres ||
      data.diamondCostRes ||
      null,
  };
}


/* =========================================================
   NORMALIZE SECONDARY DETAILED STATS
   ========================================================= */

function normalizeSecondaryStats(data) {
  if (!data) {
    return {};
  }

  const root =
    data.data ||
    data;

  const solo =
    root.solostats ||
    root.soloStats ||
    root.solo ||
    {};

  const duo =
    root.duostats ||
    root.duoStats ||
    root.duo ||
    {};

  const squad =
    root.quadstats ||
    root.squadstats ||
    root.squadStats ||
    root.squad ||
    {};

  return {
    solo,
    duo,
    squad,
  };
}


/* =========================================================
   DETAILED STATS HELPER
   ========================================================= */

function detailedMode(mode) {
  if (!mode) return {};

  const d =
    mode.detailedstats ||
    mode.detailedStats ||
    mode.detailed_stats ||
    {};

  return {
    gamesplayed: number(
      mode.gamesplayed ??
      mode.gamesPlayed ??
      mode.matches
    ),

    wins: number(
      mode.wins ??
      mode.booyah
    ),

    kills: number(mode.kills),

    deaths: number(d.deaths ?? mode.deaths),

    damage: number(d.damage),

    distanceTravelled: number(
      d.distancetravelled ??
      d.distanceTravelled ??
      d.distance_travelled
    ),

    survivalTime: number(
      d.survivaltime ??
      d.survivalTime ??
      d.survival_time
    ),

    highestKills: number(
      d.highestkills ??
      d.highestKills ??
      d.highest_kills
    ),

    topNTimes: number(
      d.topntimes ??
      d.topNTimes
    ),

    headshots: number(d.headshots),

    headshotKills: number(
      d.headshotkills ??
      d.headshotKills ??
      d.headshot_kills
    ),

    pickups: number(
      d.pickups ??
      d.pickUps
    ),

    revives: number(d.revives),

    roadKills: number(
      d.roadkills ??
      d.roadKills
    ),

    knockdowns: number(
      d.knockdown ??
      d.knockDown ??
      d.knockDowns
    ),
  };
}



/* =========================================================
   4FU YOUTUBE LIVE TOURNAMENT API
   - API key stays in Worker secret: YOUTUBE_API_KEY
   - Uses videos.list (1 quota unit/request)
   - Returns LIVE / UPCOMING / ENDED metadata
   - Optional notification webhook:
       env.YOUTUBE_LIVE_NOTIFY_URL
     This is intentionally optional so existing notification
     infrastructure is never guessed or overwritten.
   ========================================================= */

function extractYouTubeVideoId(value) {
  if (!value) return null;

  const raw = String(value).trim();

  // Raw 11-character YouTube video ID.
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const url = new URL(raw);

    if (
      url.hostname === "youtu.be" ||
      url.hostname === "www.youtu.be"
    ) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
    }

    if (
      url.hostname === "youtube.com" ||
      url.hostname === "www.youtube.com" ||
      url.hostname === "m.youtube.com" ||
      url.hostname === "youtube-nocookie.com" ||
      url.hostname === "www.youtube-nocookie.com"
    ) {
      const queryId = url.searchParams.get("v");
      if (/^[A-Za-z0-9_-]{11}$/.test(queryId || "")) return queryId;

      const parts = url.pathname.split("/").filter(Boolean);
      const index = parts.findIndex((part) =>
        ["live", "embed", "shorts", "v"].includes(part.toLowerCase())
      );

      if (index >= 0) {
        const id = parts[index + 1];
        if (/^[A-Za-z0-9_-]{11}$/.test(id || "")) return id;
      }
    }
  } catch {
    // Not a URL; handled above as a raw ID only.
  }

  // Last-resort extraction for links embedded in text.
  const match = raw.match(
    /(?:v=|youtu\.be\/|youtube\.com\/(?:live\/|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/
  );

  return match?.[1] || null;
}

function youtubeStatusFromDetails(details) {
  /*
   * videos.list does not expose the Live Streaming API's
   * broadcast lifecycle field. For a public video ID, the
   * reliable public lifecycle signals are:
   *
   * UPCOMING = scheduledStartTime exists, actualStartTime absent
   * LIVE     = actualStartTime exists, actualEndTime absent
   * ENDED    = actualEndTime exists
   */
  if (details?.actualEndTime) {
    return "ENDED";
  }

  if (details?.actualStartTime) {
    return "LIVE";
  }

  if (details?.scheduledStartTime) {
    return "UPCOMING";
  }

  return "UNKNOWN";
}

async function getYouTubeLiveInfo(videoId, env) {
  const apiKey = env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "YOUTUBE_API_KEY is not configured in Worker secrets"
    );
  }

  if (!/^[A-Za-z0-9_-]{11}$/.test(String(videoId || ""))) {
    throw new Error("Invalid YouTube video ID");
  }

  // ------------------------------------------------------------
  // QUOTA-SAFE CACHE
  // One YouTube lookup per video per 60 seconds across users.
  // PROFILE_CACHE is already bound to this Worker.
  // ------------------------------------------------------------
  const youtubeCacheKey =
    `youtube-live-v2:${videoId}`;

  if (env.PROFILE_CACHE) {
    try {
      const cached =
        await env.PROFILE_CACHE.get(
          youtubeCacheKey,
          { type: "json" }
        );

      if (cached?.success) {
        return {
          ...cached,
          cacheHit: true,
          fetchedAt:
            cached.fetchedAt ||
            new Date().toISOString(),
        };
      }
    } catch (cacheError) {
      console.warn(
        "4FU YouTube KV cache read failed:",
        cacheError
      );
    }
  }

  const endpoint = new URL(
    "https://www.googleapis.com/youtube/v3/videos"
  );

  endpoint.searchParams.set(
    "part",
    "snippet,contentDetails,liveStreamingDetails,status,statistics"
  );
  endpoint.searchParams.set("id", videoId);
  endpoint.searchParams.set("key", apiKey);

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cf: {
      cacheTtl: 60,
      cacheEverything: true,
    },
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `YouTube API returned non-JSON HTTP ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      `YouTube API HTTP ${response.status}`
    );
  }

  const video = data?.items?.[0];

  if (!video) {
    throw new Error(
      "YouTube video not found or is not accessible"
    );
  }

  const details =
    video.liveStreamingDetails || {};

  const status =
    youtubeStatusFromDetails(details);

  const result = {
    success: true,

    videoId,

    status,

    isLive: status === "LIVE",

    title:
      video.snippet?.title ||
      "4FU Tournament",

    description:
      video.snippet?.description ||
      "",

    channelId:
      video.snippet?.channelId ||
      null,

    channelTitle:
      video.snippet?.channelTitle ||
      null,

    publishedAt:
      video.snippet?.publishedAt ||
      null,

    thumbnail:
      video.snippet?.thumbnails?.maxres?.url ||
      video.snippet?.thumbnails?.high?.url ||
      video.snippet?.thumbnails?.medium?.url ||
      video.snippet?.thumbnails?.default?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,

    scheduledStartTime:
      details.scheduledStartTime ||
      null,

    scheduledEndTime:
      details.scheduledEndTime ||
      null,

    actualStartTime:
      details.actualStartTime ||
      null,

    actualEndTime:
      details.actualEndTime ||
      null,

    concurrentViewers:
      details.concurrentViewers !== undefined
        ? Number(details.concurrentViewers)
        : null,

    activeLiveChatId:
      details.activeLiveChatId ||
      null,

    duration:
      video.contentDetails?.duration ||
      null,

    privacyStatus:
      video.status?.privacyStatus ||
      null,

    embeddable:
      video.status?.embeddable !== false,

    viewCount:
      video.statistics?.viewCount
        ? Number(video.statistics.viewCount)
        : null,

    likeCount:
      video.statistics?.likeCount
        ? Number(video.statistics.likeCount)
        : null,

    watchUrl:
      `https://www.youtube.com/watch?v=${videoId}`,

    embedUrl:
      `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`,

    fetchedAt:
      new Date().toISOString(),

    cacheHit: false,
  };

  if (env.PROFILE_CACHE) {
    try {
      await env.PROFILE_CACHE.put(
        youtubeCacheKey,
        JSON.stringify(result),
        {
          expirationTtl: 60,
        }
      );
    } catch (cacheError) {
      console.warn(
        "4FU YouTube KV cache write failed:",
        cacheError
      );
    }
  }

  return result;
}

async function maybeNotifyYouTubeLive(info, query, env) {
  /*
   * Optional hook only.
   *
   * We do NOT assume the existing 4FU notification endpoint because
   * the Worker source does not contain one. If YOUTUBE_LIVE_NOTIFY_URL
   * is configured later, the Worker can POST a notification payload to
   * that existing/approved sender.
   */
  const notifyUrl =
    env.YOUTUBE_LIVE_NOTIFY_URL;

  if (
    !notifyUrl ||
    !info?.isLive
  ) {
    return {
      attempted: false,
      sent: false,
      reason: !notifyUrl
        ? "YOUTUBE_LIVE_NOTIFY_URL not configured"
        : "Tournament is not live",
    };
  }

  const notificationKey =
    `youtube-live-notified:${String(
      query.tournamentId ||
      info.videoId
    )}:${info.videoId}`;

  // Use the existing PROFILE_CACHE KV binding only if available.
  // This prevents duplicate sends when the route is polled.
  if (env.PROFILE_CACHE) {
    const alreadySent =
      await env.PROFILE_CACHE.get(
        notificationKey
      );

    if (alreadySent) {
      return {
        attempted: false,
        sent: false,
        duplicate: true,
      };
    }
  }

  const payload = {
    type: "tournament_live",
    priority: "high",

    title:
      query.title ||
      info.title ||
      "4FU Tournament is LIVE!",

    body:
      `${query.title || info.title || "4FU Tournament"} is now LIVE. Tap to watch.`,

    link:
      query.pageLink ||
      info.watchUrl,

    youtubeVideoId:
      info.videoId,

    youtubeUrl:
      info.watchUrl,

    tournamentId:
      query.tournamentId ||
      null,

    status:
      info.status,

    viewers:
      info.concurrentViewers,

    scheduledStartTime:
      info.scheduledStartTime,

    actualStartTime:
      info.actualStartTime,

    source:
      "YouTube Data API",

    sentAt:
      new Date().toISOString(),
  };

  try {
    const response = await fetch(
      notifyUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(payload),
      }
    );

    const responseText =
      await response.text();

    if (!response.ok) {
      return {
        attempted: true,
        sent: false,
        status: response.status,
        error:
          responseText.slice(0, 500),
      };
    }

    if (env.PROFILE_CACHE) {
      await env.PROFILE_CACHE.put(
        notificationKey,
        JSON.stringify({
          sentAt:
            new Date().toISOString(),
          videoId:
            info.videoId,
        }),
        {
          expirationTtl:
            60 * 60 * 24 * 7,
        }
      );
    }

    return {
      attempted: true,
      sent: true,
      status: response.status,
    };
  } catch (error) {
    return {
      attempted: true,
      sent: false,
      error:
        error?.message ||
        String(error),
    };
  }
}



/* =========================================================
   4FU PRO / RAZORPAY - CLOUDFLARE WORKER BACKEND
   Uses the SAME worker as the existing Free Fire API.
   Existing routes remain untouched.
   Required Worker secrets:
     RAZORPAY_KEY_ID
     RAZORPAY_KEY_SECRET
     RAZORPAY_PRO_PLAN_ID
     RAZORPAY_WEBHOOK_SECRET
     FIREBASE_PROJECT_ID
     FIREBASE_SERVICE_ACCOUNT_JSON
   Optional:
     PRO_PRICE_INR (default 49)
   ========================================================= */

let proFirebaseTokenCache = null;
let proFirebaseKeyCache = null;
let proServiceTokenCache = null;

function proBase64Url(bytes) {
  let binary = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function proBase64UrlString(value) {
  return proBase64Url(new TextEncoder().encode(value));
}

function proJson(data, status = 200) {
  return json(data, status, {
    "Cache-Control": "no-store",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
}

function proIsoFromUnix(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null;
}

async function proHmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function proHmacVerify(secret, message, expectedHex) {
  const actual = await proHmacHex(secret, message);
  if (!actual || !expectedHex || actual.length !== expectedHex.length) return false;

  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) {
    diff |= actual.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}

async function proFirebasePublicKeys() {
  const now = Date.now();
  if (proFirebaseKeyCache && proFirebaseKeyCache.expiresAt > now) {
    return proFirebaseKeyCache.keys;
  }

  const response = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
    { headers: { Accept: "application/json" } }
  );
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.keys || !Array.isArray(data.keys)) {
    throw new Error("Firebase public keys unavailable");
  }

  const cacheControl = response.headers.get("Cache-Control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\\d+)/i);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  const ttl = Math.min(Math.max(maxAgeSeconds, 300), 24 * 60 * 60);

  proFirebaseKeyCache = {
    keys: data.keys,
    expiresAt: now + ttl * 1000,
  };

  return data.keys;
}

function proBase64UrlBytes(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function proFirebaseIdToken(idToken, env) {
  if (!idToken) throw new Error("Firebase ID token is required");

  const now = Math.floor(Date.now() / 1000);
  if (
    proFirebaseTokenCache &&
    proFirebaseTokenCache.token === idToken &&
    proFirebaseTokenCache.exp > now + 30
  ) {
    return proFirebaseTokenCache.claims;
  }

  const parts = String(idToken).split(".");
  if (parts.length !== 3) throw new Error("Invalid Firebase ID token");

  let header;
  let claims;
  try {
    header = JSON.parse(
      new TextDecoder().decode(proBase64UrlBytes(parts[0]))
    );
    claims = JSON.parse(
      new TextDecoder().decode(proBase64UrlBytes(parts[1]))
    );
  } catch {
    throw new Error("Invalid Firebase ID token");
  }

  const projectId = env.FIREBASE_PROJECT_ID || "fire-united";

  if (
    header?.alg !== "RS256" ||
    !header?.kid ||
    claims?.aud !== projectId ||
    claims?.iss !== `https://securetoken.google.com/${projectId}` ||
    !claims?.sub ||
    String(claims.sub).length > 128 ||
    Number(claims.exp || 0) <= now ||
    Number(claims.iat || 0) > now + 60 ||
    Number(claims.auth_time || 0) > now + 60
  ) {
    throw new Error("Firebase ID token audience/issuer/expiry mismatch");
  }

  const keys = await proFirebasePublicKeys();
  const jwk = keys.find((key) => key?.kid === header.kid);
  if (!jwk) {
    // Google can rotate keys while a Worker isolate still has an old cache.
    proFirebaseKeyCache = null;
    const refreshedKeys = await proFirebasePublicKeys();
    const refreshedJwk = refreshedKeys.find((key) => key?.kid === header.kid);
    if (!refreshedJwk) throw new Error("Firebase ID token signing key not found");
    return await proVerifyFirebaseJwt(
      idToken,
      header,
      claims,
      refreshedJwk,
      now
    );
  }

  return await proVerifyFirebaseJwt(idToken, header, claims, jwk, now);
}

async function proVerifyFirebaseJwt(idToken, header, claims, jwk, now) {
  const signingInput = `${String(idToken).split(".")[0]}.${String(idToken).split(".")[1]}`;
  const signature = proBase64UrlBytes(String(idToken).split(".")[2]);

  let publicKey;
  try {
    publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
  } catch {
    throw new Error("Firebase public key import failed");
  }

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    signature,
    new TextEncoder().encode(signingInput)
  );

  if (!valid) throw new Error("Invalid Firebase ID token signature");

  proFirebaseTokenCache = {
    token: idToken,
    claims,
    exp: Number(claims.exp || 0),
  };

  return claims;
}

function proServiceAccount(env) {
  const raw = env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  if (!data.client_email || !data.private_key) {
    throw new Error("Firebase service account is missing client_email/private_key");
  }

  return data;
}

async function proServiceAccountAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (proServiceTokenCache && proServiceTokenCache.exp > now + 60) {
    return proServiceTokenCache.token;
  }

  const account = proServiceAccount(env);
  const header = proBase64UrlString(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  );
  const claim = proBase64UrlString(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;

  const pem = account.private_key
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "");

  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  const binary = atob(base64);
  const keyBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    keyBytes[i] = binary.charCodeAt(i);
  }

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsigned)
  );

  const assertion = `${unsigned}.${proBase64Url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body:
      "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer" +
      `&assertion=${encodeURIComponent(assertion)}`,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    throw new Error(
      data?.error_description ||
      data?.error ||
      `Google token exchange HTTP ${response.status}`
    );
  }

  proServiceTokenCache = {
    token: data.access_token,
    exp: now + Number(data.expires_in || 3600),
  };

  return data.access_token;
}

async function proFirestoreRequest(path, method, body, env) {
  const projectId = env.FIREBASE_PROJECT_ID || "fire-united";
  const token = await proServiceAccountAccessToken(env);
  const endpoint =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/${path}`;

  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      `Firestore HTTP ${response.status}`
    );
  }

  return data;
}

function proFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isInteger(value)) {
    return { integerValue: String(value) };
  }
  if (typeof value === "number") return { doubleValue: value };
  return { stringValue: String(value) };
}

function proFirestoreFields(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data || {})) {
    fields[key] = proFirestoreValue(value);
  }
  return fields;
}

async function proFindPlayer(claims, env) {
  const projectId = env.FIREBASE_PROJECT_ID || "fire-united";
  const token = await proServiceAccountAccessToken(env);

  async function query(field, value) {
    const endpoint =
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
      `/databases/(default)/documents:runQuery`;

    const body = {
      structuredQuery: {
        from: [{ collectionId: "players" }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: "EQUAL",
            value: { stringValue: String(value) },
          },
        },
        limit: 1,
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => []);
    if (!response.ok) {
      throw new Error(data?.error?.message || `Firestore query HTTP ${response.status}`);
    }

    const row = Array.isArray(data)
      ? data.find((item) => item?.document?.name)
      : null;

    if (!row?.document) return null;

    const document = row.document;
    const fields = {};
    for (const [key, value] of Object.entries(document.fields || {})) {
      fields[key] =
        value.stringValue ??
        value.integerValue ??
        value.doubleValue ??
        value.booleanValue ??
        value.timestampValue ??
        value.nullValue ??
        null;
    }

    return {
      path: document.name.split("/documents/")[1],
      id: document.name.split("/").pop(),
      fields,
    };
  }

  const uid = claims.sub;
  const email = claims.email || "";

  const byUid = await query("uid", uid);
  if (byUid) return byUid;

  if (email) {
    const byEmail = await query("loginEmail", email);
    if (byEmail) return byEmail;
  }

  throw new Error("Player profile not found for this Firebase account");
}

async function proUpdatePlayer(player, patch, env) {
  const fields = proFirestoreFields(patch);
  return proFirestoreRequest(
    `${player.path}?updateMask.fieldPaths=${Object.keys(fields)
      .map((key) => encodeURIComponent(key))
      .join("&updateMask.fieldPaths=")}`,
    "PATCH",
    { fields },
    env
  );
}


/* =========================================================
   4FU PRO PROFILE CUSTOMIZATION
   - Saved server-side in the player's Firestore document.
   - Client cannot activate PRO or edit another player's profile.
   - Admin bypass follows the same server-side email allow-list
     already used by /pro/status.
   - Stored as JSON string to keep the existing player document
     schema backward-compatible.
   ========================================================= */

const PRO_CUSTOMIZATION_DEFAULTS = {
  version: 2,

  // IMPORTANT: these are CARD/DATA themes only.
  // The public player page/banner background is never replaced by this value.
  theme: "obsidian",

  liveTheme: "inferno-live",
  motionMode: "smooth",
  preset: "custom",
  title: "ELITE",

  frame: {
    style: "gold",
    animated: true,
    edgeShine: true,
    diamondCorners: true,
  },

  banner: {
    animation: true,
    glow: true,
    shine: true,
    border: "snake",
    style: "cinematic",
  },

  avatar: {
    glow: true,
    pulse: true,
    ring: "gold",
    shine: true,
  },

  mainCard: {
    snake: true,
    glow: true,
    shine: true,
    tilt: true,
    pulse: true,
  },

  weapon: {
    glow: true,
    float: true,
    shine: true,
    snake: true,
    parallax: true,
    style: "fire",
  },

  stats: {
    glow: true,
    fire: false,
    shine: true,
    hover: true,
    numberAnimation: true,
    numberGlow: true,
  },

  achievements: {
    glow: true,
    shine: true,
    hover: true,
  },

  gameCenter: {
    glow: true,
    hover: true,
    shine: true,
  },

  clips: {
    premiumFrame: true,
    glow: true,
    hover: true,
    shine: true,
  },

  gallery: {
    premiumFrame: true,
    glow: true,
    zoom: true,
    shine: true,
  },

  atmosphere: {
    particles: true,
    ambientGlow: true,
    floatingLights: true,
    scrollReveal: true,
    cursorGlow: false,
  },
};

const PRO_CARD_THEMES = [
  "obsidian",
  "aurora",
  "inferno",
  "cyber",
  "void",
  "royal",
  "crimson",
  "ice",
  "galaxy",
  "toxic",
  "ember",
];

const PRO_LIVE_THEMES = PRO_CARD_THEMES.map((theme) => `${theme}-live`);

const PRO_MOTION_MODES = [
  "cinematic",
  "smooth",
  "aggressive",
  "minimal",
];

const PRO_PRESETS = [
  "custom",
  "king",
  "esports",
  "cinematic",
  "clean",
  "inferno",
  "cyber",
  "royal",
  "aurora",
];

function proCustomizationObject(value) {
  if (!value) return null;
  if (typeof value === "object") return value;

  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function proBool(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function proString(value, fallback, allowed = null) {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!v) return fallback;
  return Array.isArray(allowed) && !allowed.includes(v) ? fallback : v;
}

function proCustomizationSanitize(input) {
  const src = proCustomizationObject(input) || {};
  const d = PRO_CUSTOMIZATION_DEFAULTS;
  const fx = src.effects && typeof src.effects === "object"
    ? src.effects
    : {};

  const bool = (nestedValue, flatKey, fallback) =>
    typeof fx[flatKey] === "boolean"
      ? fx[flatKey]
      : proBool(nestedValue, fallback);

  const normalized = {
    version: 2,

    // New 11-theme PRO library.
    // These never become the public page background.
    theme: proString(src.theme, d.theme, PRO_CARD_THEMES),

    liveTheme: proString(
      src.liveTheme,
      d.liveTheme,
      PRO_LIVE_THEMES
    ),

    motionMode: proString(
      src.motionMode,
      d.motionMode,
      PRO_MOTION_MODES
    ),

    preset: proString(
      src.preset,
      d.preset,
      PRO_PRESETS
    ),

    title: proString(src.title, d.title, [
      "ELITE",
      "LEGEND",
      "VETERAN",
      "KING",
    ]).toUpperCase(),

    frame: {
      style: proString(
        src.frame?.style ??
        src.frameStyle ??
        fx.frameStyle,
        d.frame.style,
        [
          "none",
          "gold",
          "fire",
          "neon",
          "ice",
          "galaxy",
          "toxic",
          "royal",
          "crimson",
        ]
      ),

      animated: bool(
        src.frame?.animated,
        "animatedFrame",
        d.frame.animated
      ),

      edgeShine: bool(
        src.frame?.edgeShine,
        "edgeShine",
        d.frame.edgeShine
      ),

      diamondCorners: bool(
        src.frame?.diamondCorners,
        "diamondCorners",
        d.frame.diamondCorners
      ),
    },

    banner: {
      animation: bool(
        src.banner?.animation,
        "bannerAnimation",
        d.banner.animation
      ),
      glow: bool(
        src.banner?.glow,
        "bannerGlow",
        d.banner.glow
      ),
      shine: bool(
        src.banner?.shine,
        "bannerShine",
        d.banner.shine
      ),
      border:
        fx.bannerSnake === true
          ? "snake"
          : proString(
              src.banner?.border,
              d.banner.border,
              [
                "none",
                "normal",
                "snake",
                "fire",
                "neon",
                "electric",
                "gold",
              ]
            ),
      style: proString(
        src.banner?.style,
        d.banner.style,
        [
          "normal",
          "cinematic",
          "zoom",
          "pan",
          "float",
        ]
      ),
    },

    avatar: {
      glow: bool(
        src.avatar?.glow,
        "avatarGlow",
        d.avatar.glow
      ),
      pulse: bool(
        src.avatar?.pulse,
        "avatarPulse",
        d.avatar.pulse
      ),
      ring:
        fx.avatarRing === false
          ? "none"
          : proString(
              src.avatar?.ring,
              d.avatar.ring,
              [
                "none",
                "normal",
                "gold",
                "fire",
                "neon",
                "cyber",
              ]
            ),
      shine: bool(
        src.avatar?.shine,
        "avatarShine",
        d.avatar.shine
      ),
    },

    mainCard: {
      snake: bool(
        src.mainCard?.snake,
        "mainSnake",
        d.mainCard.snake
      ),
      glow: bool(
        src.mainCard?.glow,
        "mainGlow",
        d.mainCard.glow
      ),
      shine: bool(
        src.mainCard?.shine,
        "mainShine",
        d.mainCard.shine
      ),
      tilt: bool(
        src.mainCard?.tilt,
        "mainTilt",
        d.mainCard.tilt
      ),
      pulse: proBool(
        src.mainCard?.pulse,
        d.mainCard.pulse
      ),
    },

    weapon: {
      glow: bool(
        src.weapon?.glow,
        "weaponGlow",
        d.weapon.glow
      ),
      float: bool(
        src.weapon?.float,
        "weaponFloat",
        d.weapon.float
      ),
      shine: bool(
        src.weapon?.shine,
        "weaponShine",
        d.weapon.shine
      ),
      snake: bool(
        src.weapon?.snake,
        "weaponSnake",
        d.weapon.snake
      ),
      parallax: bool(
        src.weapon?.parallax,
        "weaponParallax",
        d.weapon.parallax
      ),
      style: proString(
        src.weapon?.style,
        d.weapon.style,
        [
          "normal",
          "fire",
          "neon",
          "electric",
          "gold",
        ]
      ),
    },

    stats: {
      glow: bool(
        src.stats?.glow,
        "statsGlow",
        d.stats.glow
      ),
      fire: bool(
        src.stats?.fire,
        "statsFire",
        d.stats.fire
      ),
      shine: bool(
        src.stats?.shine,
        "statsShine",
        d.stats.shine
      ),
      hover: bool(
        src.stats?.hover,
        "statsHover",
        d.stats.hover
      ),
      numberAnimation: bool(
        src.stats?.numberAnimation,
        "numberAnimation",
        d.stats.numberAnimation
      ),
      numberGlow: bool(
        src.stats?.numberGlow,
        "statNumberGlow",
        d.stats.numberGlow
      ),
    },

    achievements: {
      glow: bool(
        src.achievements?.glow,
        "achievementGlow",
        d.achievements.glow
      ),
      shine: bool(
        src.achievements?.shine,
        "achievementShine",
        d.achievements.shine
      ),
      hover: bool(
        src.achievements?.hover,
        "achievementHover",
        d.achievements.hover
      ),
    },

    gameCenter: {
      glow: bool(
        src.gameCenter?.glow,
        "gameGlow",
        d.gameCenter.glow
      ),
      hover: bool(
        src.gameCenter?.hover,
        "gameFloat",
        d.gameCenter.hover
      ),
      shine: bool(
        src.gameCenter?.shine,
        "gameBorder",
        d.gameCenter.shine
      ),
    },

    clips: {
      premiumFrame: bool(
        src.clips?.premiumFrame,
        "showcaseFrame",
        d.clips.premiumFrame
      ),
      glow: bool(
        src.clips?.glow,
        "showcaseGlow",
        d.clips.glow
      ),
      hover: bool(
        src.clips?.hover,
        "showcaseZoom",
        d.clips.hover
      ),
      shine: bool(
        src.clips?.shine,
        "showcaseShine",
        d.clips.shine
      ),
    },

    gallery: {
      premiumFrame: bool(
        src.gallery?.premiumFrame,
        "showcaseFrame",
        d.gallery.premiumFrame
      ),
      glow: bool(
        src.gallery?.glow,
        "showcaseGlow",
        d.gallery.glow
      ),
      zoom: bool(
        src.gallery?.zoom,
        "showcaseZoom",
        d.gallery.zoom
      ),
      shine: bool(
        src.gallery?.shine,
        "showcaseShine",
        d.gallery.shine
      ),
    },

    atmosphere: {
      particles: bool(
        src.atmosphere?.particles,
        "particles",
        d.atmosphere.particles
      ),
      ambientGlow: bool(
        src.atmosphere?.ambientGlow,
        "ambientGlow",
        d.atmosphere.ambientGlow
      ),
      floatingLights: proBool(
        src.atmosphere?.floatingLights,
        d.atmosphere.floatingLights
      ),
      scrollReveal: bool(
        src.atmosphere?.scrollReveal,
        "scrollReveal",
        d.atmosphere.scrollReveal
      ),
      cursorGlow: bool(
        src.atmosphere?.cursorGlow,
        "cursorGlow",
        d.atmosphere.cursorGlow
      ),
    },
  };

  /*
   * Backward compatibility:
   * The public profile currently understands the flat `effects` object.
   * Keep it synchronized with the new structured V2 configuration.
   */
  normalized.effects = {
    // Main card
    mainSnake: normalized.mainCard.snake,
    mainGlow: normalized.mainCard.glow,
    mainShine: normalized.mainCard.shine,
    mainTilt: normalized.mainCard.tilt,

    // Banner
    bannerAnimation: normalized.banner.animation,
    bannerGlow: normalized.banner.glow,
    bannerShine: normalized.banner.shine,
    bannerSnake: normalized.banner.border === "snake",

    // Avatar
    avatarRing: normalized.avatar.ring !== "none",
    avatarGlow: normalized.avatar.glow,
    avatarPulse: normalized.avatar.pulse,
    avatarShine: normalized.avatar.shine,
    proCrown: true,

    // Weapon
    weaponGlow: normalized.weapon.glow,
    weaponFloat: normalized.weapon.float,
    weaponShine: normalized.weapon.shine,
    weaponSnake: normalized.weapon.snake,
    weaponParallax: normalized.weapon.parallax,

    // Stats
    statsGlow: normalized.stats.glow,
    statsFire: normalized.stats.fire,
    statsShine: normalized.stats.shine,
    statsHover: normalized.stats.hover,
    numberAnimation: normalized.stats.numberAnimation,
    statNumberGlow: normalized.stats.numberGlow,

    // Achievements
    achievementGlow: normalized.achievements.glow,
    achievementShine: normalized.achievements.shine,
    achievementHover: normalized.achievements.hover,

    // Game Center
    gameGlow: normalized.gameCenter.glow,
    gameFloat: normalized.gameCenter.hover,
    gameBorder: normalized.gameCenter.shine,

    // Clips/Gallery
    showcaseFrame:
      normalized.clips.premiumFrame ||
      normalized.gallery.premiumFrame,
    showcaseGlow:
      normalized.clips.glow ||
      normalized.gallery.glow,
    showcaseZoom:
      normalized.clips.hover ||
      normalized.gallery.zoom,
    showcaseShine:
      normalized.clips.shine ||
      normalized.gallery.shine,

    // Atmosphere
    particles: normalized.atmosphere.particles,
    ambientGlow: normalized.atmosphere.ambientGlow,
    floatingLights: normalized.atmosphere.floatingLights,
    scrollReveal: normalized.atmosphere.scrollReveal,
    cursorGlow: normalized.atmosphere.cursorGlow,

    // New V2 controls
    animatedFrame: normalized.frame.animated,
    edgeShine: normalized.frame.edgeShine,
    diamondCorners: normalized.frame.diamondCorners,
  };

  return normalized;
}

async function proCustomizationStatus(claims, env) {
  const player = await proFindPlayer(claims, env);
  const adminBypass = proIsAdminClaims(claims, env);
  const expiresAt = player.fields?.proExpiresAt || null;
  const expiryMs = expiresAt ? Date.parse(expiresAt) : 0;
  const active =
    adminBypass ||
    (
      player.fields?.proActive === true &&
      (!expiryMs || expiryMs > Date.now())
    );

  return { player, adminBypass, active };
}

async function proGetCustomization(request, env) {
  const claims = await proFirebaseIdToken(proAuthHeader(request), env);
  const { player, active } = await proCustomizationStatus(claims, env);

  if (!active) {
    return proJson({
      success: true,
      proActive: false,
      customization: null,
    });
  }

  const saved = proCustomizationObject(
    player.fields?.proCustomization
  );

  return proJson({
    success: true,
    proActive: true,
    customization: proCustomizationSanitize(saved || {}),
    updatedAt: player.fields?.proCustomizationUpdatedAt || null,
  });
}

async function proSaveCustomization(request, env) {
  const claims = await proFirebaseIdToken(proAuthHeader(request), env);
  const { player, adminBypass, active } =
    await proCustomizationStatus(claims, env);

  if (!active) {
    return proJson(
      {
        success: false,
        error: "Active 4FU PRO is required to save profile customization",
      },
      403
    );
  }

  const body = await request.json().catch(() => null);
  const customization = proCustomizationSanitize(
    body?.customization || body
  );

  await proUpdatePlayer(
    player,
    {
      proCustomization: JSON.stringify(customization),
      proCustomizationUpdatedAt: new Date().toISOString(),
    },
    env
  );

  return proJson({
    success: true,
    proActive: true,
    adminBypass,
    customization,
    updatedAt: new Date().toISOString(),
  });
}

async function proPublicCustomization(request, env) {
  const url = new URL(request.url);
  const playerId = String(
    url.searchParams.get("playerId") || ""
  ).trim();

  if (!playerId || !/^[A-Za-z0-9_-]{1,128}$/.test(playerId)) {
    return proJson(
      {
        success: false,
        error: "Valid playerId is required",
      },
      400
    );
  }

  try {
    const document = await proFirestoreRequest(
      `players/${encodeURIComponent(playerId)}`,
      "GET",
      undefined,
      env
    );

    const fields = document?.fields || {};
    const storedProActive = fields.proActive?.booleanValue === true;
    const expiresAt =
      fields.proExpiresAt?.timestampValue ||
      fields.proExpiresAt?.stringValue ||
      null;
    const expiryMs = expiresAt ? Date.parse(expiresAt) : 0;

    const loginEmail =
      fields.loginEmail?.stringValue || "";

    const adminBypass = proIsAdminClaims(
      { email: loginEmail },
      env
    );

    const proActive =
      adminBypass ||
      (
        storedProActive &&
        (!expiryMs || expiryMs > Date.now())
      );

    if (!proActive) {
      return proJson({
        success: true,
        proActive: false,
        customization: null,
      });
    }

    const raw =
      fields.proCustomization?.stringValue || null;

    return proJson({
      success: true,
      proActive: true,
      customization: proCustomizationSanitize(
        proCustomizationObject(raw) || {}
      ),
      updatedAt:
        fields.proCustomizationUpdatedAt?.stringValue ||
        null,
    });
  } catch (error) {
    console.error(
      "4FU public PRO customization error:",
      error?.message || error
    );

    return proJson(
      {
        success: false,
        error: "Unable to read PRO profile customization",
      },
      500
    );
  }
}


function proAuthHeader(request) {
  const value = request.headers.get("Authorization") || "";
  if (!value.toLowerCase().startsWith("bearer ")) return "";
  return value.slice(7).trim();
}

async function proRazorpayRequest(path, method, body, env) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured");
  }

  const basic = btoa(
    `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
  );

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.error?.description ||
      data?.error?.reason ||
      `Razorpay HTTP ${response.status}`
    );
  }

  return data;
}

async function proCreateSubscription(request, env) {
  const initialClaims = await proFirebaseIdToken(proAuthHeader(request), env);
  if (proIsAdminClaims(initialClaims, env)) {
    return proJson({
      success: true,
      alreadyActive: true,
      adminBypass: true,
      proActive: true,
      proPlan: "admin",
      proPaymentStatus: "admin",
      proExpiresAt: null,
    });
  }
  const claims = await proFirebaseIdToken(proAuthHeader(request), env);
  const player = await proFindPlayer(claims, env);

  const existingExpires = Date.parse(player.fields?.proExpiresAt || "");
  if (
    player.fields?.proActive === true &&
    Number.isFinite(existingExpires) &&
    existingExpires > Date.now()
  ) {
    return proJson({
      success: true,
      alreadyActive: true,
      proActive: true,
      proExpiresAt: player.fields.proExpiresAt,
    });
  }

  const planId =
    env.RAZORPAY_PRO_PLAN_ID ||
    "plan_TfxiwIYuTxQILZ";

  const subscription = await proRazorpayRequest(
    "/subscriptions",
    "POST",
    {
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: {
        firebaseUid: claims.sub,
        playerDocId: player.id,
        playerEmail: claims.email || "",
        plan: "4FU PRO Monthly",
        price: "49",
      },
    },
    env
  );

  await proUpdatePlayer(
    player,
    {
      proPaymentStatus: "created",
      proPlan: "monthly",
      proPrice: Number(env.PRO_PRICE_INR || 49),
      razorpaySubscriptionId: subscription.id,
      proAutoRenew: true,
    },
    env
  );

  return proJson({
    success: true,
    subscriptionId: subscription.id,
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    planId,
    amount: Number(env.PRO_PRICE_INR || 49) * 100,
    currency: "INR",
    prefill: {
      name:
        player.fields?.displayName ||
        player.fields?.name ||
        claims.name ||
        "",
      email: claims.email || player.fields?.loginEmail || "",
    },
  });
}

async function proVerifyPayment(request, env) {
  const initialClaims = await proFirebaseIdToken(proAuthHeader(request), env);
  if (proIsAdminClaims(initialClaims, env)) {
    return proJson({
      success: true,
      proActive: true,
      adminBypass: true,
      proPlan: "admin",
      proPaymentStatus: "admin",
      proExpiresAt: null,
    });
  }
  const claims = await proFirebaseIdToken(proAuthHeader(request), env);
  const body = await request.json().catch(() => null);

  const paymentId = body?.razorpay_payment_id;
  const subscriptionId = body?.razorpay_subscription_id;
  const signature = body?.razorpay_signature;

  if (!paymentId || !subscriptionId || !signature) {
    return proJson(
      { success: false, error: "Incomplete Razorpay payment response" },
      400
    );
  }

  const valid = await proHmacVerify(
    env.RAZORPAY_KEY_SECRET,
    `${paymentId}|${subscriptionId}`,
    signature
  );

  if (!valid) {
    return proJson(
      { success: false, error: "Invalid Razorpay payment signature" },
      400
    );
  }

  const player = await proFindPlayer(claims, env);
  const subscription = await proRazorpayRequest(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    "GET",
    undefined,
    env
  );

  const notesUid = subscription?.notes?.firebaseUid;
  if (notesUid && notesUid !== claims.sub) {
    return proJson(
      { success: false, error: "Subscription does not belong to this account" },
      403
    );
  }

  const currentEnd = Number(subscription?.current_end || 0);
  const expiresAt =
    proIsoFromUnix(currentEnd) ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const active =
    subscription?.status === "active" ||
    subscription?.status === "authenticated";

  await proUpdatePlayer(
    player,
    {
      proActive: active,
      proPlan: "monthly",
      proPrice: Number(env.PRO_PRICE_INR || 49),
      proStartedAt: new Date().toISOString(),
      proExpiresAt: expiresAt,
      proPaymentStatus: active ? "paid" : String(subscription?.status || "pending"),
      razorpaySubscriptionId: subscriptionId,
      razorpayPaymentId: paymentId,
      proAutoRenew: subscription?.status !== "cancelled",
    },
    env
  );

  return proJson({
    success: true,
    proActive: active,
    proExpiresAt: expiresAt,
    subscriptionStatus: subscription?.status || null,
  });
}


function proAdminEmails(env) {
  return String(env.PRO_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function proIsAdminClaims(claims, env) {
  const email = String(claims?.email || "").trim().toLowerCase();
  if (!email) return false;
  return proAdminEmails(env).includes(email);
}

async function proPublicStatus(request, env) {
  const url = new URL(request.url);
  const playerId = String(url.searchParams.get("playerId") || "").trim();

  if (!playerId || !/^[A-Za-z0-9_-]{1,128}$/.test(playerId)) {
    return proJson(
      {
        success: false,
        error: "Valid playerId is required",
      },
      400
    );
  }

  try {
    const document = await proFirestoreRequest(
      `players/${encodeURIComponent(playerId)}`,
      "GET",
      undefined,
      env
    );

    const fields = document?.fields || {};
    const storedProActive = fields.proActive?.booleanValue === true;

    const expiresAt =
      fields.proExpiresAt?.timestampValue ||
      fields.proExpiresAt?.stringValue ||
      null;

    const expiryMs = expiresAt ? Date.parse(expiresAt) : 0;
    const storedActive =
      storedProActive && (!expiryMs || expiryMs > Date.now());

    // Use the SAME server-side admin bypass already used by /pro/status.
    // No client/admin flag is trusted.
    const loginEmail =
      fields.loginEmail?.stringValue ||
      fields.loginEmail?.stringValue ||
      "";

    const adminBypass = proIsAdminClaims(
      { email: loginEmail },
      env
    );

    return proJson({
      success: true,
      proActive: adminBypass || storedActive,
      adminBypass,
    });
  } catch (error) {
    console.error("4FU public PRO status error:", error?.message || error);

    return proJson(
      {
        success: false,
        error: "Unable to read player PRO status",
      },
      500
    );
  }
}

async function proStatus(request, env) {
  const claims = await proFirebaseIdToken(proAuthHeader(request), env);
  const player = await proFindPlayer(claims, env);

  const adminBypass = proIsAdminClaims(claims, env);

  const expiresAt = player.fields?.proExpiresAt || null;
  const expiryMs = expiresAt ? Date.parse(expiresAt) : 0;
  const active =
    adminBypass ||
    (
      player.fields?.proActive === true &&
      (!expiryMs || expiryMs > Date.now())
    );

  if (
    !adminBypass &&
    player.fields?.proActive === true &&
    expiryMs &&
    expiryMs <= Date.now()
  ) {
    await proUpdatePlayer(
      player,
      {
        proActive: false,
        proPaymentStatus: "expired",
        proAutoRenew: false,
      },
      env
    );
  }

  return proJson({
    success: true,
    proActive: active,
    proAdminBypass: adminBypass,
    proPlan: adminBypass
      ? "admin"
      : (player.fields?.proPlan || null),
    proPrice: Number(player.fields?.proPrice || env.PRO_PRICE_INR || 49),
    proStartedAt: player.fields?.proStartedAt || null,
    proExpiresAt: adminBypass ? null : expiresAt,
    proPaymentStatus: adminBypass
      ? "admin"
      : (
          active
            ? player.fields?.proPaymentStatus || "paid"
            : (
                expiryMs && expiryMs <= Date.now()
                  ? "expired"
                  : player.fields?.proPaymentStatus || "free"
              )
        ),
    razorpaySubscriptionId:
      player.fields?.razorpaySubscriptionId || null,
  });
}

async function proWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Razorpay-Signature") || "";

  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    return new Response("Webhook secret is not configured", { status: 500 });
  }

  const valid = await proHmacVerify(
    env.RAZORPAY_WEBHOOK_SECRET,
    rawBody,
    signature
  );

  if (!valid) {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload?.event || "";
  const subscription =
    payload?.payload?.subscription?.entity ||
    payload?.payload?.subscription ||
    null;

  if (!subscription?.id) {
    return new Response("Webhook received", { status: 200 });
  }

  const firebaseUid = subscription?.notes?.firebaseUid;
  if (!firebaseUid) {
    return new Response("Webhook received without Firebase UID", { status: 200 });
  }

  let player;
  try {
    player = await proFindPlayer({ sub: firebaseUid }, env);
  } catch (error) {
    console.warn("PRO webhook player lookup failed:", error?.message || error);
    return new Response("Webhook received; player not found", { status: 200 });
  }

  const currentEnd = Number(subscription.current_end || 0);
  const expiresAt = proIsoFromUnix(currentEnd);

  const activateEvents = new Set([
    "subscription.activated",
    "subscription.charged",
    "subscription.resumed",
  ]);

  const hardOffEvents = new Set([
    "subscription.halted",
    "subscription.completed",
  ]);

  const cancelled =
    event === "subscription.cancelled" ||
    subscription.status === "cancelled";

  if (activateEvents.has(event)) {
    await proUpdatePlayer(
      player,
      {
        proActive: true,
        proPlan: "monthly",
        proPrice: Number(env.PRO_PRICE_INR || 49),
        proExpiresAt: expiresAt || new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        proPaymentStatus: "paid",
        razorpaySubscriptionId: subscription.id,
        proAutoRenew: true,
      },
      env
    );
  } else if (hardOffEvents.has(event)) {
    await proUpdatePlayer(
      player,
      {
        proActive: false,
        proPaymentStatus: event === "subscription.completed"
          ? "completed"
          : "halted",
        proAutoRenew: false,
      },
      env
    );
  } else if (cancelled) {
    const keepUntil =
      expiresAt && Date.parse(expiresAt) > Date.now();

    await proUpdatePlayer(
      player,
      {
        proActive: keepUntil,
        proExpiresAt: expiresAt || player.fields?.proExpiresAt || null,
        proPaymentStatus: "cancelled",
        razorpaySubscriptionId: subscription.id,
        proAutoRenew: false,
      },
      env
    );
  }

  return new Response("OK", { status: 200 });
}

/* Admin bypass is virtual and is never written to proActive, so the expiry job cannot revoke it. */
async function proExpireAll(env) {
  const projectId = env.FIREBASE_PROJECT_ID || "fire-united";
  const token = await proServiceAccountAccessToken(env);

  const endpoint =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents:runQuery`;

  const body = {
    structuredQuery: {
      from: [{ collectionId: "players" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "proActive" },
          op: "EQUAL",
          value: { booleanValue: true },
        },
      },
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const rows = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(
      rows?.error?.message || `Firestore expiry query HTTP ${response.status}`
    );
  }

  let expired = 0;

  for (const row of Array.isArray(rows) ? rows : []) {
    const document = row?.document;
    if (!document?.name) continue;

    const fields = document.fields || {};
    const expires =
      fields.proExpiresAt?.stringValue ||
      fields.proExpiresAt?.timestampValue ||
      null;

    if (!expires || Date.parse(expires) > Date.now()) continue;

    const path = document.name.split("/documents/")[1];
    await proFirestoreRequest(
      `${path}?updateMask.fieldPaths=proActive&updateMask.fieldPaths=proPaymentStatus&updateMask.fieldPaths=proAutoRenew`,
      "PATCH",
      {
        fields: {
          proActive: { booleanValue: false },
          proPaymentStatus: { stringValue: "expired" },
          proAutoRenew: { booleanValue: false },
        },
      },
      env
    );

    expired += 1;
  }

  return expired;
}

async function proRoute(request, env, url) {
  try {
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "GET" && path === "/pro/status") {
      return await proStatus(request, env);
    }

    if (request.method === "GET" && path === "/pro/public-status") {
      return await proPublicStatus(request, env);
    }

    if (request.method === "GET" && path === "/pro/customization") {
      return await proGetCustomization(request, env);
    }

    if (request.method === "POST" && path === "/pro/customization") {
      return await proSaveCustomization(request, env);
    }

    if (request.method === "GET" && path === "/pro/public-customization") {
      return await proPublicCustomization(request, env);
    }

    if (request.method === "POST" && path === "/pro/create-subscription") {
      return await proCreateSubscription(request, env);
    }

    if (request.method === "POST" && path === "/pro/verify") {
      return await proVerifyPayment(request, env);
    }

    if (request.method === "POST" && path === "/pro/webhook") {
      return await proWebhook(request, env);
    }

    return proJson(
      {
        success: false,
        error: "Unknown PRO endpoint",
        endpoints: [
          "/pro/status",
          "/pro/create-subscription",
          "/pro/verify",
          "/pro/webhook",
        ],
      },
      404
    );
  } catch (error) {
    const message = error?.message || String(error);
    const authError =
      /Firebase ID token/i.test(message) ||
      /Firebase public key/i.test(message);

    console.error("4FU PRO route error:", message);
    return proJson(
      {
        success: false,
        error: message,
      },
      authError ? 401 : 500
    );
  }
}

/* =========================================================
   WORKER
   ========================================================= */

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      proExpireAll(env).catch((error) => {
        console.error("4FU PRO scheduled expiry failed:", error);
      })
    );
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }


    // 4FU PRO payment routes live on this SAME worker.
    if (url.pathname.replace(/\/+$/, "").startsWith("/pro/")) {
      return await proRoute(request, env, url);
    }


    /* =====================================================
       YOUTUBE LIVE TOURNAMENT ROUTE
       GET /?youtubeLive=1&videoId=VIDEO_ID
       Optional:
         &tournamentId=...
         &title=...
         &pageLink=...
         &notify=1
       ===================================================== */
    if (
      url.searchParams.get("youtubeLive") === "1" ||
      url.searchParams.get("youtube") === "live"
    ) {
      const videoId =
        extractYouTubeVideoId(
          url.searchParams.get("videoId") ||
          url.searchParams.get("liveLink") ||
          url.searchParams.get("url")
        );

      if (!videoId) {
        return json(
          {
            success: false,
            error:
              "Invalid or missing YouTube videoId/liveLink/url",
          },
          400
        );
      }

      try {
        const info =
          await getYouTubeLiveInfo(
            videoId,
            env
          );

        let notification = null;

        if (
          url.searchParams.get("notify") === "1"
        ) {
          notification =
            await maybeNotifyYouTubeLive(
              info,
              {
                tournamentId:
                  url.searchParams.get(
                    "tournamentId"
                  ),
                title:
                  url.searchParams.get(
                    "title"
                  ),
                pageLink:
                  url.searchParams.get(
                    "pageLink"
                  ),
              },
              env
            );
        }

        return json(
          {
            ...info,
            notification,
          },
          200,
          {
            "Cache-Control":
              "public, max-age=60, s-maxage=60",
            "X-4FU-YouTube":
              "videos.list",
          }
        );
      } catch (error) {
        return json(
          {
            success: false,
            error:
              error?.message ||
              "YouTube live lookup failed",
          },
          502,
          {
            "Cache-Control":
              "no-store",
          }
        );
      }
    }

    if (request.method !== "GET") {
      return json(
        {
          success: false,
          error: "Method not allowed",
        },
        405
      );
    }

    // =====================================================
    // B2 ONLY DIAGNOSTIC
    // DOES NOT CALL HL GAMING
    // DOES NOT REQUIRE FREE FIRE UID
    // =====================================================
    if (url.searchParams.get("b2check") === "1") {
      const checkAsset =
        (url.searchParams.get("asset") || "banner")
          .trim()
          .toLowerCase();

      const checkImgCode =
        url.searchParams.get("img_code") ||
        url.searchParams.get("imgCode") ||
        url.searchParams.get("id");

      if (
        (checkAsset !== "banner" && checkAsset !== "outfit") ||
        !checkImgCode
      ) {
        return json(
          {
            success: false,
            error: "Use asset=banner/outfit and img_code",
          },
          400
        );
      }

      const fileName = b2AssetFileName(
        checkAsset,
        checkImgCode
      );

      try {
        const stored = await b2DownloadFile(
          env,
          fileName
        );

        const b2Credentials = getB2Credentials(env);

        return json({
          success: true,
          b2: Boolean(
            b2Credentials.keyId &&
            b2Credentials.applicationKey &&
            b2Credentials.bucketName
          ),
          credentialsConfigured: Boolean(
            b2Credentials.keyId &&
            b2Credentials.applicationKey &&
            b2Credentials.bucketName
          ),
          exists: !!stored,
          fileName,
          message: stored
            ? "B2 file found"
            : "B2 file not found",
        });
      } catch (error) {
        return json(
          {
            success: false,
            b2: false,
            fileName,
            error:
              error?.message ||
              String(error),
          },
          500
        );
      }
    }

    // =====================================================
    // B2 ONLY FINGERPRINT
    // DOES NOT CALL HL GAMING / IMAGE API
    // Used to identify an already-cached placeholder object
    // without spending HL image quota.
    // =====================================================
    if (url.searchParams.get("b2fingerprint") === "1") {
      const checkAsset =
        (url.searchParams.get("asset") || "banner")
          .trim()
          .toLowerCase();

      const checkImgCode =
        url.searchParams.get("img_code") ||
        url.searchParams.get("imgCode") ||
        url.searchParams.get("id");

      if (
        (checkAsset !== "banner" && checkAsset !== "outfit") ||
        !checkImgCode
      ) {
        return json(
          {
            success: false,
            error: "Use asset=banner/outfit and img_code",
          },
          400
        );
      }

      const fileName = b2AssetFileName(checkAsset, checkImgCode);

      try {
        const fingerprint = await b2Sha256(env, fileName);
        return json({
          success: true,
          b2Only: true,
          imageApiCalled: false,
          imageApiQuotaUsed: false,
          asset: checkAsset,
          img_code: String(checkImgCode),
          fileName,
          exists: Boolean(fingerprint),
          fingerprint,
        });
      } catch (error) {
        return json(
          {
            success: false,
            b2Only: true,
            imageApiCalled: false,
            imageApiQuotaUsed: false,
            asset: checkAsset,
            img_code: String(checkImgCode),
            fileName,
            error: error?.message || String(error),
          },
          500
        );
      }
    }

    // =====================================================
    // SAFE ASSET DEBUG
    // DOES NOT CALL HL IMAGE ENDPOINT
    // Only reads numeric banner/outfit IDs from HL account
    // endpoints and checks whether the exact object exists in B2.
    // =====================================================
    if (url.searchParams.get("assetdebug") === "1") {
      const debugUid = (url.searchParams.get("uid") || "").trim();
      const debugRegion = (url.searchParams.get("region") || "IND")
        .trim()
        .toUpperCase();
      const debugAsset = (url.searchParams.get("asset") || "banner")
        .trim()
        .toLowerCase();

      if (!/^[0-9]{5,20}$/.test(debugUid)) {
        return json(
          { success: false, error: "Invalid UID" },
          400
        );
      }

      if (!/^[A-Z]{2,8}$/.test(debugRegion)) {
        return json(
          { success: false, error: "Invalid region" },
          400
        );
      }

      if (debugAsset !== "banner" && debugAsset !== "outfit") {
        return json(
          { success: false, error: "asset must be banner or outfit" },
          400
        );
      }

      try {
        // AccountInfo + AccountProfileInfo only.
        // IMPORTANT: this is NOT sectionName=image.
        const hlProfile = await hlgamingProfile(
          debugUid,
          debugRegion,
          env
        );

        const bannerId =
          hlProfile?.basicInfo?.bannerId ??
          null;

        const outfitIds = collectNumericIds(
          hlProfile?.profileInfo?.clothes || []
        );

        const ids =
          debugAsset === "banner"
            ? (bannerId !== null && bannerId !== undefined && bannerId !== ""
                ? [String(bannerId)]
                : [])
            : outfitIds;

        const results = [];

        for (const imgCode of ids) {
          const fileName = b2AssetFileName(debugAsset, imgCode);

          let b2Exists = false;
          let b2Checked = false;
          let b2Error = null;

          try {
            const stored = await b2DownloadFile(env, fileName);
            b2Checked = true;
            b2Exists = !!stored;
          } catch (error) {
            b2Error = error?.message || String(error);
          }

          results.push({
            img_code: imgCode,
            fileName,
            b2Checked,
            b2Exists,
            b2Error,
          });
        }

        const b2Credentials = getB2Credentials(env);

        return json({
          success: true,
          debugOnly: true,
          imageApiCalled: false,
          imageApiQuotaUsed: false,
          uid: debugUid,
          region: debugRegion,
          asset: debugAsset,
          source: "HL-Gaming-AccountInfo + AccountProfileInfo",
          bannerId: bannerId ?? null,
          outfitIds,
          b2: {
            credentialsConfigured: Boolean(
              b2Credentials.keyId &&
              b2Credentials.applicationKey &&
              b2Credentials.bucketName
            ),
            bucketName: b2Credentials.bucketName || null,
            results,
          },
        });
      } catch (error) {
        return json(
          {
            success: false,
            debugOnly: true,
            imageApiCalled: false,
            imageApiQuotaUsed: false,
            uid: debugUid,
            region: debugRegion,
            asset: debugAsset,
            error: error?.message || String(error),
          },
          502
        );
      }
    }

    const uid =
      (url.searchParams.get("uid") || "").trim();

    const region =
      (url.searchParams.get("region") || "IND")
        .trim()
        .toUpperCase();

    const asset =
      (url.searchParams.get("asset") || "")
        .trim()
        .toLowerCase();

    const key =
      env.FREE_FIRE_API_KEY;

    if (!/^[0-9]{5,20}$/.test(uid)) {
      return json(
        {
          success: false,
          error: "Invalid UID",
        },
        400
      );
    }

    if (!/^[A-Z]{2,8}$/.test(region)) {
      return json(
        {
          success: false,
          error: "Invalid region",
        },
        400
      );
    }
    /* =====================================================
       EXISTING BANNER / OUTFIT PROXY
       ===================================================== */

    if (asset === "banner" || asset === "outfit") {
      // Direct HL img_code lookup: useful for testing known banner/outfit IDs
      // even when the profile/stat upstream providers are rate-limited.
      const directImgCode =
        url.searchParams.get("img_code") ||
        url.searchParams.get("imgCode") ||
        url.searchParams.get("id");

      if (directImgCode) {
        // ---------------------------------------------------------
        // SAFE PRIMARY-ONLY TEST MODE
        // ?nohl=1 means: B2 first, then existing primary provider ONLY.
        // NEVER call the HL image endpoint in this mode.
        // ---------------------------------------------------------
        if (url.searchParams.get("nohl") === "1") {
          // Strict B2-only diagnostic/test mode.
          return await getPermanentHLAsset(
            asset,
            directImgCode,
            env,
            null,
            region,
            null
          );
        }

        try {
          // IMPORTANT: explicit banner/outfit image lookup is B2-only.
          // No primary/public/HL image provider fallback is allowed.
          return await getPermanentHLAsset(
            asset,
            directImgCode,
            env,
            uid,
            region,
            key
          );
        } catch (hlDirectError) {
          console.error(
            "Backblaze B2 asset lookup failed:",
            hlDirectError?.message || hlDirectError
          );

          return json(
            {
              success: false,
              error: "Backblaze B2 asset lookup failed",
              details: hlDirectError?.message || String(hlDirectError),
              asset,
              img_code: String(directImgCode),
            },
            502
          );
        }
      }

      // No img_code in URL:
      // resolve the asset ID as before, but the actual image is delivered
      // strictly from Backblaze B2 by getPermanentHLAsset().
      try {
        const outfitIndex = Math.max(
          0,
          Number.parseInt(
            url.searchParams.get("outfitIndex") || "0",
            10
          ) || 0
        );

        return await hlgamingAsset(
          asset,
          uid,
          region,
          env,
          null,
          outfitIndex,
          key
        );
      } catch (assetError) {
        console.error(
          `Backblaze B2 ${asset} pipeline failed:`,
          assetError?.message || assetError
        );

        return json(
          {
            success: false,
            error: `Backblaze B2 ${asset} pipeline failed`,
            details:
              assetError?.message ||
              String(assetError),
            asset,
          },
          502
        );
      }
    }


    /*
     * =========================================================
     * SAVED PROFILE MODE
     *
     * Default:
     *   Return the last successfully saved profile from B2.
     *   NO primary/secondary/HL profile API call is made.
     *
     * Manual refresh:
     *   ?refresh=1
     *   Fetch live data, then save the successful combined
     *   response back to B2.
     *
     * If refresh fails, the previous B2 snapshot is returned.
     * =========================================================
     */
    const forceRefresh =
      url.searchParams.get("refresh") === "1" ||
      url.searchParams.get("update") === "1" ||
      url.searchParams.get("force") === "1";

    const savedProfileCache =
      await b2ReadCombinedCache(uid, region, env);

    if (!forceRefresh && savedProfileCache?.data) {
      return json(
        {
          ...savedProfileCache.data,
          dataSource: "Backblaze-B2-saved",
          liveApiCalled: false,
          lastUpdated: savedProfileCache.updatedAt,
          updateRequired: true,
        },
        200,
        {
          "Cache-Control": "no-store",
          "X-4FU-Data-Source": "Backblaze-B2-saved",
          "X-4FU-Live-API": "NOT-CALLED",
        }
      );
    }

    if (!key) {
      if (savedProfileCache?.data) {
        return json(
          {
            ...savedProfileCache.data,
            dataSource: "Backblaze-B2-saved-fallback",
            liveApiCalled: false,
            lastUpdated: savedProfileCache.updatedAt,
            updateFailed: true,
            updateError: "FREE_FIRE_API_KEY is not configured",
            updateRequired: true,
          },
          200,
          {
            "Cache-Control": "no-store",
            "X-4FU-Data-Source": "Backblaze-B2-saved-fallback",
            "X-4FU-Live-API": "NOT-CALLED",
          }
        );
      }

      return json(
        {
          success: false,
          error: "FREE_FIRE_API_KEY is not configured",
        },
        500
      );
    }

    try {

      /* ===================================================
         PRIMARY API
         =================================================== */

      let profileData = null;
      let statsData = null;

      // Try primary profile; if it is rate-limited/unavailable, use the
      // existing secondary profile API. Preserve both errors if both fail.
      let profilePrimaryError = null;
      try {
        profileData = await upstreamJSON("bhau", uid, region, key);
      } catch (primaryProfileError) {
        profilePrimaryError = primaryProfileError;
        const fallback = await secondaryJSON("player-profile", {
          uid,
          server: region,
          need_gallery_info: "true",
          need_spark_info: "true",
        });

        if (fallback.success) {
          profileData = normalizeSecondaryProfile(fallback.data);
        } else {
          try {
            profileData = await hlgamingProfile(uid, region, env);
          } catch (hlError) {
            // Last profile fallback: use the profile snapshot already stored
            // in Backblaze B2. This keeps the profile page alive even when
            // the live providers are rate-limited or unavailable.
            const cachedProfile = await b2CachedProfile(uid, region, env);
            if (cachedProfile?.data) {
              profileData = cachedProfile.data;
            } else {
              throw new Error(
                `Profile providers unavailable: primary=${primaryProfileError?.message || "failed"}; secondary=${fallback.error || "failed"}; hl-gaming=${hlError?.message || "failed"}`
              );
            }
          }
        }
      }

      // Try primary stats; if it is rate-limited/unavailable, use the
      // existing secondary stats API. Preserve both errors if both fail.
      let statsPrimaryError = null;
      try {
        statsData = await upstreamJSON("stats", uid, region, key);
      } catch (primaryStatsError) {
        statsPrimaryError = primaryStatsError;
        const fallback = await secondaryJSON("player-stats", {
          uid,
          server: region,
          gamemode: "br",
          matchmode: "CAREER",
        });

        if (fallback.success) {
          statsData = fallback.data;
        } else {
          // Stats are optional for the profile response. Do not let a
          // temporary stats-provider/rate-limit failure hide the player's
          // name, rank, banner, outfits and other profile data.
          statsData = {};
        }
      }


      /* ===================================================
         SECONDARY API

         IMPORTANT:
         Failure here DOES NOT break primary API.
         =================================================== */

      const [
        secondaryProfileResult,
        secondaryStatsResult,
      ] = await Promise.all([
        secondaryJSON(
          "player-profile",
          {
            uid,
            server: region,
            need_gallery_info: "true",
            need_spark_info: "true",
          }
        ),

        secondaryJSON(
          "player-stats",
          {
            uid,
            server: region,
            gamemode: "br",
            matchmode: "CAREER",
          }
        ),
      ]);


      const secondaryProfile =
        secondaryProfileResult.success
          ? normalizeSecondaryProfile(
            secondaryProfileResult.data
          )
          : {};

      const secondaryModes =
        secondaryStatsResult.success
          ? normalizeSecondaryStats(
            secondaryStatsResult.data
          )
          : {};


      /* ===================================================
         PRIMARY DATA
         =================================================== */

      const basicInfo =
        profileData?.basicInfo ||
        profileData?.basic_info ||
        {};

      const profileInfo =
        profileData?.profileInfo ||
        profileData?.profile_info ||
        {};

      const socialInfo =
        profileData?.socialInfo ||
        profileData?.social_info ||
        {};

      const clanBasicInfo =
        profileData?.clanBasicInfo ||
        profileData?.clan_basic_info ||
        profileData?.clan ||
        {};

      const captainBasicInfo =
        profileData?.captainBasicInfo ||
        profileData?.captain_basic_info ||
        {};

      const creditScoreInfo =
        profileData?.creditScoreInfo ||
        profileData?.credit_score_info ||
        {};

      const petInfo =
        profileData?.petInfo ||
        profileData?.pet ||
        {};

      const diamondCostRes =
        profileData?.diamondCostRes ||
        profileData?.diamond_cost_res ||
        {};


      /* ===================================================
         PRIMARY MODE STATS
         =================================================== */

      const modes =
        modeStatsFromRaw(statsData);

      const stats =
        calculateStats(
          modes.solo,
          modes.duo,
          modes.squad
        );


      /* ===================================================
         SECONDARY DETAILED MODE STATS
         =================================================== */

      const detailedStats = {
        solo: detailedMode(modes.solo),
        duo: detailedMode(modes.duo),
        squad: detailedMode(modes.squad),
      };


      /* ===================================================
         ASSET URLS
         =================================================== */

      const encodedUID =
        encodeURIComponent(uid);

      const encodedRegion =
        encodeURIComponent(region);

      const origin =
        url.origin;

      const path =
        url.pathname || "/";

      // IMPORTANT: do NOT call HL image endpoints while building the profile JSON.
      // Return stable Worker proxy URLs using the numeric image codes instead.
      // The browser receives explicit B2 asset proxy URLs; image delivery is
      // strictly Backblaze B2 and never uses the HL image endpoint.
      // ---------------------------------------------------------
      // ASSET ID RESOLUTION
      //
      // Primary/secondary profile providers can return the normal
      // profile data without exposing AccountBannerId/EquippedOutfit.
      // In that case, ask HL AccountInfo + AccountProfileInfo for the
      // NUMERIC IDs only. These are account endpoints, NOT the HL image
      // endpoint, so image quota is not consumed here.
      //
      // Once IDs are known, the browser receives img_code URLs.
      // The image request is always Backblaze B2 only.
      // ---------------------------------------------------------

      const basicInfoForAssets =
        profileData?.basicInfo ||
        profileData?.basic_info ||
        {};

      const profileInfoForAssets =
        profileData?.profileInfo ||
        profileData?.profile_info ||
        {};

      let resolvedBannerId =
        firstNumericId(
          basicInfoForAssets.bannerId,
          basicInfoForAssets.bannerID,
          basicInfoForAssets.AccountBannerId,
          basicInfoForAssets.accountBannerId,
          profileData?.bannerId,
          profileData?.bannerID,
          profileData?.AccountBannerId,
          profileData?.accountBannerId
        );

      let resolvedOutfitIds = [
        ...collectNumericIds(
          profileInfoForAssets.clothes
        ),
        ...collectNumericIds(
          profileInfoForAssets.Clothes
        ),
        ...collectNumericIds(
          profileInfoForAssets.equippedClothes
        ),
        ...collectNumericIds(
          profileInfoForAssets.equippedOutfit
        ),
        ...collectNumericIds(
          profileInfoForAssets.EquippedOutfit
        ),
        ...collectNumericIds(
          profileData?.clothes
        ),
        ...collectNumericIds(
          profileData?.equippedClothes
        ),
        ...collectNumericIds(
          profileData?.equippedOutfit
        ),
        ...collectNumericIds(
          profileData?.EquippedOutfit
        ),
      ].filter(
        (value, index, array) =>
          array.indexOf(value) === index
      );

      // Secondary normalized profile is also available in this request.
      if (secondaryProfile) {
        const secondaryBasic =
          secondaryProfile.basicInfo || {};

        const secondaryProfileInfo =
          secondaryProfile.profileInfo || {};

        resolvedBannerId =
          resolvedBannerId ??
          secondaryBasic.bannerId ??
          secondaryBasic.bannerID ??
          secondaryBasic.AccountBannerId ??
          secondaryBasic.accountBannerId ??
          secondaryProfile.bannerId ??
          secondaryProfile.bannerID ??
          null;

        resolvedOutfitIds = [
          ...resolvedOutfitIds,
          ...collectNumericIds(
            secondaryProfileInfo.clothes
          ),
          ...collectNumericIds(
            secondaryProfileInfo.Clothes
          ),
          ...collectNumericIds(
            secondaryProfileInfo.equippedOutfit
          ),
          ...collectNumericIds(
            secondaryProfileInfo.EquippedOutfit
          ),
          ...collectNumericIds(
            secondaryProfile.clothes
          ),
          ...collectNumericIds(
            secondaryProfile.equippedOutfit
          ),
          ...collectNumericIds(
            secondaryProfile.EquippedOutfit
          ),
        ].filter(
          (value, index, array) =>
            array.indexOf(value) === index
        );
      }

      // If either asset is still missing, get the numeric IDs directly
      // from HL's account endpoints. Again: NO image endpoint here.
      if (
        (resolvedBannerId === null ||
          resolvedBannerId === undefined ||
          resolvedBannerId === "") ||
        resolvedOutfitIds.length === 0
      ) {
        try {
          const hlAssetProfile =
            await hlgamingProfile(
              uid,
              region,
              env
            );

          const hlBasic =
            hlAssetProfile?.basicInfo || {};

          const hlProfile =
            hlAssetProfile?.profileInfo || {};

          resolvedBannerId =
            resolvedBannerId ??
            firstNumericId(
              hlBasic.bannerId,
              hlBasic.bannerID,
              hlBasic.AccountBannerId,
              hlBasic.accountBannerId
            );

          resolvedOutfitIds = [
            ...resolvedOutfitIds,
            ...collectNumericIds(hlProfile.clothes),
            ...collectNumericIds(hlProfile.Clothes),
            ...collectNumericIds(hlProfile.EquippedOutfit),
            ...collectNumericIds(hlProfile.equippedOutfit),
          ].filter(
            (value, index, array) =>
              array.indexOf(value) === index
          );
        } catch (assetIdError) {
          console.warn(
            "HL asset ID lookup failed:",
            assetIdError?.message || assetIdError
          );
        }
      }

      const fallbackBanner =
        `${origin}${path}?uid=${encodedUID}&region=${encodedRegion}&asset=banner`;

      const fallbackOutfit =
        `${origin}${path}?uid=${encodedUID}&region=${encodedRegion}&asset=outfit`;

      // Explicit img_code is important: it makes the proxy request
      // independent of the profile/stat provider on the next request.
      const proxyBanner =
        resolvedBannerId !== null &&
        resolvedBannerId !== undefined &&
        resolvedBannerId !== ""
          ? `${origin}${path}?uid=${encodedUID}&region=${encodedRegion}&asset=banner&img_code=${encodeURIComponent(String(resolvedBannerId))}`
          : fallbackBanner;

      const proxyOutfits =
        resolvedOutfitIds.map(
          (imgCode) =>
            `${origin}${path}?uid=${encodedUID}&region=${encodedRegion}&asset=outfit&img_code=${encodeURIComponent(String(imgCode))}`
        );

      const assets = {
        banner: proxyBanner,
        outfit:
          proxyOutfits[0] ||
          fallbackOutfit,
        outfits: proxyOutfits,
      };

      /* ===================================================
         SECONDARY PROFILE REFERENCES
         =================================================== */

      const secondaryBasic =
        secondaryProfile.basicInfo || {};

      const secondaryClan =
        secondaryProfile.clanBasicInfo || {};

      const secondaryPet =
        secondaryProfile.petInfo || {};

      const secondarySocial =
        secondaryProfile.socialInfo || {};


      /* ===================================================
         COMBINED RESPONSE
         =================================================== */

      const combinedResponse = {

        success: true,

        uid,

        region,


        /* =================================================
           EXISTING NORMALIZED FIELDS
           ================================================= */

        name:
          first(
            basicInfo.nickname,
            profileData?.nickname,
            profileData?.name,
            secondaryBasic.nickname
          ),

        level:
          first(
            basicInfo.level,
            profileData?.level,
            secondaryBasic.level
          ),

        rank:
          first(
            basicInfo.rankName,
            basicInfo.rank,
            secondaryBasic.rank
          ),

        rankingPoints:
          first(
            basicInfo.rankingPoints,
            basicInfo.ranking_points,
            secondaryBasic.rankingpoints,
            secondaryBasic.rankingPoints
          ),

        csRank:
          first(
            basicInfo.csRank,
            basicInfo.cs_rank,
            secondaryBasic.csrank,
            secondaryBasic.csRank
          ),

        csRankingPoints:
          first(
            basicInfo.csRankingPoints,
            basicInfo.cs_ranking_points,
            secondaryBasic.csrankingpoints,
            secondaryBasic.csRankingPoints
          ),

        likes:
          first(
            basicInfo.liked,
            basicInfo.likes,
            profileData?.liked,
            profileData?.likes,
            secondaryBasic.liked
          ),

        guild:
          first(
            clanBasicInfo.clanName,
            clanBasicInfo.name,
            profileData?.guild,
            profileData?.clanName,
            secondaryClan.clanname,
            secondaryClan.clanName
          ),

        guildId:
          first(
            clanBasicInfo.clanId,
            clanBasicInfo.id,
            profileData?.clanId,
            secondaryClan.clanid,
            secondaryClan.clanId
          ),

        language:
          first(
            socialInfo.language,
            socialInfo.lang,
            profileData?.language,
            secondarySocial.language
          ),

        gender:
          first(
            socialInfo.gender,
            profileData?.gender,
            secondarySocial.gender
          ),


        /* =================================================
           EXISTING PRIMARY DATA
           ================================================= */

        profileInfo,

        petInfo,

        stats,

        modeStats: modes,


        /* =================================================
           NEW DETAILED STATS
           ================================================= */

        detailedStats,


        /* =================================================
           SECONDARY API STATUS
           ================================================= */

        secondaryApi: {
          available:
            Boolean(
              secondaryProfileResult.success ||
              secondaryStatsResult.success
            ),

          profile:
            Boolean(
              secondaryProfileResult.success
            ),

          stats:
            Boolean(
              secondaryStatsResult.success
            ),

          profileError:
            secondaryProfileResult.success
              ? null
              : secondaryProfileResult.error,

          statsError:
            secondaryStatsResult.success
              ? null
              : secondaryStatsResult.error,
        },


        /* =================================================
           FULL PROFILE OBJECTS
           ================================================= */

        profile: {
          basicInfo,
          profileInfo,
          socialInfo,
          clanBasicInfo,
          captainBasicInfo,
          petInfo,
          creditScoreInfo,
          diamondCostRes,
        },


        /* =================================================
           SECONDARY FULL PROFILE
           ================================================= */

        secondaryProfile: {
          basicInfo:
            secondaryProfile.basicInfo || {},

          clanBasicInfo:
            secondaryProfile.clanBasicInfo || {},

          captainBasicInfo:
            secondaryProfile.captainBasicInfo || {},

          petInfo:
            secondaryProfile.petInfo || {},

          socialInfo:
            secondaryProfile.socialInfo || {},

          creditScoreInfo:
            secondaryProfile.creditScoreInfo || {},

          userSparkInfo:
            secondaryProfile.userSparkInfo || null,

          diamondCostRes:
            secondaryProfile.diamondCostRes || null,
        },


        /* =================================================
           EXTRA PRIMARY PROFILE FIELDS
           ================================================= */

        bannerId:
          first(
            basicInfo.bannerId,
            secondaryBasic.bannerid,
            secondaryBasic.bannerId
          ),

        headPic:
          first(
            basicInfo.headPic,
            secondaryBasic.headpic,
            secondaryBasic.headPic
          ),

        weaponSkinShows:
          first(
            basicInfo.weaponSkinShows,
            secondaryBasic.weaponskinshows,
            secondaryBasic.weaponSkinShows
          ),

        pinId:
          first(
            basicInfo.pinId,
            secondaryBasic.pinid,
            secondaryBasic.pinId
          ),

        maxRank:
          first(
            basicInfo.maxRank,
            secondaryBasic.maxrank,
            secondaryBasic.maxRank
          ),

        csMaxRank:
          first(
            basicInfo.csMaxRank,
            secondaryBasic.csmaxrank,
            secondaryBasic.csMaxRank
          ),

        seasonId:
          first(
            basicInfo.seasonId,
            secondaryBasic.seasonid,
            secondaryBasic.seasonId
          ),

        badgeCnt:
          first(
            basicInfo.badgeCnt,
            secondaryBasic.badgecnt,
            secondaryBasic.badgeCnt
          ),

        badgeId:
          first(
            basicInfo.badgeId,
            secondaryBasic.badgeid,
            secondaryBasic.badgeId
          ),

        title:
          first(
            basicInfo.title,
            secondaryBasic.title
          ),

        releaseVersion:
          first(
            basicInfo.releaseVersion,
            secondaryBasic.releaseversion,
            secondaryBasic.releaseVersion
          ),

        showBrRank:
          first(
            basicInfo.showBrRank,
            secondaryBasic.showbrrank,
            secondaryBasic.showBrRank
          ),

        showCsRank:
          first(
            basicInfo.showCsRank,
            secondaryBasic.showcsrank,
            secondaryBasic.showCsRank
          ),

        accountId:
          first(
            basicInfo.accountId,
            secondaryBasic.accountid,
            secondaryBasic.accountId
          ),

        accountType:
          first(
            basicInfo.accountType,
            secondaryBasic.accounttype,
            secondaryBasic.accountType
          ),

        exp:
          first(
            basicInfo.exp,
            secondaryBasic.exp
          ),

        createAt:
          first(
            basicInfo.createAt,
            secondaryBasic.createat,
            secondaryBasic.createAt
          ),

        lastLoginAt:
          first(
            basicInfo.lastLoginAt,
            secondaryBasic.lastloginat,
            secondaryBasic.lastLoginAt
          ),

        primeInfo:
          clean(
            basicInfo.primeInfo
          ),

        signature:
          first(
            socialInfo.signature,
            secondarySocial.signature
          ),

        rankShow:
          first(
            socialInfo.rankShow,
            secondarySocial.rankshow,
            secondarySocial.rankShow
          ),


        /* =================================================
           NEW DETAILED FIELDS
           ================================================= */

        detailed: {

          solo: detailedStats.solo,

          duo: detailedStats.duo,

          squad: detailedStats.squad,

        },


        /* =================================================
           ASSETS
           ================================================= */

        assets,


        /* =================================================
           RAW DATA
           ================================================= */

        rawProfile:
          profileData,

        rawStats:
          statsData,

        rawSecondaryProfile:
          secondaryProfileResult.success
            ? secondaryProfileResult.data
            : null,

        rawSecondaryStats:
          secondaryStatsResult.success
            ? secondaryStatsResult.data
            : null,

      };

      const savedUpdate = await b2WriteCombinedCache(
        uid,
        region,
        env,
        combinedResponse
      );

      return json(
        {
          ...combinedResponse,
          dataSource: "live-api",
          liveApiCalled: true,
          lastUpdated:
            savedUpdate.success
              ? savedUpdate.updatedAt
              : new Date().toISOString(),
          cacheSaved: savedUpdate.success,
          cacheFile: savedUpdate.fileName,
          updateRequired: false,
          cacheSaveError:
            savedUpdate.success
              ? null
              : savedUpdate.error,
        },
        200,
        {
          "Cache-Control": "no-store",
          "X-4FU-Data-Source": "live-api",
          "X-4FU-Live-API": "CALLED",
        }
      );

    } catch (error) {
      /*
       * If a manual refresh fails, NEVER destroy/replace the last
       * successful snapshot. Return it instead.
       */
      if (forceRefresh && savedProfileCache?.data) {
        return json(
          {
            ...savedProfileCache.data,
            dataSource: "Backblaze-B2-saved-fallback",
            liveApiCalled: false,
            lastUpdated: savedProfileCache.updatedAt,
            updateFailed: true,
            updateError:
              error?.message ||
              "Live API update failed; showing last saved data",
            updateRequired: true,
          },
          200,
          {
            "Cache-Control": "no-store",
            "X-4FU-Data-Source": "Backblaze-B2-saved-fallback",
            "X-4FU-Live-API": "NOT-CALLED",
          }
        );
      }

      return json(
        {
          success: false,

          error:
            error?.message ||
            "Free Fire API request failed",
        },

        502
      );
    }
  },
};