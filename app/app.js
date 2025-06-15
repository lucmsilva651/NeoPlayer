import { ChiptuneJsPlayer as chiptune3 } from './lib-chiptune3/chiptune3.js';
import { dnd } from "./lib-chiptune3/dnd.js";

const element = (e) => document.getElementById(e);

let modMeta;
let modSource;
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

function secToMin(sec) {
  const minutes = Math.floor(sec / 60);
  const remSecs = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
}

function addPadding(time) {
  const [min, sec] = time.split(':');
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function fmtMSS(seconds) {
  return (seconds - (seconds %= 60)) / 60 + (9 < seconds ? ":" : ":0") + seconds;
}

Number.prototype.round = function () {
  return Math.round(this);
};

function alertError(error) {
  window.api.openDialog({
    type: 'error',
    buttons: ['Close'],
    title: 'Error',
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
  dnd(window, (file) => {
    chiplib.play(file);
    modSource = "Drag & Drop";
  });
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

let lastUpdate = 0;
let actualPos = 0;
chiplib.onProgress((pos) => {
  actualPos = pos.pos.round();
  const now = Date.now();
  if (now - lastUpdate > 1000) {
    element("modDurAct").textContent = secToMin(actualPos);
    lastUpdate = now;
  };
  showElements();
});

chiplib.onMetadata(async (meta) => {
  const modTypeShortStr = meta.type.toUpperCase() || "Unknown";
  const modDurStr = fmtMSS(meta.dur.round()) || "0:00";
  const modTypeStr = meta.type_long || "Unknown";
  element("modTracker").textContent = meta.tracker || "Unknown";
  element("modTitle").textContent = meta.title || "Untitled";
  element("modType").textContent = modTypeStr + ` (${modTypeShortStr})` || "Unknown";
  element("modArtist").textContent = meta.artist || "Unknown";
  element("modDate").textContent = isoFormat(meta.date) || "Unknown";
  element("modInstruments").textContent = meta.song.instruments["length"] || "0";
  element("modSamples").textContent = meta.song.samples["length"] || "0";
  element("modChannels").textContent = meta.song.channels["length"] || "0";
  element("modPatterns").textContent = meta.song.patterns["length"] || "0";
  element("modSource").textContent = modSource;
  element("modDurTot").textContent = addPadding(modDurStr);
  document.title = `NeoPlayer - ${element("modTitle").textContent} - ${modTypeShortStr} - ${addPadding(modDurStr)}`;
  modMeta = `${meta.message.split('\n').map((line, i) => `${(i + 1).toString().padStart(2, '0')}: ${line}`).join('\n')}` || "No text/instruments found.";
});

async function loadModule(url) {
  if (url.includes(modulePage1 || modulePage2 || modulePage3)) {
    const id = url.match(/(\d+)$/);
    await chiplib.load(`${apiDownload}${id[0]}`);
    modSource = "The Mod Archive";
    return;
  } else if (isNaN(url)) {
    await chiplib.load(url);
    modSource = "External URL";
    return;
  } else {
    await chiplib.load(`${apiDownload}${url}`);
    modSource = "The Mod Archive";
    return;
  }
}

element("inputPlayBtn").addEventListener("click", () => {
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

element("aboutBtn").addEventListener("click", () => {
  const aboutStr = "NeoPlayer is © 2025 Lucas Gabriel (lucmsilva). All rights reserved.\n\nSource code:\nhttps://github.com/lucmsilva651/NeoPlayer\n\nUsing Microsoft's VS Code codicons\nhttps://github.com/microsoft/vscode-codicons";
  window.api.openDialog({
    type: 'info',
    buttons: ['Ok'],
    title: 'About NeoPlayer',
    message: aboutStr,
  });
})

element("moduleMsgBtn").addEventListener("click", () => {
  window.api.openDialog({
    type: 'none',
    buttons: ['Close'],
    title: 'Module text/instruments',
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

element("openFile").addEventListener("click", () => {
  element("fileInput").click();
});

element("fileInput").addEventListener("change", e => {
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