import { ChiptuneJsPlayer as player } from "../lib/chiptune/chiptune3.js";
import { Visualizer } from "../lib/visualizer/visualizer.min.js";
import { dnd } from "../lib/chiptune/dnd.js";

const { getCurrentWindow } = window.__TAURI__.window;
const appWindow = getCurrentWindow();

const $ = (e) => document.getElementById(e);
const $$ = (c) => document.querySelectorAll(`.${c}`);

const pad = (t) =>
  t
    .split(":")
    .map((v) => String(v).padStart(2, "0"))
    .join(":");

const fmtMSS = (a) =>
  (a - (a %= 60)) / 60 + (a > 9 ? ":" : ":0") + a;

window.ctx = new player();

const canvas = $("moduleVisualizer");
const fullscreenContainer = $("visualizerFullscreen");

let fileName = "";
let fileSize = 0;
let currentPos = 0;
let modMeta = "";

const settings = {
  volume: $("cfgVolume"),
  stereo: $("cfgStereo"),
  tempo: $("cfgTempo"),
  pitch: $("cfgPitch"),
  repeat: $("cfgRepeat")
};

const saved = JSON.parse(
  localStorage.getItem("neoPlayerSettings") || "{}"
);

Object.entries(settings).forEach(([key, el]) => {
  if (saved[key] !== undefined) {
    el.value = saved[key];
  }
});

window.viz = new Visualizer(ctx.gain, canvas, {
  fft: 11
});

const saveSettings = () => {
  localStorage.setItem(
    "neoPlayerSettings",
    JSON.stringify({
      volume: Number(settings.volume.value),
      stereo: Number(settings.stereo.value),
      tempo: parseFloat(settings.tempo.value),
      pitch: parseFloat(settings.pitch.value),
      repeat: Number(settings.repeat.value)
    })
  );
};

const showOSD = () => {
  const osd = $("fullscreenOverlay");
  osd.classList.remove("hidden");
  osd.classList.add("visible");
};

const updateFSInfo = () => {
  $("fsInfo").textContent =
    `${$("modChannels").textContent} CH • ` +
    `${$("modPatterns").textContent} PAT • ` +
    `${pad(fmtMSS(currentPos))} / ${$("modDurTot").textContent}`;
};

const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    await fullscreenContainer.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
};

const updateTitles = () => {
  $$("section-desc").forEach((el) => {
    el.title = el.textContent;
  });
};

window.addEventListener("DOMContentLoaded", () => {
  $("titlebar-minimize").addEventListener("click", () =>
    appWindow.minimize()
  );

  $("titlebar-close").addEventListener("click", () =>
    appWindow.close()
  );

  $("settingsBtn")?.addEventListener("click", () =>
    $("settingsOverlay").classList.remove("hidden")
  );

  $("closeSettings")?.addEventListener("click", () =>
    $("settingsOverlay").classList.add("hidden")
  );

  $("settingsOverlay")?.addEventListener("click", (e) => {
    if (e.target === $("settingsOverlay")) {
      $("settingsOverlay").classList.add("hidden");
    }
  });
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    $("fullscreenOverlay").classList.add("hidden");
    $("fullscreenOverlay").classList.remove("visible");
    return;
  }

  showOSD();
});

document.addEventListener("keydown", async (event) => {
  if (event.key === "F11" || event.code === "KeyF") {
    event.preventDefault();
    await toggleFullscreen();
  }

  if (event.code === "Space") {
    event.preventDefault();
    $("playBtn").click();
  }
});

canvas.addEventListener("click", toggleFullscreen);

fullscreenContainer.addEventListener("mousemove", () => {
  if (document.fullscreenElement) {
    showOSD();
  }
});

const handleSeekWheel = (e) => {
  e.preventDefault();

  const STEP = e.shiftKey
    ? 30
    : Math.max(
      1,
      Math.round(Math.abs(e.deltaY) / 25)
    );

  const durationText = $("modDurTot").textContent;
  const [min, sec] = durationText.split(":").map(Number);

  const maxPos = min * 60 + sec;

  let newPos =
    currentPos +
    (e.deltaY < 0 ? STEP : -STEP);

  newPos = Math.max(
    0,
    Math.min(newPos, maxPos)
  );

  ctx.seek(newPos);

  if (document.fullscreenElement) {
    showOSD();
  }
};

document
  .querySelector(".time .left")
  ?.addEventListener("wheel", handleSeekWheel, {
    passive: false
  });

fullscreenContainer.addEventListener(
  "wheel",
  handleSeekWheel,
  { passive: false }
);

ctx.onInitialized(() => {
  ctx.setVol(Number(settings.volume.value));
  ctx.setStereoSeparation(Number(settings.stereo.value));
  ctx.setTempo(parseFloat(settings.tempo.value));
  ctx.setPitch(parseFloat(settings.pitch.value));
  ctx.setRepeatCount(Number(settings.repeat.value));

  dnd(window, (file) => {
    ctx.play(file);
  });
});

$("openFileBtn").addEventListener("click", () => {
  $("fileInput").click();
});

$("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  fileName = file.name;
  fileSize = file.size;

  const reader = new FileReader();

  reader.onload = () => {
    ctx.play(reader.result);
  };

  reader.readAsArrayBuffer(file);
});

ctx.onProgress((pos) => {
  currentPos = Math.round(pos.pos);
  const now = Date.now();
  $("modElapsed").textContent = pad(fmtMSS(currentPos));
  updateFSInfo();
});

ctx.onMetadata((meta) => {
  modMeta = meta.message
    .split("\n")
    .map(
      (line, i) =>
        `${String(i + 1).padStart(2, "0")}: ${line}`
    )
    .join("\n");

  $("fileName").textContent = fileName;
  $("fileSize").textContent = `${fileSize} B`;
  $("fileFormat").textContent = meta.type_long;
  $("modTracker").textContent = meta.tracker || "Unknown";
  $("modTitle").textContent = meta.title || "Untitled";
  $("modArtist").textContent = meta.artist || "Unknown";
  $("modInstruments").textContent = meta.song.instruments.length;
  $("modSamples").textContent = meta.song.samples.length;
  $("modChannels").textContent = meta.song.channels.length;
  $("modPatterns").textContent = meta.song.patterns.length;
  $("modText").textContent = modMeta;
  $("fsTitle").textContent = meta.title || fileName || "Untitled";
  $("fsTracker").textContent = `${fileName} • ${meta.tracker}` || "Unknown";
  $("fsInfo").textContent = updateFSInfo();
  $("modDurTot").textContent = pad(fmtMSS(Math.round(meta.dur)));
  if (document.fullscreenElement) {
    showOSD();
  }

  updateTitles();
});

$("playBtn").addEventListener("click", () => {
  ctx.togglePause();

  if (document.fullscreenElement) {
    showOSD();
  }
});

$("stopBtn").addEventListener("click", () => {
  ctx.stop();
});

$("rewindBtn").addEventListener("click", () => {
  ctx.seek(currentPos - 10);
})

$("forwardBtn").addEventListener("click", () => {
  ctx.seek(currentPos + 10);
})

settings.volume.addEventListener("input", () => {
  const value = Number(settings.volume.value);

  ctx.setVol(value);

  $("cfgVolumeValue").textContent =
    `${Math.round(value * 100)}%`;

  saveSettings();
});

settings.stereo.addEventListener("input", () => {
  const value = Number(settings.stereo.value);

  ctx.setStereoSeparation(value);

  $("cfgStereoValue").textContent =
    `${value}%`;

  saveSettings();
});

settings.tempo.addEventListener("input", () => {
  const value = settings.tempo.value;

  ctx.setTempo(value);

  $("cfgTempoValue").textContent =
    `${Number(value).toFixed(2)}x`;

  saveSettings();
});

settings.pitch.addEventListener("input", () => {
  const value = settings.pitch.value;

  ctx.setPitch(value);

  $("cfgPitchValue").textContent =
    `${Number(value).toFixed(2)}x`;

  saveSettings();
});

settings.repeat.addEventListener("change", () => {
  ctx.setRepeatCount(Number(settings.repeat.value));
  saveSettings();
});

updateTitles();