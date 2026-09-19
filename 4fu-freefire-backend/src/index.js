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

async function hlgamingImageUrl(imgCode, env) {
  const { userUid, apiKey } = getHLGamingCredentials(env);

  if (!userUid || !apiKey || imgCode === undefined || imgCode === null || imgCode === "") {
    return null;
  }

  const url = new URL(HL_GAMING_API_ROOT);
  url.searchParams.set("sectionName", "image");
  url.searchParams.set("useruid", userUid);
  url.searchParams.set("api", apiKey);
  url.searchParams.set("img_code", String(imgCode));

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  const bodyText = await response.text();

  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    return null;
  }

  if (!response.ok || data?.error) return null;

  const imageUrl = data?.result?.url || data?.result?.imageUrl || null;
  if (!imageUrl) return null;
  if (/placeholder|no[-_ ]?image|default[-_ ]?(banner|outfit|image)|not[-_ ]?found/i.test(imageUrl)) return null;
  return imageUrl;
}


/* =========================================================
   BACKBLAZE B2 PERMANENT FREE FIRE ASSET STORAGE
   First successful HL image fetch is copied to B2.
   Later requests are served from B2 without calling HL Gaming.
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

  const url =
    `${auth.downloadUrl}/file/${encodeURIComponent(env.B2_BUCKET_NAME)}/${fileName}`;

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

function b2AssetFileName(asset, imgCode) {
  const safeCode = String(imgCode).replace(/[^0-9A-Za-z_-]/g, "");
  const folder = asset === "banner" ? "banners" : "outfits";
  return `freefire/${folder}/${safeCode}.jpg`;
}

async function getPermanentHLAsset(asset, imgCode, env) {
  const fileName = b2AssetFileName(asset, imgCode);

  // =========================================================
  // 1) ALWAYS CHECK BACKBLAZE FIRST
  // =========================================================
  const stored = await b2DownloadFile(env, fileName);

  if (stored) {
    return new Response(stored.body, {
      status: 200,
      headers: corsHeaders({
        "Content-Type":
          stored.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-4FU-Asset": asset,
        "X-4FU-Provider": "Backblaze-B2",
        "X-4FU-Cache": "HIT",
      }),
    });
  }

  // =========================================================
  // 2) B2 MISS → ONLY NOW CALL HL GAMING
  // =========================================================
  const imageUrl = await hlgamingImageUrl(imgCode, env);

  if (!imageUrl) {
    return json(
      {
        success: false,
        error: `HL Gaming did not return a ${asset} image for ${imgCode}`,
        cache: "MISS",
      },
      502
    );
  }

  // =========================================================
  // 3) DOWNLOAD IMAGE FROM HL
  // =========================================================
  const imageResponse = await fetch(imageUrl, {
    headers: {
      Accept: "image/*",
    },
  });

  if (!imageResponse.ok) {
    const errorBody = await imageResponse.text();

    return new Response(
      JSON.stringify({
        success: false,
        error: `HL image download failed`,
        status: imageResponse.status,
        details: errorBody.slice(0, 300),
      }),
      {
        status: imageResponse.status,
        headers: corsHeaders({
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        }),
      }
    );
  }

  const body = await imageResponse.arrayBuffer();

  // =========================================================
  // 4) SAVE IMAGE PERMANENTLY TO BACKBLAZE
  // =========================================================
  try {
    await b2UploadFile(
      env,
      fileName,
      body,
      imageResponse.headers.get("content-type") || "image/jpeg"
    );
  } catch (b2WriteError) {
    // IMPORTANT:
    // Do NOT silently pretend caching succeeded.
    console.error(
      "Backblaze upload failed:",
      b2WriteError?.message || b2WriteError
    );

    return new Response(
      JSON.stringify({
        success: false,
        error: "Image fetched from HL Gaming but could not be saved to Backblaze",
        details: b2WriteError?.message || "B2 upload failed",
      }),
      {
        status: 502,
        headers: corsHeaders({
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        }),
      }
    );
  }

  // =========================================================
  // 5) RETURN IMAGE
  // =========================================================
  return new Response(body, {
    status: 200,
    headers: corsHeaders({
      "Content-Type":
        imageResponse.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-4FU-Asset": asset,
      "X-4FU-Provider": "HL-Gaming->Backblaze-B2",
      "X-4FU-Cache": "MISS-SAVED",
    }),
  });
}

function collectNumericIds(value) {
  const ids = [];

  const walk = (item) => {
    if (item === undefined || item === null || item === "") return;

    if (typeof item === "number" && Number.isFinite(item)) {
      ids.push(String(item));
      return;
    }

    if (typeof item === "string") {
      if (/^https?:\/\//i.test(item)) return;
      if (/^\d+$/.test(item.trim())) ids.push(item.trim());
      return;
    }

    if (Array.isArray(item)) {
      item.forEach(walk);
      return;
    }

    if (item && typeof item === "object") {
      // Common Free Fire outfit/clothes object shapes.
      const id =
        item.id ??
        item.ID ??
        item.itemId ??
        item.itemID ??
        item.clothesId ??
        item.clothesID;

      if (id !== undefined && id !== null && id !== "") {
        walk(id);
      } else {
        Object.values(item).forEach(walk);
      }
    }
  };

  walk(value);
  return [...new Set(ids)];
}

async function hlgamingAssetsFromProfile(profileData, env) {
  const basicInfo =
    profileData?.basicInfo ||
    profileData?.basic_info ||
    {};

  const profileInfo =
    profileData?.profileInfo ||
    profileData?.profile_info ||
    {};

  const bannerId =
    basicInfo.bannerId ??
    basicInfo.bannerID ??
    profileData?.bannerId ??
    profileData?.bannerID;

  // Existing Free Fire profile response normally exposes equipped clothes
  // inside profileInfo.clothes. Keep several compatible shapes as fallback.
  const clothes =
    profileInfo.clothes ??
    profileInfo.Clothes ??
    profileInfo.equippedClothes ??
    profileInfo.equippedOutfit ??
    profileData?.clothes ??
    profileData?.equippedClothes ??
    [];

  const outfitIds = collectNumericIds(clothes);

  const [banner, ...outfitUrls] = await Promise.all([
    hlgamingImageUrl(bannerId, env),
    ...outfitIds.map((id) => hlgamingImageUrl(id, env)),
  ]);

  return {
    banner: banner || null,
    outfit: outfitUrls.find(Boolean) || null,
    outfits: outfitUrls.filter(Boolean),
    bannerId: bannerId ?? null,
    outfitIds,
  };
}

async function hlgamingAsset(
  asset,
  uid,
  region,
  env,
  profileData = null,
  outfitIndex = 0
) {
  let assets = null;

  if (profileData) {
    assets = await hlgamingAssetsFromProfile(profileData, env);
  } else {
    // Asset-only requests use the existing providers first, then tertiary fallback.
    const profileResult = await profileDataWithFallback(uid, region, env);
    assets = await hlgamingAssetsFromProfile(profileResult.data, env);
  }

  const safeIndex = Number.isInteger(outfitIndex) && outfitIndex >= 0
    ? outfitIndex
    : 0;

  const imageUrl =
    asset === "banner"
      ? assets.banner
      : (assets.outfits?.[safeIndex] || assets.outfit);

  if (!imageUrl) {
    throw new Error(`HL Gaming did not return a ${asset} image URL`);
  }

  const imageResponse = await fetch(imageUrl, {
    headers: { Accept: "image/*" },
  });

  const body = await imageResponse.arrayBuffer();

  if (!imageResponse.ok) {
    return new Response(body, {
      status: imageResponse.status,
      headers: corsHeaders({
        "Content-Type":
          imageResponse.headers.get("content-type") ||
          "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      }),
    });
  }

  return new Response(body, {
    status: 200,
    headers: corsHeaders({
      "Content-Type":
        imageResponse.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=300",
      "X-4FU-Asset": asset,
      "X-4FU-Provider": "HL-Gaming-img_code",
    }),
  });
}

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
    try { return { data: await upstreamJSON("bhau", uid, region, key), provider: "primary" }; }
    catch (error) { primaryError = error?.message || String(error); }
  }

  const secondary = await secondaryJSON("player-profile", { uid, server: region });
  if (secondary.success) return { data: secondary.data, provider: "secondary" };

  try {
    return { data: await hlgamingProfile(uid, region, env), provider: "hl-gaming" };
  } catch (hlError) {
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

  return {
    basicInfo: basic,
    clanBasicInfo: clan,
    captainBasicInfo: captain,
    petInfo: pet,
    socialInfo: social,
    creditScoreInfo: credit,

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
   WORKER
   ========================================================= */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
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

        return json({
          success: true,
          b2: true,
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

    if (!key) {
      return json(
        {
          success: false,
          error:
            "FREE_FIRE_API_KEY is not configured",
        },
        500
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

      const { userUid: hlUserUid, apiKey: hlApiKey } =
        getHLGamingCredentials(env);

      if (directImgCode && hlUserUid && hlApiKey) {
        try {
          // IMPORTANT: direct img_code requests MUST use the permanent
          // B2-first flow only. If B2/HL fails, return the error directly.
          // Do NOT fall through to hlgamingAsset(), because that can issue
          // additional HL image requests and burn API quota.
          return await getPermanentHLAsset(asset, directImgCode, env);
        } catch (hlDirectError) {
          console.error(
            "Permanent HL/B2 asset lookup failed:",
            hlDirectError?.message || hlDirectError
          );

          return json(
            {
              success: false,
              error: "Permanent asset lookup failed",
              details: hlDirectError?.message || String(hlDirectError),
              asset,
              img_code: String(directImgCode),
            },
            502
          );
        }
      }

      // Prefer HL Gaming when its credentials are configured.
      // If HL Gaming is unavailable/misconfigured, keep the existing
      // SiamBhau asset route as a fallback so current 4FU functionality
      // does not break.
      const { userUid, apiKey } = getHLGamingCredentials(env);

      if (userUid && apiKey) {
        try {
          const outfitIndex = Math.max(
            0,
            Number.parseInt(url.searchParams.get("outfitIndex") || "0", 10) || 0
          );

          return await hlgamingAsset(
            asset,
            uid,
            region,
            env,
            null,
            outfitIndex
          );
        } catch (hlError) {
          console.warn(
            `HL Gaming ${asset} failed; using existing asset provider:`,
            hlError?.message || hlError
          );
        }
      }

      return await upstreamAsset(
        asset === "banner"
          ? "banner/profile"
          : "outfits/outfit",
        uid,
        region,
        key
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
            throw new Error(
              `Profile providers unavailable: primary=${primaryProfileError?.message || "failed"}; secondary=${fallback.error || "failed"}; hl-gaming=${hlError?.message || "failed"}`
            );
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
          throw new Error(
            `Stats providers unavailable: primary=${primaryStatsError?.message || "failed"}; secondary=${fallback.error || "failed"}; hl-gaming account fallback does not provide detailed mode stats`
          );
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
      // The actual HL image request happens only on the first image load, and
      // that image is then persisted in Backblaze B2.
      const basicInfoForAssets =
        profileData?.basicInfo || profileData?.basic_info || {};
      const profileInfoForAssets =
        profileData?.profileInfo || profileData?.profile_info || {};

      const bannerIdForAssets =
        basicInfoForAssets.bannerId ??
        basicInfoForAssets.bannerID ??
        profileData?.bannerId ??
        profileData?.bannerID ??
        null;

      const clothesForAssets =
        profileInfoForAssets.clothes ??
        profileInfoForAssets.Clothes ??
        profileInfoForAssets.equippedClothes ??
        profileInfoForAssets.equippedOutfit ??
        profileData?.clothes ??
        profileData?.equippedClothes ??
        [];

      const outfitIdsForAssets = collectNumericIds(clothesForAssets);

      // IMPORTANT:
      // Never expose the third-party HL Gaming image URLs directly to the browser.
      // The browser should load the images through this Worker so hotlink/CORS/
      // referrer restrictions on the provider cannot break the profile UI.
      const fallbackBanner =
        `${origin}${path}?uid=${encodedUID}&region=${encodedRegion}&asset=banner`;

      const fallbackOutfit =
        `${origin}${path}?uid=${encodedUID}&region=${encodedRegion}&asset=outfit`;

      const proxyBanner = bannerIdForAssets
        ? `${origin}${path}?uid=${encodedUID}&region=${encodedRegion}&asset=banner&img_code=${encodeURIComponent(String(bannerIdForAssets))}`
        : fallbackBanner;

      const proxyOutfits = outfitIdsForAssets.map((imgCode) =>
        `${origin}${path}?uid=${encodedUID}&region=${encodedRegion}&asset=outfit&img_code=${encodeURIComponent(String(imgCode))}`
      );

      const assets = {
        banner: proxyBanner,
        outfit: proxyOutfits[0] || fallbackOutfit,
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

      return json({

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

      });

    } catch (error) {

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