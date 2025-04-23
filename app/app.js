import { ChiptuneJsPlayer as chiptune3 } from 'https://DrSnuggles.github.io/chiptune/chiptune3.js';
import { dnd } from "https://DrSnuggles.github.io/chiptune/dnd.js";

const play = document.getElementById("play");
const url = document.getElementById("url");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const modTitle = document.getElementById("modTitle");
const modDur = document.getElementById("modDur");
const modType = document.getElementById("modType");
const modTracker = document.getElementById("modTracker");
const moduleMsgBtn = document.getElementById("moduleMsgBtn");
const loopToggle = document.getElementById("loopToggle");
const modDetails = document.getElementById("modDetails");
const closeBtn = document.getElementById("closeBtn");
const minimizeBtn = document.getElementById("minimizeBtn");
const maximizeBtn = document.getElementById("maximizeBtn");

let modMeta = "";

const modulePage1 = "modarchive.org/index.php?request=view_by_moduleid"
const modulePage2 = "modarchive.org/index.php?request=view_player"
const modulePage3 = "modarchive.org/module.php"
const apiDownload = "https://api.modarchive.org/downloads.php?moduleid="

function moduleMsg(msg) {
  window.api.openDialog(msg);
}

function updateMaximizeIcon(isMaximized) {
  if (isMaximized) {
    maximizeBtn.classList.remove("ms-Icon--SquareShape");
    maximizeBtn.classList.add("ms-Icon--ChromeRestore");
  } else {
    maximizeBtn.classList.remove("ms-Icon--ChromeRestore");
    maximizeBtn.classList.add("ms-Icon--SquareShape");
  }
}

function fmtMSS(seconds) {
  return (seconds - (seconds %= 60)) / 60 + (9 < seconds ? ":" : ":0") + seconds
}

Number.prototype.round = function () {
  return Math.round(this);
}

function alertError(error) {
  alert(`Error: ${error}`);
  hideElements();
  return;
}

function hideElements() {
  modDetails.style.display = "none";
  moduleMsgBtn.style.display = "none";
}

function showElements() {
  modDetails.style.display = "initial";
  moduleMsgBtn.style.display = "initial";
}

window.api.onWindowMaximized((isMaximized) => {
  updateMaximizeIcon(isMaximized);
});

document.addEventListener("DOMContentLoaded", () => {
  hideElements();
});

window.chiplib = new chiptune3();

chiplib.onInitialized(() => {
  chiplib.setRepeatCount(-1);
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

chiplib.onProgress((pos) => {
  showElements();
})

let actualDur = 0;
chiplib.onMetadata(async (meta) => {
  const modDurStr = fmtMSS(meta.dur.round()) || "0:00";
  const modTypeStr = meta.type_long || "Unknown";
  actualDur = meta.dur.round();
  modTitle.innerText = meta.title || "Untitled";
  modType.innerText = modTypeStr;
  modDur.innerText = modDurStr
  modTracker.innerText = meta.tracker || "Unknown";
  document.title = `NeoPlayer - ${modTitle.innerText} - ${meta.type.toUpperCase()} - ${modDurStr}`;
  modMeta = `Module text/instruments:\n\n${meta.message.split('\n').map((line, i) => `${(i + 1).toString().padStart(2, '0')}: ${line}`).join('\n')}` || "No text/instruments found.";
});

async function loadModule(url) {
  // check if the URL is a ModArchive page instead of a direct link
  if (url.includes(modulePage1 || modulePage2 || modulePage3)) {
    const id = url.match(/(\d+)$/);
    await chiplib.load(`${apiDownload}${id[0]}`);
    return;
  } else {
    // check if the URL is a direct link to a module, instead a ModArchive module ID
    if (isNaN(url) === true) {
      await chiplib.load(url);
      return;
    } else {
      // assume that it is a ModArchive module ID
      await chiplib.load(`${apiDownload}${url}`);
      return;
    };
  };
};

play.addEventListener("click", () => {
  if (url.value === "") {
    alertError("Please enter a URL!");
    return;
  } else {
    loadModule(url.value);
  };
});

document.body.onkeyup = function (btn) {
  if (btn.key == " " || btn.code == "Space") {
    chiplib.togglePause();
  };
};

playBtn.addEventListener("click", () => {
  chiplib.togglePause()
});

loopToggle.addEventListener("click", () => {
  value = value === 0 ? -1 : 0;
  chiplib.setRepeatCount(value);
});

moduleMsgBtn.addEventListener("click", () => {
  moduleMsg(modMeta);
});

minimizeBtn.addEventListener('click', () => {
  window.api.minimize();
});

maximizeBtn.addEventListener('click', () => {
  window.api.maximizeToggle();
});

closeBtn.addEventListener('click', () => {
  window.api.close();
});

stopBtn.addEventListener("click", () => {
  hideElements();
  chiplib.stop();
});