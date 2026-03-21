<template>
  <div class="titlebar">
    <span class="logo">{{ appName }}</span>
    <div class="titlebar-actions">
      <span class="titlebar-btn" @click="showAbout">
        <Icon icon="mdi:information-outline" />
        About
      </span>
      <span class="titlebar-btn" @click="openLoadDialog">
        <Icon icon="mdi:link" />
        Load URL
      </span>
      <span class="titlebar-btn" @click="triggerFileOpen">
        <Icon icon="mdi:folder-open" />
        Open file
      </span>
      <!-- Window controls — shown only in Tauri because decorations:false
           removes the native OS title bar and its close/minimise buttons. -->
      <template v-if="isTauri">
        <span class="titlebar-btn titlebar-wc" @click="minimizeWindow" title="Minimise">
          <Icon icon="mdi:window-minimize" />
        </span>
        <span class="titlebar-btn titlebar-wc titlebar-wc--close" @click="closeWindow" title="Close">
          <Icon icon="mdi:close" />
        </span>
      </template>
    </div>
  </div>

  <main>
    <dialog ref="loadDialogEl" class="input-section">
      <p id="instruct">
        <Icon icon="mdi:arrow-right" />
        Enter a URL or module ID
      </p>
      <div class="input-play-row">
        <div class="input-wrapper">
          <Icon icon="mdi:link" class="input-icon" />
          <input
            autocomplete="off"
            type="url"
            id="url"
            v-model="urlInput"
            required
            placeholder="https:// or module ID"
            @keydown.enter="loadAndPlay"
          />
        </div>
        <button @click="loadAndPlay" title="Load and play">
          <Icon icon="mdi:play" />
          Load
        </button>
        <input
          type="file"
          ref="fileInputEl"
          style="display: none;"
          :accept="acceptedFormats"
          @change="handleFileChange"
        />
      </div>
    </dialog>

    <div class="mod-details" :class="{ show: showDetails }">
      <div class="mod-now-playing">
        <span class="label">NOW PLAYING</span>
        <h2>{{ modTitle }}</h2>
        <span class="mod-artist">{{ modArtist }}</span>
      </div>
      <div class="mod-divider"></div>
      <div class="mod-details-grid">
        <div class="meta-col">
          <div class="meta-item">
            <span class="meta-key">TYPE</span>
            <span class="meta-val">{{ modType }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-key">TRACKER</span>
            <span class="meta-val">{{ modTracker }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-key">DATE</span>
            <span class="meta-val">{{ modDate }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-key">SOURCE</span>
            <span class="meta-val">{{ modSource }}</span>
          </div>
        </div>
        <div class="meta-col">
          <div class="meta-item">
            <span class="meta-key">CHANNELS</span>
            <span class="meta-val">{{ modChannels }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-key">INSTRUMENTS</span>
            <span class="meta-val">{{ modInstruments }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-key">SAMPLES</span>
            <span class="meta-val">{{ modSamples }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-key">PATTERNS</span>
            <span class="meta-val">{{ modPatterns }}</span>
          </div>
        </div>
      </div>
      <div class="mod-divider"></div>
      <button id="moduleMsgBtn" @click="showModuleMsg">
        <Icon icon="mdi:format-list-bulleted" />
        Module text / instruments
      </button>
    </div>
  </main>

  <div class="bottom-container">
    <input
      type="range"
      id="modSeekbar"
      :max="seekMax"
      :value="seekValue"
      :style="{ '--seek-progress': seekProgress }"
      @input="onSeek"
    />
    <div class="bottom-bar">
      <div class="time-display">
        <span id="modDurAct">{{ currentTime }}</span>
        <span class="time-sep">/</span>
        <span id="modDurTot">{{ totalTime }}</span>
      </div>
      <div class="playback-controls">
        <button class="ctrl-btn" @click="stopPlayback" title="Stop">
          <Icon icon="mdi:stop" />
        </button>
        <button
          class="ctrl-btn"
          :class="{ 'loop-on': loopEnabled }"
          @click="toggleLoop"
          title="Toggle loop"
        >
          <Icon :icon="loopEnabled ? 'mdi:repeat' : 'mdi:repeat-off'" />
        </button>
        <button class="ctrl-btn ctrl-play" @click="togglePause" title="Play/Pause">
          <Icon :icon="isPlaying ? 'mdi:pause' : 'mdi:play'" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';
import { ChiptuneJsPlayer as Chiptune3 } from '../lib/chiptune/chiptune3.js';
import { isoFormat, fmtTime } from './js/utils/timeUtils.js';
import showDialog from './js/utils/showDialog.js';
import { dnd } from '../lib/chiptune/dnd.js';
import pkg from '../../package.json';
// Tauri window API — used for the custom close/minimise buttons that replace
// the native OS window controls removed by decorations:false in tauri.conf.json.
import { getCurrentWindow } from '@tauri-apps/api/window';

// ── App metadata ─────────────────────────────────────────────────────────────

const appName = pkg.packageName;
const copyrightYear = new Date().getFullYear();

// True when the page is running inside a Tauri webview.
// `__TAURI_INTERNALS__` is the official Tauri 2.x sentinel injected into every
// webview context.  The Tauri documentation and migration guides explicitly
// recommend this check for environment detection (see the Tauri v2 upgrade
// guide: https://v2.tauri.app/start/migrate/from-tauri-1/).
const isTauri = '__TAURI_INTERNALS__' in window;

const acceptedFormats =
  '.mptm,.mod,.s3m,.xm,.it,.667,.669,.amf,.ams,.c67,.cba,.dbm,.digi,.dmf,.dsm,.dsym,' +
  '.dtm,.etx,.far,.fc,.fc13,.fc14,.fmt,.fst,.ftm,.imf,.ims,.ice,.j2b,.m15,.mdl,.med,' +
  '.mms,.mt2,.mtm,.mus,.nst,.okt,.plm,.psm,.pt36,.ptm,.puma,.rtm,.sfx,.sfx2,.smod,' +
  '.st26,.stk,.stm,.stx,.stp,.symmod,.tcb,.gmc,.gtk,.gt2,.ult,.unic,.wow,.xmf,.gdm,' +
  '.mo3,.oxm,.umx,.xpk,.ppm,.mmcmp';

// ── DOM refs ──────────────────────────────────────────────────────────────────

const loadDialogEl = ref(null);
const fileInputEl = ref(null);

// ── Reactive state ────────────────────────────────────────────────────────────

const showDetails = ref(false);
const urlInput = ref('');
const loopEnabled = ref(false);
const isPlaying = ref(false);
const seekValue = ref(0);
const seekMax = ref(1);
const currentTime = ref('00:00');
const totalTime = ref('00:00');

// Module metadata
const modTitle = ref('—');
const modArtist = ref('—');
const modType = ref('—');
const modTracker = ref('—');
const modDate = ref('—');
const modSource = ref('');
const modChannels = ref('—');
const modInstruments = ref('—');
const modSamples = ref('—');
const modPatterns = ref('—');
let modMeta = '';

const seekProgress = computed(
  () => `${(seekValue.value / seekMax.value) * 100}%`
);

// ── Chiptune player ───────────────────────────────────────────────────────────

window.chiplib = new Chiptune3();
const chiplib = window.chiplib;

function alertError(message) {
  showDialog('error', 'Error', message);
  showDetails.value = false;
}

chiplib.onInitialized(() => {
  chiplib.setRepeatCount(0);
  dnd(window, (file) => {
    chiplib.play(file);
    modSource.value = 'Drag & Drop';
  });
});

chiplib.onError((err) => {
  switch (err.type) {
    case 'ptr':
      alertError("Unknown error, but it's probably a bad URL or ID.");
      break;
    case 'Load':
      alertError('Failed to load the module.');
      break;
    default:
      alertError(err.type);
      break;
  }
  chiplib.stop();
});

chiplib.onEnded(() => {
  showDetails.value = false;
  isPlaying.value = false;
});

chiplib.onProgress((pos) => {
  const actualPos = Math.round(pos.pos);
  const now = Date.now();
  if (!chiplib._lastUpdate || now - chiplib._lastUpdate > 1000) {
    currentTime.value = fmtTime(actualPos);
    seekValue.value = actualPos;
    chiplib._lastUpdate = now;
  }
  if (!showDetails.value) showDetails.value = true;
  if (!isPlaying.value) isPlaying.value = true;
});

chiplib.onMetadata((meta) => {
  const modTypeShortStr = meta.type.toUpperCase();
  modTracker.value = meta.tracker || 'Unknown';
  modTitle.value = meta.title || 'Untitled';
  modType.value = `${meta.type_long} (${modTypeShortStr})`;
  modArtist.value = meta.artist || 'Unknown';
  modDate.value = isoFormat(meta.date) || 'Unknown';
  modInstruments.value = meta.song.instruments.length;
  modSamples.value = meta.song.samples.length;
  modChannels.value = meta.song.channels.length;
  modPatterns.value = meta.song.patterns.length;
  seekMax.value = meta.dur;
  totalTime.value = fmtTime(Math.round(meta.dur));
  modMeta = meta.message
    .split('\n')
    .map((line, i) => `${(i + 1).toString().padStart(2, '0')}: ${line}`)
    .join('\n');
});

// ── Module loading ────────────────────────────────────────────────────────────

async function loadModule(url) {
  const TMA = 'https://api.modarchive.org/downloads.php?moduleid=';
  const id = url.match(/moduleid=(\d+)/i)?.[1] ?? url.match(/(\d+)$/)?.[1];

  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname;
    if ((host === 'modarchive.org' || host.endsWith('.modarchive.org')) && id) {
      await chiplib.load(TMA + id);
      modSource.value = `The Mod Archive (ID: ${id})`;
      return;
    }
    await chiplib.load(url);
    modSource.value = 'External URL';
    return;
  } catch {}

  const rawId = id ?? url;
  await chiplib.load(TMA + rawId);
  modSource.value = `The Mod Archive (ID: ${rawId})`;
}

// ── UI actions ────────────────────────────────────────────────────────────────

function loadAndPlay() {
  const val = urlInput.value.trim();
  if (!val) {
    alertError('Please enter a URL!');
  } else {
    loadDialogEl.value.close();
    loadModule(val);
  }
}

function onSeek(e) {
  seekValue.value = Number(e.target.value);
  chiplib.setPos(seekValue.value);
}

function togglePause() {
  chiplib.togglePause();
  isPlaying.value = !isPlaying.value;
}

function toggleLoop() {
  loopEnabled.value = !loopEnabled.value;
  chiplib.setRepeatCount(loopEnabled.value ? -1 : 0);
}

function stopPlayback() {
  showDetails.value = false;
  isPlaying.value = false;
  chiplib.stop();
}

function showAbout() {
  const message =
    `${pkg.packageName} is © ${copyrightYear} ${pkg.author.name}.\n` +
    `Version ${pkg.version}\n\n` +
    `Source code:\n${pkg.repository.url}\n\n` +
    `Using chiptune3 by DrSnuggles\nhttps://drsnuggles.github.io/chiptune\n\n` +
    `Also using Iconify\nhttps://iconify.design`;
  showDialog('info', `About ${pkg.packageName}`, message);
}

function showModuleMsg() {
  showDialog('none', 'Module text/instruments', modMeta);
}

function triggerFileOpen() {
  fileInputEl.value.click();
}

function handleFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    chiplib.play(reader.result);
    modSource.value = 'Local file';
  };
  reader.readAsArrayBuffer(file);
}

function openLoadDialog() {
  loadDialogEl.value.showModal();
}

// ── Tauri window controls ─────────────────────────────────────────────────────
// These replace the native OS close / minimise buttons that are absent when
// running under Tauri with decorations:false.

async function closeWindow() {
  await getCurrentWindow().close();
}

async function minimizeWindow() {
  await getCurrentWindow().minimize();
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

function onKeyUp(e) {
  if (e.key === ' ' || e.code === 'Space') {
    chiplib.togglePause();
    isPlaying.value = !isPlaying.value;
  }
}

onMounted(() => {
  document.title = pkg.packageName;
  document.addEventListener('keyup', onKeyUp);
});

onUnmounted(() => {
  document.removeEventListener('keyup', onKeyUp);
});
</script>
