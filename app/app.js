import { ChiptuneJsPlayer as chiptune3 } from 'https://DrSnuggles.github.io/chiptune/chiptune3.js';
import { dnd } from "https://DrSnuggles.github.io/chiptune/dnd.js";

const modProgress = document.getElementById("modProgress");
const ppToggle = document.getElementById("ppToggle");
const stopBtn = document.getElementById("stopBtn");
const modTitle = document.getElementById("modTitle");
const modDur = document.getElementById("modDur");
const modType = document.getElementById("modType");
const modTracker = document.getElementById("modTracker");

function fmtMSS(seconds) {
  return (seconds - (seconds %= 60)) / 60 + (9 < seconds ? ":" : ":0") + seconds
}

Number.prototype.round = function () {
  return Math.round(this);
}

function intToFloat(num, decPlaces) {
  return num.toFixed(decPlaces);
}

window.chiplib = new chiptune3();

chiplib.onInitialized(() => {
  chiplib.setRepeatCount(0);
  dnd(window, (file) => {
    chiplib.play(file);
  });
})

chiplib.onError((err) => {
  if (err.type === "ptr") {
    alertError("Unknown error, but it's probably a bad URL or ID.");
  } else if (err.type === "Load") {
    alertError("Failed to load the module. (?)");
  } else {
    alertError(err.type);
  };
  chiplib.stop();
});

let actualDur = 0;
chiplib.onMetadata(async (meta) => {
  const modDurStr = fmtMSS(meta.dur.round()) || "0:00";
  const modTypeStr = meta.type.toUpperCase() || "Unknown";
  actualDur = meta.dur.round();
  modTitle.innerText = meta.title || "Untitled";
  modType.innerText = modTypeStr;
  modDur.innerText = modDurStr
  modTracker.innerText = meta.tracker || "Unknown";
});

document.body.onkeyup = function(btn) {
  if (btn.key == " " || btn.code == "Space") {
    chiplib.togglePause();
  };
};

ppToggle.addEventListener("click", () => {
  chiplib.togglePause();
});

stopBtn.addEventListener("click", () => {
  chiplib.stop();
});