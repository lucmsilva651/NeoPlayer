import { ChiptuneJsPlayer as chiptune3 } from './lib-chiptune3/chiptune3.js';
import { dnd } from "./lib-chiptune3/dnd.js";

const element = (e) => document.getElementById(e);

let modMeta;
let loopState = 0; // 0 for off, -1 for loop

const modulePage1 = "modarchive.org/index.php?request=view_by_moduleid";
const modulePage2 = "modarchive.org/index.php?request=view_player";
const modulePage3 = "modarchive.org/module.php";
const apiDownload = "https://api.modarchive.org/downloads.php?moduleid=";

function isoFormat(time) {
  const date = new Date(time);
  const year = date.getFullYear() || 1999;
  const day = String(date.getDate() || 1).padStart(2, '0');
  const month = String(date.getMonth() + 1 || 1).padStart(2, '0');
  const hour = String(date.getHours() || 0).padStart(2, '0');
  const minute = String(date.getMinutes() || 0).padStart(2, '0');
  const seconds = String(date.getSeconds() || 0).padStart(2, '0');

  if (time == "") return time;
  return `${day}/${month}/${year} - ${hour}:${minute}:${seconds}`;
};

function fmtMSS(seconds) {
  return (seconds - (seconds %= 60)) / 60 + (9 < seconds ? ":" : ":0") + seconds;
}

Number.prototype.round = function () {
  return Math.round(this);
};

function alertError(error) {
  window.api.openDialog("error", "Error", error);
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
  if (loopState === 0) {
    element("loopToggle").classList.remove("codicon-sync");
    element("loopToggle").classList.add("codicon-sync-ignored");
  } else {
    element("loopToggle").classList.remove("codicon-sync-ignored");
    element("loopToggle").classList.add("codicon-sync");
  }
});

window.chiplib = new chiptune3();

chiplib.onInitialized(() => {
  chiplib.setRepeatCount(loopState);
  dnd(window, (file) => chiplib.play(file));
});

chiplib.onError((err) => {
  if (err.type === "ptr") {
    alertError("Unknown error, but it's probably a bad URL or ID.");
  } else if (err.type === "Load") {
    alertError("Failed to load the module. (?)");
  } else {
    alertError(err.type);
  }
  chiplib.stop();
});

chiplib.onEnded(() => {
  hideElements();
});

chiplib.onProgress((pos) => {
  showElements();
});

chiplib.onMetadata(async (meta) => {
  const modTypeShortStr = meta.type.toUpperCase() || "Unknown";
  const modDurStr = fmtMSS(meta.dur.round()) || "0:00";
  const modTypeStr = meta.type_long || "Unknown";
  element("modTracker").innerText = meta.tracker || "Unknown";
  element("modTitle").innerText = meta.title || "Untitled";
  element("modType").innerText = modTypeStr + ` (${modTypeShortStr})` || "Unknown";
  element("modLength").innerText = modDurStr;
  element("modArtist").innerText = meta.artist || "Unknown";
  element("modDate").innerText = isoFormat(meta.date) || "Unknown";
  element("modInstruments").innerText = meta.song.instruments["length"] || "0";
  element("modSamples").innerText = meta.song.samples["length"] || "0";
  element("modChannels").innerText = meta.song.channels["length"] || "0";
  element("modPatterns").innerText = meta.song.patterns["length"] || "0";
  document.title = `NeoPlayer - ${element("modTitle").innerText} - ${modTypeShortStr} - ${modDurStr}`;
  modMeta = `${meta.message.split('\n').map((line, i) => `${(i + 1).toString().padStart(2, '0')}: ${line}`).join('\n')}` || "No text/instruments found.";
});

async function loadModule(url) {
  if (url.includes(modulePage1 || modulePage2 || modulePage3)) {
    const id = url.match(/(\d+)$/);
    await chiplib.load(`${apiDownload}${id[0]}`);
    return;
  } else if (isNaN(url)) {
    await chiplib.load(url);
    return;
  } else {
    await chiplib.load(`${apiDownload}${url}`);
    return;
  }
}

element("play").addEventListener("click", () => {
  if (element("url").value === "") {
    alertError("Please enter a URL!");
    return;
  } else {
    loadModule(element("url").value);
  }
});

document.body.onkeyup = function (btn) {
  if (btn.key === " " || btn.code === "Space") {
    chiplib.togglePause();
  }
};

element("playBtn").addEventListener("click", () => {
  chiplib.togglePause();
});

element("loopToggle").addEventListener("click", () => {
  loopState = loopState === 0 ? -1 : 0;
  chiplib.setRepeatCount(loopState);
  if (loopState === 0) {
    element("loopToggle").classList.remove("codicon-sync");
    element("loopToggle").classList.add("codicon-sync-ignored");
  } else {
    element("loopToggle").classList.remove("codicon-sync-ignored");
    element("loopToggle").classList.add("codicon-sync");
  }
});

element("moduleMsgBtn").addEventListener("click", () => {
  window.api.openDialog("info", "Module text/instruments", modMeta);
});

element("stopBtn").addEventListener("click", () => {
  hideElements();
  chiplib.stop();
});

element("url").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    element("play").click();
  }
});