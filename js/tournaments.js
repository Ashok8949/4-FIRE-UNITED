/* =========================================================
   4FU TOURNAMENT CENTER — YOUTUBE LIVE BROADCAST MODE
   Existing Firestore fields remain:
   title, game, mode, date, time, prize, status,
   registration, liveLink
   ========================================================= */

const FOURFU_YOUTUBE_WORKER =
  "https://4fu-freefire-backend.4fu-freefire-backend.workers.dev/";

// Quota-safe refresh: viewer/status data may be up to ~60s old.
const FOURFU_YOUTUBE_REFRESH_MS = 60000;

let fourfuTournamentRecords = [];
let fourfuLastSignature = "";

function fourfuEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fourfuVideoId(value) {
  if (!value) return null;

  const raw = String(value).trim();

  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const u = new URL(raw);

    const queryId = u.searchParams.get("v");
    if (/^[A-Za-z0-9_-]{11}$/.test(queryId || "")) {
      return queryId;
    }

    if (
      u.hostname === "youtu.be" ||
      u.hostname === "www.youtu.be"
    ) {
      const id =
        u.pathname.split("/").filter(Boolean)[0];

      return /^[A-Za-z0-9_-]{11}$/.test(id || "")
        ? id
        : null;
    }

    const parts =
      u.pathname.split("/").filter(Boolean);

    const index = parts.findIndex((part) =>
      ["live", "embed", "shorts", "v"].includes(
        part.toLowerCase()
      )
    );

    if (index >= 0) {
      const id = parts[index + 1];

      if (/^[A-Za-z0-9_-]{11}$/.test(id || "")) {
        return id;
      }
    }
  } catch {
    // Ignore malformed URLs.
  }

  const match = raw.match(
    /(?:v=|youtu\.be\/|youtube\.com\/(?:live\/|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/
  );

  return match?.[1] || null;
}

function fourfuNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return Number(value).toLocaleString();
}

function fourfuDate(value) {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fourfuDuration(start) {
  if (!start) return "00:00:00";

  const time =
    new Date(start).getTime();

  if (!Number.isFinite(time)) {
    return "00:00:00";
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - time) / 1000
    )
  );

  const h =
    Math.floor(seconds / 3600);

  const m =
    Math.floor((seconds % 3600) / 60);

  const s =
    seconds % 60;

  return [
    String(h).padStart(2, "0"),
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].join(":");
}

function fourfuCountdown(target) {
  if (!target) return "—";

  const end =
    new Date(target).getTime();

  if (!Number.isFinite(end)) return "—";

  const seconds = Math.max(
    0,
    Math.floor(
      (end - Date.now()) / 1000
    )
  );

  const d =
    Math.floor(seconds / 86400);

  const h =
    Math.floor(
      (seconds % 86400) / 3600
    );

  const m =
    Math.floor(
      (seconds % 3600) / 60
    );

  const s =
    seconds % 60;

  if (d > 0) {
    return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  }

  return [
    String(h).padStart(2, "0"),
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].join(":");
}

async function fourfuYouTube(liveLink) {
  const videoId =
    fourfuVideoId(liveLink);

  if (!videoId) {
    return {
      success: false,
      error: "Invalid YouTube live link",
    };
  }

  const endpoint =
    new URL(FOURFU_YOUTUBE_WORKER);

  endpoint.searchParams.set(
    "youtubeLive",
    "1"
  );

  endpoint.searchParams.set(
    "videoId",
    videoId
  );

  const response =
    await fetch(
      endpoint.toString(),
      {
        cache: "no-store",
      }
    );

  const data =
    await response.json()
      .catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(
      data?.error ||
      `YouTube lookup failed (${response.status})`
    );
  }

  return data;
}

async function fourfuLoadData() {
  const snapshot =
    await db
      .collection("tournaments")
      .get();

  const records = [];

  for (const doc of snapshot.docs) {
    const tournament =
      doc.data() || {};

    let youtube = null;

    if (
      tournament.liveLink &&
      fourfuVideoId(tournament.liveLink)
    ) {
      try {
        youtube =
          await fourfuYouTube(
            tournament.liveLink
          );
      } catch (error) {
        console.warn(
          "4FU YouTube lookup:",
          doc.id,
          error
        );
      }
    }

    records.push({
      id: doc.id,
      tournament,
      youtube,
    });
  }

  return records;
}

function fourfuEffectiveStatus(record) {
  if (record?.youtube?.success) {
    return record.youtube.status;
  }

  const raw =
    String(
      record?.tournament?.status ||
      ""
    ).toUpperCase();

  if (
    raw.includes("LIVE") ||
    raw.includes("ONGOING") ||
    raw.includes("RUNNING")
  ) {
    return "LIVE";
  }

  if (
    raw.includes("END") ||
    raw.includes("COMPLETE") ||
    raw.includes("COMPLETED")
  ) {
    return "ENDED";
  }

  return "UPCOMING";
}

function fourfuSort(records) {
  return [...records].sort((a, b) => {
    const order = {
      LIVE: 0,
      UPCOMING: 1,
      ENDED: 2,
    };

    return (
      (order[fourfuEffectiveStatus(a)] ?? 9) -
      (order[fourfuEffectiveStatus(b)] ?? 9)
    );
  });
}

function fourfuLiveHero(record) {
  const t = record.tournament;
  const y = record.youtube;

  const title =
    y?.title ||
    t.title ||
    "4FU Tournament";

  const tournamentName =
    t.title ||
    "LIVE TOURNAMENT";

  const videoId =
    y?.videoId ||
    fourfuVideoId(t.liveLink);

  const embed =
    videoId
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`
      : "";

  return `
    <section class="fourfu-broadcast-hero">

      <div class="fourfu-broadcast-top">

        <div class="fourfu-live-label">
          <span class="fourfu-live-dot"></span>
          LIVE NOW
        </div>

        <div class="fourfu-broadcast-viewers">
          <i class="fa-solid fa-eye"></i>
          <strong
            data-live-viewers
          >
            ${fourfuNumber(y?.concurrentViewers)}
          </strong>
          WATCHING
        </div>

      </div>

      <div class="fourfu-broadcast-heading">

        <div>
          <span class="fourfu-kicker">
            4 FIRE UNITED • ${fourfuEscape(tournamentName)}
          </span>

          <h2>
            ${fourfuEscape(title)}
          </h2>

          ${
            y?.channelTitle
              ? `
                <p>
                  <i class="fa-brands fa-youtube"></i>
                  ${fourfuEscape(y.channelTitle)}
                </p>
              `
              : ""
          }
        </div>

        <div class="fourfu-broadcast-live-badge">
          <span></span>
          LIVE
        </div>

      </div>

      <div class="fourfu-broadcast-grid">

        <div class="fourfu-player-wrap">

          ${
            embed
              ? `
                <iframe
                  class="fourfu-youtube-player"
                  src="${embed}"
                  title="${fourfuEscape(title)}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                  referrerpolicy="strict-origin-when-cross-origin"
                ></iframe>
              `
              : `
                <div class="fourfu-no-player">
                  <i class="fa-brands fa-youtube"></i>
                  <span>YouTube stream unavailable</span>
                </div>
              `
          }

          <div class="fourfu-player-footer">

            <div>
              <span>LIVE FOR</span>
              <strong data-live-duration>
                ${fourfuDuration(y?.actualStartTime)}
              </strong>
            </div>

            <div>
              <span>STARTED</span>
              <strong>
                ${fourfuEscape(
                  fourfuDate(y?.actualStartTime)
                )}
              </strong>
            </div>

            <div>
              <span>PLATFORM</span>
              <strong>
                <i class="fa-brands fa-youtube"></i>
                YouTube Live
              </strong>
            </div>

          </div>

        </div>

        <aside class="fourfu-broadcast-side">

          <div class="fourfu-side-block">

            <span class="fourfu-side-title">
              TOURNAMENT INFO
            </span>

            <div class="fourfu-info-row">
              <span>GAME</span>
              <strong>
                ${fourfuEscape(
                  t.game || "Free Fire"
                )}
              </strong>
            </div>

            <div class="fourfu-info-row">
              <span>MODE</span>
              <strong>
                ${fourfuEscape(
                  t.mode || "—"
                )}
              </strong>
            </div>

            <div class="fourfu-info-row">
              <span>DATE</span>
              <strong>
                ${fourfuEscape(
                  t.date || "—"
                )}
              </strong>
            </div>

            <div class="fourfu-info-row">
              <span>TIME</span>
              <strong>
                ${fourfuEscape(
                  t.time || "—"
                )}
              </strong>
            </div>

            <div class="fourfu-info-row">
              <span>PRIZE</span>
              <strong class="fourfu-prize">
                ${fourfuEscape(
                  t.prize || "—"
                )}
              </strong>
            </div>

          </div>

          <div class="fourfu-side-block fourfu-live-state-block">

            <span class="fourfu-side-title">
              BROADCAST STATUS
            </span>

            <div class="fourfu-state-live">
              <span class="fourfu-live-dot"></span>
              STREAM IS LIVE
            </div>

            <p>
              Live data is being read directly
              from YouTube.
            </p>

          </div>

          <div class="fourfu-hero-actions">

            ${
              t.registration
                ? `
                  <a
                    href="${fourfuEscape(t.registration)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="fourfu-primary-action"
                  >
                    <i class="fa-solid fa-pen-to-square"></i>
                    REGISTER
                  </a>
                `
                : ""
            }

            ${
              t.liveLink
                ? `
                  <a
                    href="${fourfuEscape(t.liveLink)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="fourfu-secondary-action"
                  >
                    <i class="fa-brands fa-youtube"></i>
                    OPEN YOUTUBE
                  </a>
                `
                : ""
            }

          </div>

        </aside>

      </div>

    </section>
  `;
}

function fourfuNextHero(record) {
  const t = record.tournament;
  const y = record.youtube;

  const title =
    t.title ||
    y?.title ||
    "4FU Tournament";

  return `
    <section class="fourfu-next-hero">

      <div class="fourfu-next-copy">

        <span class="fourfu-kicker">
          NEXT 4FU EVENT
        </span>

        <div class="fourfu-upcoming-label">
          <i class="fa-regular fa-clock"></i>
          UPCOMING
        </div>

        <h2>
          ${fourfuEscape(title)}
        </h2>

        <p>
          ${fourfuEscape(
            y?.title ||
            "The next tournament broadcast will appear here."
          )}
        </p>

        <div class="fourfu-countdown-large">
          <span>STARTS IN</span>
          <strong data-upcoming-countdown>
            ${fourfuCountdown(
              y?.scheduledStartTime
            )}
          </strong>
        </div>

        <div class="fourfu-next-meta">

          <span>
            <i class="fa-solid fa-gamepad"></i>
            ${fourfuEscape(
              t.game || "Free Fire"
            )}
          </span>

          <span>
            <i class="fa-solid fa-layer-group"></i>
            ${fourfuEscape(
              t.mode || "—"
            )}
          </span>

          <span>
            <i class="fa-solid fa-trophy"></i>
            ${fourfuEscape(
              t.prize || "—"
            )}
          </span>

          <span>
            <i class="fa-regular fa-calendar"></i>
            ${fourfuEscape(
              t.date || "—"
            )}
          </span>

        </div>

        <div class="fourfu-hero-actions">

          ${
            t.registration
              ? `
                <a
                  href="${fourfuEscape(t.registration)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="fourfu-primary-action"
                >
                  <i class="fa-solid fa-pen-to-square"></i>
                  REGISTER
                </a>
              `
              : ""
          }

          ${
            t.liveLink
              ? `
                <a
                  href="${fourfuEscape(t.liveLink)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="fourfu-secondary-action"
                >
                  <i class="fa-brands fa-youtube"></i>
                  OPEN STREAM
                </a>
              `
              : ""
          }

        </div>

      </div>

      <div class="fourfu-next-visual">

        ${
          y?.thumbnail
            ? `
              <img
                src="${fourfuEscape(y.thumbnail)}"
                alt="${fourfuEscape(title)}"
              >
            `
            : `
              <div class="fourfu-next-placeholder">
                <i class="fa-solid fa-trophy"></i>
              </div>
            `
        }

        <div class="fourfu-next-overlay"></div>

        <div class="fourfu-next-date">
          <span>SCHEDULED</span>
          <strong>
            ${fourfuEscape(
              fourfuDate(
                y?.scheduledStartTime
              )
            )}
          </strong>
        </div>

      </div>

    </section>
  `;
}

function fourfuEventRow(record) {
  const t = record.tournament;
  const y = record.youtube;
  const status =
    fourfuEffectiveStatus(record);

  const title =
    t.title ||
    y?.title ||
    "4FU Tournament";

  const thumb =
    y?.thumbnail ||
    "";

  const watch =
    y?.watchUrl ||
    t.liveLink ||
    "#";

  return `
    <article
      class="fourfu-event-row"
      data-event-id="${fourfuEscape(record.id)}"
    >

      <div class="fourfu-event-thumb">

        ${
          thumb
            ? `
              <img
                src="${fourfuEscape(thumb)}"
                alt=""
                loading="lazy"
              >
            `
            : `<i class="fa-solid fa-trophy"></i>`
        }

        <span class="fourfu-row-status ${status.toLowerCase()}">
          ${
            status === "LIVE"
              ? "LIVE"
              : status === "UPCOMING"
                ? "UPCOMING"
                : "ENDED"
          }
        </span>

      </div>

      <div class="fourfu-event-main">

        <span>
          ${fourfuEscape(
            t.game || "Free Fire"
          )}
          •
          ${fourfuEscape(
            t.mode || "—"
          )}
        </span>

        <h3>
          ${fourfuEscape(title)}
        </h3>

        <p>
          ${
            status === "LIVE"
              ? `Started ${fourfuEscape(
                  fourfuDate(
                    y?.actualStartTime
                  )
                )}`
              : status === "UPCOMING"
                ? `Starts ${fourfuEscape(
                    fourfuDate(
                      y?.scheduledStartTime
                    )
                  )}`
                : `Ended ${fourfuEscape(
                    fourfuDate(
                      y?.actualEndTime
                    )
                  )}`
          }
        </p>

      </div>

      <div class="fourfu-event-right">

        ${
          status === "LIVE"
            ? `
              <strong>
                <i class="fa-solid fa-eye"></i>
                ${fourfuNumber(
                  y?.concurrentViewers
                )}
              </strong>
              <small>WATCHING</small>
            `
            : status === "UPCOMING"
              ? `
                <strong data-row-countdown="${fourfuEscape(
                  y?.scheduledStartTime || ""
                )}">
                  ${fourfuCountdown(
                    y?.scheduledStartTime
                  )}
                </strong>
                <small>TO START</small>
              `
              : `
                <strong>
                  <i class="fa-brands fa-youtube"></i>
                </strong>
                <small>REPLAY</small>
              `
        }

        ${
          watch !== "#"
            ? `
              <a
                href="${fourfuEscape(watch)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${
                  status === "LIVE"
                    ? "WATCH"
                    : "OPEN"
                }
              </a>
            `
            : ""
        }

      </div>

    </article>
  `;
}

function fourfuRender(records) {
  const grid =
    document.getElementById(
      "tournament-grid"
    );

  if (!grid) return;

  const sorted =
    fourfuSort(records);

  const live =
    sorted.find(
      (record) =>
        fourfuEffectiveStatus(record) ===
        "LIVE"
    );

  const upcoming =
    sorted.filter(
      (record) =>
        fourfuEffectiveStatus(record) ===
        "UPCOMING"
    );

  const ended =
    sorted.filter(
      (record) =>
        fourfuEffectiveStatus(record) ===
        "ENDED"
    );

  const main =
    live ||
    upcoming[0] ||
    null;

  let html = "";

  if (main) {
    html +=
      live
        ? fourfuLiveHero(live)
        : fourfuNextHero(main);
  }

  const remainingUpcoming =
    live
      ? upcoming
      : upcoming.slice(1);

  if (
    remainingUpcoming.length
  ) {
    html += `
      <section class="fourfu-section">

        <div class="fourfu-section-heading">
          <div>
            <span>UP NEXT</span>
            <h2>Upcoming Tournaments</h2>
          </div>
          <i class="fa-solid fa-calendar-days"></i>
        </div>

        <div class="fourfu-event-list">
          ${remainingUpcoming
            .map(fourfuEventRow)
            .join("")}
        </div>

      </section>
    `;
  }

  if (ended.length) {
    html += `
      <section class="fourfu-section fourfu-results-section">

        <div class="fourfu-section-heading">
          <div>
            <span>ARCHIVE</span>
            <h2>Recent Results</h2>
          </div>
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>

        <div class="fourfu-event-list">
          ${ended
            .slice(0, 8)
            .map(fourfuEventRow)
            .join("")}
        </div>

      </section>
    `;
  }

  if (!html) {
    html = `
      <section class="fourfu-empty-state">
        <i class="fa-solid fa-trophy"></i>
        <h2>No tournaments yet</h2>
        <p>4FU's next event will appear here.</p>
      </section>
    `;
  }

  grid.innerHTML = html;

  fourfuUpdateClocks();
}

function fourfuSignature(records) {
  return records
    .map((r) => {
      const y = r.youtube || {};
      return [
        r.id,
        fourfuEffectiveStatus(r),
        y.videoId || "",
        y.concurrentViewers ?? "",
        y.actualStartTime || "",
        y.actualEndTime || "",
        y.scheduledStartTime || "",
      ].join("|");
    })
    .sort()
    .join("||");
}

function fourfuUpdateClocks() {
  document
    .querySelectorAll(
      "[data-live-duration]"
    )
    .forEach((el) => {
      const live =
        fourfuTournamentRecords.find(
          (r) =>
            fourfuEffectiveStatus(r) ===
            "LIVE"
        );

      if (live?.youtube?.actualStartTime) {
        el.textContent =
          fourfuDuration(
            live.youtube.actualStartTime
          );
      }
    });

  document
    .querySelectorAll(
      "[data-upcoming-countdown]"
    )
    .forEach((el) => {
      const upcoming =
        fourfuTournamentRecords
          .filter(
            (r) =>
              fourfuEffectiveStatus(r) ===
              "UPCOMING"
          )
          .sort((a, b) =>
            new Date(
              a.youtube?.scheduledStartTime ||
              "9999-12-31"
            ) -
            new Date(
              b.youtube?.scheduledStartTime ||
              "9999-12-31"
            )
          )[0];

      if (upcoming) {
        el.textContent =
          fourfuCountdown(
            upcoming.youtube?.scheduledStartTime
          );
      }
    });

  document
    .querySelectorAll(
      "[data-row-countdown]"
    )
    .forEach((el) => {
      el.textContent =
        fourfuCountdown(
          el.dataset.rowCountdown
        );
    });
}

async function fourfuRefresh() {
  try {
    const fresh =
      await fourfuLoadData();

    const signature =
      fourfuSignature(fresh);

    /*
     * Re-render only when actual tournament/YouTube
     * state changes. This avoids reloading the YouTube
     * iframe every 30 seconds just because the viewer
     * count changed.
     */
    const oldLive =
      fourfuTournamentRecords.find(
        (r) =>
          fourfuEffectiveStatus(r) ===
          "LIVE"
      );

    const newLive =
      fresh.find(
        (r) =>
          fourfuEffectiveStatus(r) ===
          "LIVE"
      );

    const structuralChanged =
      fourfuLastSignature !==
      signature ||
      fourfuEffectiveStatus(oldLive) !==
        fourfuEffectiveStatus(newLive);

    fourfuTournamentRecords =
      fresh;

    if (structuralChanged) {
      fourfuRender(fresh);
      fourfuLastSignature =
        signature;
    } else {
      // Update viewer count without destroying iframe.
      if (newLive?.youtube) {
        const viewer =
          document.querySelector(
            "[data-live-viewers]"
          );

        if (viewer) {
          viewer.textContent =
            fourfuNumber(
              newLive.youtube.concurrentViewers
            );
        }
      }

      fourfuUpdateClocks();
    }
  } catch (error) {
    console.error(
      "4FU tournament live refresh failed:",
      error
    );
  }
}

async function fourfuLoad() {
  const grid =
    document.getElementById(
      "tournament-grid"
    );

  if (!grid) return;

  grid.innerHTML = `
    <section class="fourfu-loading-state">
      <div class="fourfu-loading-ring"></div>
      <span>CONNECTING TO 4FU LIVE CENTER</span>
      <strong>Loading tournament broadcast data...</strong>
    </section>
  `;

  await fourfuRefresh();

  clearInterval(
    window.__4FU_TOURNAMENT_REFRESH
  );

  clearInterval(
    window.__4FU_TOURNAMENT_CLOCK
  );

  window.__4FU_TOURNAMENT_REFRESH =
    setInterval(
      fourfuRefresh,
      FOURFU_YOUTUBE_REFRESH_MS
    );

  window.__4FU_TOURNAMENT_CLOCK =
    setInterval(
      fourfuUpdateClocks,
      1000
    );
}

if (
  typeof db !== "undefined"
) {
  fourfuLoad();
}
