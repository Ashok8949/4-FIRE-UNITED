/* 4FU configurable opening loader. Timing remains bounded and respects the
   published minimum display duration; the original cinematic sequence is retained. */
document.addEventListener("DOMContentLoaded", () => {
    const node = document.getElementById("loader");
    if (!node) return;
    const requested = Number.parseInt(node.dataset.minDuration || "4600", 10);
    const duration = Math.max(1800, Math.min(8000, Number.isFinite(requested) ? requested : 4600));
    const at = (ratio) => Math.round(duration * ratio);
    const exitAt = Math.max(at(.72), duration - 600);
    node.style.display = "flex";
    document.body.style.overflow = "hidden";
    window.setTimeout(() => node.classList.add("loader-start"), at(.033));
    window.setTimeout(() => node.classList.add("loader-impact"), at(.315));
    window.setTimeout(() => {
        node.querySelectorAll(".bullet").forEach((bullet) => {
            bullet.style.transition = ".18s";
            bullet.style.opacity = "0";
            bullet.style.transform += " scale(.65)";
        });
    }, at(.196));
    window.setTimeout(() => node.classList.add("loader-show"), at(.37));
    window.setTimeout(() => {
        node.classList.add("loader-hide");
        document.body.style.overflow = "";
    }, exitAt);
    window.setTimeout(() => node.remove(), duration);
});