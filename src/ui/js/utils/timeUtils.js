export function isoFormat(time) {
  if (!time) return "Unknown";
  const date = new Date(time);
  if (isNaN(date.getTime())) return "Unknown";
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} - ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
}

export function addPadding(time) {
  const [min, sec] = time.split(":");
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function fmtMSS(seconds) {
  return (seconds - (seconds %= 60)) / 60 + (9 < seconds ? ":" : ":0") + seconds;
}