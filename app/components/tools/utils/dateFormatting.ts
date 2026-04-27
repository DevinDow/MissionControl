// Formats a Unix ms timestamp into a human-readable relative time string,
// paired with a Tailwind color class that visually encodes how recent it is.
//
// Color scale (Activity Thermal Layer):
//   < 30 mins  → red-500    (hot / very recent)
//   < 2 hours  → yellow-500 (warm)
//   < 6 hours  → green-500  (today, older)
//   same day   → white      (today, much older)
//   yesterday  → #8A8A8A   (light gray)
//   < 7 days   → #8A8A8A   (light gray)
//   older      → #666666   (dark gray)
export function formatRelativeTime(timestamp: number): { text: string; color: string } {
  const now = new Date();
  const then = new Date(timestamp);

  // Strip time-of-day so we can compare calendar dates cleanly
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thenDate = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const timeStr = then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();

  const diffMs = now.getTime() - then.getTime();
  const ageMins = diffMs / (1000 * 60);
  const ageHours = ageMins / 60;

  if (thenDate.getTime() === today.getTime()) {
    // Happened today — use the thermal color scale
    let color: string;
    if (ageMins < 30) color = "text-red-500 font-bold";
    else if (ageHours < 2) color = "text-yellow-500 font-bold";
    else if (ageHours < 6) color = "text-green-500/80 font-bold";
    else color = "text-white font-bold";

    const relativeStr =
      ageMins < 1 ? "(just now)" :
        ageMins < 60 ? `(${Math.floor(ageMins)} mins ago)` :
          `(${Math.floor(ageHours)} ${Math.floor(ageHours) === 1 ? 'hour' : 'hours'} ago)`;

    return { text: `${timeStr} ${relativeStr}`, color };

  } else if (thenDate.getTime() === yesterday.getTime()) {
    return { text: `yesterday @ ${timeStr}`, color: "text-[#8A8A8A] font-bold" };

  } else {
    const diffDays = Math.floor((today.getTime() - thenDate.getTime()) / (1000 * 60 * 60 * 24));
    const dateStr = then.toLocaleDateString([], { month: 'short', day: 'numeric' }).toLowerCase();

    if (diffDays < 7) {
      return { text: `${diffDays} days ago @ ${timeStr}`, color: "text-[#8A8A8A] font-bold" };
    } else {
      return { text: `${dateStr} @ ${timeStr}`, color: "text-[#666666] font-bold" };
    }
  }
}

// NEW: Session-specific timestamp formatting
// Rangers 1m/5m/10m thresholds
// RED: <1m | YELLOW: <5m | GREEN: <10m | LIGHT GRAY otherwise
export function formatSessionTime(timestamp: number): { text: string; color: string } {
  const now = Date.now();
  const then = new Date(timestamp);
  const timeStr = then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }).toLowerCase();

  const diffMs = now - timestamp;
  const ageMins = diffMs / (1000 * 60);
  const ageHours = ageMins / 60;

  let color: string;
  if (ageMins < 1) {
    color = "text-red-500 font-bold";
  } else if (ageMins < 5) {
    color = "text-yellow-500 font-bold";
  } else if (ageMins < 10) {
    color = "text-green-500 font-bold";
  } else {
    color = "text-[#8A8A8A] font-bold";
  }

  const durationStr =
    ageMins < 1   ? "(just now)" :
    ageMins < 60  ? `(${Math.floor(ageMins)} mins ago)` :
                    `(${Math.floor(ageHours)} ${Math.floor(ageHours) === 1 ? 'hour' : 'hours'} ago)`;

  return { text: `${timeStr} ${durationStr}`, color };
}
