import { ChiptuneJsPlayer as chiptune3 } from 'https://DrSnuggles.github.io/chiptune/chiptune3.js';
import { dnd } from "https://DrSnuggles.github.io/chiptune/dnd.js";

const play = document.getElementById("play");
const url = document.getElementById("url");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const loopToggle = document.getElementById("loopToggle");
const modTitle = document.getElementById("modTitle");
const modDur = document.getElementById("modDur");
const modType = document.getElementById("modType");
const modTracker = document.getElementById("modTracker");
const moduleMsgBtn = document.getElementById("moduleMsgBtn");
const modDetails = document.getElementById("modDetails");

let modMeta = "";
let loopState = -1;  // 0 for off, -1 for loop

const modulePage1 = "modarchive.org/index.php?request=view_by_moduleid";
const modulePage2 = "modarchive.org/index.php?request=view_player";
const modulePage3 = "modarchive.org/module.php";
const apiDownload = "https://api.modarchive.org/downloads.php?moduleid=";

function fmtMSS(seconds) {
  return (seconds - (seconds %= 60)) / 60 + (9 < seconds ? ":" : ":0") + seconds;
}

Number.prototype.round = function () {
  return Math.round(this);
};

function alertError(error) {
  alert(`Error: ${error}`);
  hideElements();
}

function hideElements() {
  modDetails.classList.remove("show");
  moduleMsgBtn.classList.remove("show");
}

function showElements() {
  modDetails.classList.add("show");
  moduleMsgBtn.classList.add("show");
}

document.addEventListener("DOMContentLoaded", () => {
  hideElements();
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

chiplib.onProgress((pos) => {
  showElements();
});

let actualDur = 0;
chiplib.onMetadata(async (meta) => {
  const modDurStr = fmtMSS(meta.dur.round()) || "0:00";
  const modTypeStr = meta.type_long || "Unknown";
  actualDur = meta.dur.round();
  modTitle.innerText = meta.title || "Untitled";
  modType.innerText = modTypeStr;
  modDur.innerText = modDurStr;
  modTracker.innerText = meta.tracker || "Unknown";
  document.title = `NeoPlayer - ${modTitle.innerText} - ${meta.type.toUpperCase()} - ${modDurStr}`;
  modMeta = `Module text/instruments:\n\n${meta.message.split('\n').map((line, i) => `${(i + 1).toString().padStart(2, '0')}: ${line}`).join('\n')}` || "No text/instruments found.";
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

play.addEventListener("click", () => {
  if (url.value === "") {
    alertError("Please enter a URL!");
    return;
  } else {
    loadModule(url.value);
  }
});

document.body.onkeyup = function (btn) {
  if (btn.key === " " || btn.code === "Space") {
    chiplib.togglePause();
  }
};

playBtn.addEventListener("click", () => {
  chiplib.togglePause();
});

loopToggle.addEventListener("click", () => {
  loopState = loopState === 0 ? -1 : 0;
  chiplib.setRepeatCount(loopState);
});

moduleMsgBtn.addEventListener("click", () => {
  alert(modMeta);
});

stopBtn.addEventListener("click", () => {
  hideElements();
  chiplib.stop();
});

// play when user hits enter in input
url.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    play.click();
  }
});
