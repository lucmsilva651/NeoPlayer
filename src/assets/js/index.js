import { ChiptuneJsPlayer as chiptune3 } from "../../lib/chiptune/chiptune3.js";
import { dnd } from "../../lib/chiptune/dnd.js";

const element = (e) => document.getElementById(e);
const elements = (c) => document.querySelectorAll(`.${c}`);

let modMeta;
let modSource;
let loopState = 0;

function isoFormat(time) {
  if (time === "") return time;
  const date = new Date(time);
  const year = date.getFullYear();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} - ${hour}:${minute}:${seconds}`;
}

function addPadding(time) {
  const [min, sec] = time.split(":");
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function fmtMSS(seconds) {
  return (seconds - (seconds %= 60)) / 60 + (9 < seconds ? ":" : ":0") + seconds;
}

Number.prototype.round = function () {
  return Math.round(this);
};

function alertError(error) {
  window.api.alert({
    type: "error",
    buttons: ["Close"],
    title: "Error",
    message: error,
  });
  hideElements();
}

function hideElements() {
  element("modDetails").classList.remove("show");
  element("moduleMsgBtn").classList.remove("show");
}

function showElements() {
  element("modDetails").classList.add("show");
  element("moduleMsgBtn").classList.add("show");
}

document.addEventListener("DOMContentLoaded", () => {
  hideElements();
  const toggle = element("loopToggle");
  toggle.classList.remove(loopState === 0 ? "codicon-sync" : "codicon-sync-ignored");
  toggle.classList.add(loopState === 0 ? "codicon-sync-ignored" : "codicon-sync");
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
  const actualPos = pos.pos.round();
  const now = Date.now();
  if (!chiplib._lastUpdate || now - chiplib._lastUpdate > 1000) {
    element("modDurAct").textContent = addPadding(fmtMSS(actualPos));
    chiplib._lastUpdate = now;
  }
  showElements();
});

chiplib.onMetadata((meta) => {
  const modTypeShortStr = meta.type.toUpperCase();
  const modDurStr = fmtMSS(meta.dur.round());
  const modTypeStr = meta.type_long;
  element("modTracker").textContent = meta.tracker || "Unknown";
  element("modTitle").textContent = meta.title || "Untitled";
  element("modType").textContent = `${modTypeStr} (${modTypeShortStr})`;
  element("modArtist").textContent = meta.artist || "Unknown";
  element("modDate").textContent = isoFormat(meta.date);
  element("modInstruments").textContent = meta.song.instruments.length;
  element("modSamples").textContent = meta.song.samples.length;
  element("modChannels").textContent = meta.song.channels.length;
  element("modPatterns").textContent = meta.song.patterns.length;
  element("modSource").textContent = modSource;
  element("modDurTot").textContent = addPadding(modDurStr);
  document.title = `NeoPlayer - ${element("modTitle").textContent} - ${modTypeShortStr} - ${addPadding(modDurStr)}`;
  modMeta = meta.message.split("\n").map((line, i) => `${(i + 1).toString().padStart(2, "0")}: ${line}`).join("\n");
});

async function loadModule(url) {
  const tma = "https://api.modarchive.org/downloads.php?moduleid=";
  const id = url.match(/moduleid=(\d+)/i) || url.match(/(\d+)$/);
  try {
    new URL(url);
    if (url.includes("modarchive.org") && id) {
      await chiplib.load(tma + id[1]);
      modSource = "The Mod Archive";
    } else {
      await chiplib.load(url);
      modSource = "External URL";
    }
  } catch {
    await chiplib.load(`${tma}${url}`);
    modSource = "The Mod Archive";
  }
}

element("inputPlayBtn").addEventListener("click", () => {
  const val = element("url").value;
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

element("playBtn").addEventListener("click", () => {
  chiplib.togglePause();
  const playBtn = element("playBtn");
  playBtn.classList.toggle("codicon-play");
  playBtn.classList.toggle("codicon-debug-pause");
});

element("loopToggle").addEventListener("click", () => {
  loopState = loopState === 0 ? -1 : 0;
  chiplib.setRepeatCount(loopState);
  const toggle = element("loopToggle");
  toggle.classList.toggle("codicon-sync");
  toggle.classList.toggle("codicon-sync-ignored");
});

elements("about-neoplayer").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.api.alert({
      type: "info",
      buttons: ["Ok"],
      title: "About NeoPlayer",
      message: "NeoPlayer is © 2025 Lucas Gabriel (lucmsilva). All rights reserved.\n\nSource code:\nhttps://github.com/lucmsilva651/NeoPlayer\n\nUsing Microsoft's VS Code codicons\nhttps://github.com/microsoft/vscode-codicons",
    });
  });
});

element("moduleMsgBtn").addEventListener("click", () => {
  window.api.alert({
    type: "none",
    buttons: ["Close"],
    title: "Module text/instruments",
    message: modMeta,
  });
});

element("stopBtn").addEventListener("click", () => {
  hideElements();
  chiplib.stop();
});

element("url").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    element("inputPlayBtn").click();
  }
});

elements("openfile-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    element("fileInput").click();
  });
});

element("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  element("url").value = file.name;
  const reader = new FileReader();
  reader.onload = () => {
    chiplib.play(reader.result);
    modSource = "Local file";
  };
  reader.readAsArrayBuffer(file);
});