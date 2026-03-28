export function isoFormat(time) {
  if (!time) return "Unknown";
  const date = new Date(time);
  if (isNaN(date.getTime())) return "Unknown";
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} - ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
}

// Formats an integer number of seconds as a zero-padded "MM:SS" string.
// Replaces the previous addPadding(fmtMSS(s)) two-step pattern with a single pass.
export function fmtTime(seconds) {
  const s = seconds % 60;
  const m = Math.floor(seconds / 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}