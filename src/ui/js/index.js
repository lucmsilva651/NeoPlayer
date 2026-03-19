import { ChiptuneJsPlayer as chiptune3 } from "../../lib/chiptune/chiptune3.js";
import { $, $$, hideElem, showElem } from "./utils/handleElem.js";
import { isoFormat, fmtTime } from "./utils/timeUtils.js";
import pkg from "../../../package.json" with { type: "json" };
import showDialog from "./utils/showDialog.js";
import { dnd } from "../../lib/chiptune/dnd.js";

let modMeta;
let modSource;
let loopState = 0;

// Helper: get the <i> icon child of a button
const icon = (id) => $(id).querySelector("i");

// Cached references to DOM elements updated during playback.
// The script is loaded as a module at the end of <body>, so the DOM is fully
// parsed and all elements exist at module evaluation time.
const modSeekbar = $("modSeekbar");
const modDurAct = $("modDurAct");

// Cached references to metadata display elements (populated on each file load)
const metaElems = {
  tracker:     $("modTracker"),
  title:       $("modTitle"),
  type:        $("modType"),
  artist:      $("modArtist"),
  date:        $("modDate"),
  instruments: $("modInstruments"),
  samples:     $("modSamples"),
  channels:    $("modChannels"),
  patterns:    $("modPatterns"),
  source:      $("modSource"),
  durTot:      $("modDurTot"),
};

const loadDialog = $("loadDialog");

// Throttle state for progress updates (local variable instead of library mutation)
let lastProgressUpdate = 0;

function alertError(error) {
  showDialog("error", "Error", error);
  hideElem();
}

document.addEventListener("DOMContentLoaded", () => {
  document.title = pkg.packageName;
  $("fileInput").setAttribute(
    "accept",
    ".mptm, .mod, .s3m, .xm, .it, .667, .669, .amf, .ams, .c67, .cba, .dbm, .digi, .dmf, .dsm, .dsym, .dtm, .etx, .far, .fc, .fc13, .fc14, .fmt, .fst, .ftm, .imf, .ims, .ice, .j2b, .m15, .mdl, .med, .mms, .mt2, .mtm, .mus, .nst, .okt, .plm, .psm, .pt36, .ptm, .puma, .rtm, .sfx, .sfx2, .smod, .st26, .stk, .stm, .stx, .stp, .symmod, .tcb, .gmc, .gtk, .gt2, .ult, .unic, .wow, .xmf, .gdm, .mo3, .oxm, .umx, .xpk, .ppm, .mmcmp"
  );
  hideElem();

  // Set initial loop toggle icon state
  const loopIcon = icon("loopToggle");
  loopIcon.classList.remove("codicon-sync", "codicon-sync-ignored");
  loopIcon.classList.add(loopState === 0 ? "codicon-sync-ignored" : "codicon-sync");

  $$("app-name").forEach((e) => {
    e.textContent = pkg.packageName;
  });
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

chiplib.onEnded(() => {
  hideElem();
});

chiplib.onProgress((pos) => {
  const now = Date.now();
  if (now - lastProgressUpdate > 1000) {
    const actualPos = Math.round(pos.pos);
    modDurAct.textContent = fmtTime(actualPos);
    modSeekbar.value = actualPos;

    const pct = (actualPos / modSeekbar.max) * 100;
    modSeekbar.style.setProperty('--seek-progress', pct + '%');

    lastProgressUpdate = now;
  }
  showElem();
});

chiplib.onMetadata((meta) => {
  const modTypeShortStr = meta.type.toUpperCase();
  const modTypeStr = meta.type_long;
  metaElems.tracker.textContent     = meta.tracker  || "Unknown";
  metaElems.title.textContent       = meta.title    || "Untitled";
  metaElems.type.textContent        = `${modTypeStr} (${modTypeShortStr})`;
  metaElems.artist.textContent      = meta.artist   || "Unknown";
  metaElems.date.textContent        = isoFormat(meta.date) || "Unknown";
  metaElems.instruments.textContent = meta.song.instruments.length;
  metaElems.samples.textContent     = meta.song.samples.length;
  metaElems.channels.textContent    = meta.song.channels.length;
  metaElems.patterns.textContent    = meta.song.patterns.length;
  metaElems.source.textContent      = modSource;
  metaElems.durTot.textContent      = fmtTime(Math.round(meta.dur));
  modSeekbar.max                    = meta.dur;

  modMeta = meta.message
    .split("\n")
    .map((line, i) => `${(i + 1).toString().padStart(2, "0")}: ${line}`)
    .join("\n");
});

async function loadModule(url) {
  const TMA = "https://api.modarchive.org/downloads.php?moduleid=";
  const id = url.match(/moduleid=(\d+)/i)?.[1] ?? url.match(/(\d+)$/)?.[1];
  
  if (url.includes("modarchive.org") && id) {
    await chiplib.load(TMA + id);
    modSource = `The Mod Archive (ID: ${id})`;
    return;
  }

  try {
    new URL(url);
    await chiplib.load(url);
    modSource = "External URL";
    return;
  } catch {}

  const rawId = id ?? url;
  await chiplib.load(TMA + rawId);
  modSource = `The Mod Archive (ID: ${rawId})`;
}

$("inputPlayBtn").addEventListener("click", () => {
  const val = $("url").value;
  if (val === "") {
    alertError("Please enter a URL!");
  } else {
    loadDialog.close();
    loadModule(val);
  }
});

$("modSeekbar").addEventListener("input", () => {
  chiplib.setPos(modSeekbar.value);
});

document.body.onkeyup = function (btn) {
  if (btn.key === " " || btn.code === "Space") {
    chiplib.togglePause();
  }
};

$("playBtn").addEventListener("click", () => {
  chiplib.togglePause();
  const playIcon = icon("playBtn");
  playIcon.classList.toggle("codicon-play");
  playIcon.classList.toggle("codicon-debug-pause");
});

$("loopToggle").addEventListener("click", () => {
  loopState = loopState === 0 ? -1 : 0;
  chiplib.setRepeatCount(loopState);

  const loopBtn  = $("loopToggle");
  const loopIcon = icon("loopToggle");
  loopIcon.classList.toggle("codicon-sync");
  loopIcon.classList.toggle("codicon-sync-ignored");
  loopBtn.classList.toggle("loop-on", loopState !== 0);
});

$("aboutAppBtn").addEventListener("click", () => {
  const message = `${pkg.packageName} is © ${new Date().getFullYear()} ${pkg.author.name}.\nVersion ${pkg.version}\n\nSource code:\n${pkg.repository.url}\n\nUsing chiptune3 by DrSnuggles\nhttps://drsnuggles.github.io/chiptune\n\nAlso using Microsoft's VS Code codicons\nhttps://github.com/microsoft/vscode-codicons`;
  showDialog("info", `About ${pkg.packageName}`, message);
});

$("moduleMsgBtn").addEventListener("click", () => {
  showDialog("none", "Module text/instruments", modMeta);
});

$("stopBtn").addEventListener("click", () => {
  hideElem();
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
  const reader = new FileReader();
  reader.onload = () => {
    chiplib.play(reader.result);
    modSource = "Local file";
  };
  reader.readAsArrayBuffer(file);
});

$("loadUrlBtn").addEventListener("click", () => {
  loadDialog.showModal();
});

loadDialog.addEventListener("click", (e) => {
  if (e.target === loadDialog) loadDialog.close();
});