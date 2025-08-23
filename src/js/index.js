import { ChiptuneJsPlayer as chiptune3 } from "../lib/chiptune/chiptune3.js";
import pkg from "../../package.json" with { type: "json" };
import { dnd } from "../lib/chiptune/dnd.js";
import { $, $$ } from "./utils/index.js";

let modMeta;
let modSource;
let loopState = 0;

function showDialog(type, title, message) {
  return window.api.alert({
    type,
    buttons: ["Close"],
    title,
    message,
  });
}

function isoFormat(time) {
  if (!time) return "Unknown";
  const date = new Date(time);
  if (isNaN(date.getTime())) return "Unknown";
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} - ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
}

function addPadding(time) {
  const [min, sec] = time.split(":");
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function fmtMSS(seconds) {
  return (seconds - (seconds %= 60)) / 60 + (9 < seconds ? ":" : ":0") + seconds;
}

const round = (n) => Math.round(n);

function alertError(error) {
  showDialog("error", "Error", error);
  hideElements();
}

function hideElements() {
  $("modDetails").classList.remove("show");
  $("moduleMsgBtn").classList.remove("show");
}

function showElements() {
  $("modDetails").classList.add("show");
  $("moduleMsgBtn").classList.add("show");
}

document.addEventListener("DOMContentLoaded", () => {
  document.title = pkg.packageName;
  $("fileInput").setAttribute("accept", ".mptm, .mod, .s3m, .xm, .it, .667, .669, .amf, .ams, .c67, .cba, .dbm, .digi, .dmf, .dsm, .dsym, .dtm, .etx, .far, .fc, .fc13, .fc14, .fmt, .fst, .ftm, .imf, .ims, .ice, .j2b, .m15, .mdl, .med, .mms, .mt2, .mtm, .mus, .nst, .okt, .plm, .psm, .pt36, .ptm, .puma, .rtm, .sfx, .sfx2, .smod, .st26, .stk, .stm, .stx, .stp, .symmod, .tcb, .gmc, .gtk, .gt2, .ult, .unic, .wow, .xmf, .gdm, .mo3, .oxm, .umx, .xpk, .ppm, .mmcmp");
  hideElements();
  const toggle = $("loopToggle");
  toggle.classList.remove(loopState === 0 ? "codicon-sync" : "codicon-sync-ignored");
  toggle.classList.add(loopState === 0 ? "codicon-sync-ignored" : "codicon-sync");
  $$("app-name").forEach(e => {
    e.textContent = pkg.packageName;
  })
});

window.chiplib = new chiptune3();

chiplib.onInitialized(() => {
  chiplib.setRepeatCount(loopState);
  dnd(window, (file) => {
    chiplib.play(file);
    modSource = "Drag & Drop";
  });
});

chiplib.onError((err) => {
  switch (err.type) {
    case "ptr":
      alertError("Unknown error, but it's probably a bad URL or ID.");
      break;
    case "Load":
      alertError("Failed to load the module.");
      break;
    default:
      alertError(err.type);
      break;
  }
  chiplib.stop();
});

chiplib.onEnded(hideElements);

chiplib.onProgress((pos) => {
  const actualPos = round(pos.pos);
  const now = Date.now();
  if (!chiplib._lastUpdate || now - chiplib._lastUpdate > 1000) {
    $("modDurAct").textContent = addPadding(fmtMSS(actualPos));
    chiplib._lastUpdate = now;
  }
  showElements();
});

chiplib.onMetadata((meta) => {
  const modTypeShortStr = meta.type.toUpperCase();
  const modDurStr = fmtMSS(round(meta.dur));
  const modTypeStr = meta.type_long;
  $("modTracker").textContent = meta.tracker || "Unknown";
  $("modTitle").textContent = meta.title || "Untitled";
  $("modType").textContent = `${modTypeStr} (${modTypeShortStr})`;
  $("modArtist").textContent = meta.artist || "Unknown";
  $("modDate").textContent = isoFormat(meta.date) || "Unknown";
  $("modInstruments").textContent = meta.song.instruments.length;
  $("modSamples").textContent = meta.song.samples.length;
  $("modChannels").textContent = meta.song.channels.length;
  $("modPatterns").textContent = meta.song.patterns.length;
  $("modSource").textContent = modSource;
  $("modDurTot").textContent = addPadding(modDurStr);

  modMeta = meta.message.split("\n").map((line, i) => `${(i + 1).toString().padStart(2, "0")}: ${line}`).join("\n");
});

async function loadModule(url) {
  const tma = "https://api.modarchive.org/downloads.php?moduleid=";
  const id = url.match(/moduleid=(\d+)/i) || url.match(/(\d+)$/);

  if (url.includes("modarchive.org") && id) {
    await chiplib.load(tma + id[1]);
    modSource = "The Mod Archive";
    return;
  }
  try {
    new URL(url);
    await chiplib.load(url);
    modSource = "External URL";
  } catch {
    await chiplib.load(tma + url);
    modSource = "The Mod Archive";
  }
}

$("inputPlayBtn").addEventListener("click", () => {
  const val = $("url").value;
  if (val === "") {
    alertError("Please enter a URL!");
  } else {
    loadModule(val);
  }
});

document.body.onkeyup = function (btn) {
  if (btn.key === " " || btn.code === "Space") {
    chiplib.togglePause();
  }
};

$("playBtn").addEventListener("click", () => {
  chiplib.togglePause();
  const playBtn = $("playBtn");
  playBtn.classList.toggle("codicon-play");
  playBtn.classList.toggle("codicon-debug-pause");
});

$("loopToggle").addEventListener("click", () => {
  loopState = loopState === 0 ? -1 : 0;
  chiplib.setRepeatCount(loopState);
  const toggle = $("loopToggle");
  toggle.classList.toggle("codicon-sync");
  toggle.classList.toggle("codicon-sync-ignored");
});

$("aboutAppBtn").addEventListener("click", () => {
  const message = `${pkg.packageName} is © ${new Date().getFullYear()} ${pkg.author.name}. All rights reserved.\n\nSource code:\n${pkg.repository.url}\n\nUsing chiptune3 by DrSnuggles\nhttps://drsnuggles.github.io/chiptune\n\nAlso using Microsoft's VS Code codicons\nhttps://github.com/microsoft/vscode-codicons`;
  showDialog("info", `About ${pkg.packageName}`, message);
});

$("moduleMsgBtn").addEventListener("click", () => {
  showDialog("none", "Module text/instruments", modMeta);
});

$("stopBtn").addEventListener("click", () => {
  hideElements();
  chiplib.stop();
});

$("url").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    $("inputPlayBtn").click();
  }
});

$("openFileBtn").addEventListener("click", () => {
  $("fileInput").click();
});

$("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $("url").value = file.name;
  const reader = new FileReader();
  reader.onload = () => {
    chiplib.play(reader.result);
    modSource = "Local file";
  };
  reader.readAsArrayBuffer(file);
});