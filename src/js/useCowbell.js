// Cowbell-exclusive format → player factory.
// Note: .fc is intentionally excluded because chiptune3 already handles it.
const COWBELL_EXT_MAP = {
  // SID (Commodore 64)
  sid:  () => new window.Cowbell.Player.JSSID(),
  // ASAP (Atari 8-bit)
  sap:  () => new window.Cowbell.Player.ASAP(),
  cmc:  () => new window.Cowbell.Player.ASAP(),
  cm3:  () => new window.Cowbell.Player.ASAP(),
  cmr:  () => new window.Cowbell.Player.ASAP(),
  cms:  () => new window.Cowbell.Player.ASAP(),
  dmc:  () => new window.Cowbell.Player.ASAP(),
  dlt:  () => new window.Cowbell.Player.ASAP(),
  mpd:  () => new window.Cowbell.Player.ASAP(),
  rmt:  () => new window.Cowbell.Player.ASAP(),
  tmc:  () => new window.Cowbell.Player.ASAP(),
  tm8:  () => new window.Cowbell.Player.ASAP(),
  tm2:  () => new window.Cowbell.Player.ASAP(),
  // PSGPlay (Atari ST)
  sndh: () => new window.Cowbell.Player.PSGPlay(),
  // AY/YM formats
  vtx:  () => new window.Cowbell.Player.VTX(),
  // ZX Spectrum formats
  stc:  () => new window.Cowbell.Player.ZXSTC(),
  sqt:  () => new window.Cowbell.Player.ZXSQT(),
  pt3:  () => new window.Cowbell.Player.ZXPT3(),
};

// Human-readable label and engine name for each supported extension.
const COWBELL_INFO = {
  sid:  { label: 'SID',  tracker: 'JSSID'   },
  sap:  { label: 'SAP',  tracker: 'ASAP'    },
  cmc:  { label: 'CMC',  tracker: 'ASAP'    },
  cm3:  { label: 'CM3',  tracker: 'ASAP'    },
  cmr:  { label: 'CMR',  tracker: 'ASAP'    },
  cms:  { label: 'CMS',  tracker: 'ASAP'    },
  dmc:  { label: 'DMC',  tracker: 'ASAP'    },
  dlt:  { label: 'DLT',  tracker: 'ASAP'    },
  mpd:  { label: 'MPD',  tracker: 'ASAP'    },
  rmt:  { label: 'RMT',  tracker: 'ASAP'    },
  tmc:  { label: 'TMC',  tracker: 'ASAP'    },
  tm8:  { label: 'TM8',  tracker: 'ASAP'    },
  tm2:  { label: 'TM2',  tracker: 'ASAP'    },
  sndh: { label: 'SNDH', tracker: 'PSGPlay' },
  vtx:  { label: 'VTX',  tracker: 'VTX'     },
  stc:  { label: 'STC',  tracker: 'ZXSTC'   },
  sqt:  { label: 'SQT',  tracker: 'ZXSQT'   },
  pt3:  { label: 'PT3',  tracker: 'ZXPT3'   },
};

function getExt(filename) {
  return filename.split('/').pop().split('?')[0].split('.').pop().toLowerCase();
}

export function useCowbell() {
  let currentTrack = null;
  let blobUrl = null;
  let intervalId = null;
  let repeatCount = 0;

  let progressFn = null;
  let endedFn = null;
  let errorFn = null;
  let metadataFn = null;

  function canHandle(filename) {
    return getExt(filename) in COWBELL_EXT_MAP;
  }

  function _clearInterval() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function _revokeBlobUrl() {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      blobUrl = null;
    }
  }

  function _startPolling() {
    _clearInterval();
    intervalId = setInterval(() => {
      if (currentTrack && !currentTrack.paused) {
        progressFn?.({ pos: currentTrack.currentTime });
      }
    }, 1000);
  }

  function _setupHandlers(audioEl, ext) {
    const info = COWBELL_INFO[ext] || { label: ext.toUpperCase(), tracker: 'Cowbell' };
    const title = `${info.label} module`;

    audioEl.onloadedmetadata = () => {
      const dur = isFinite(audioEl.duration) && audioEl.duration > 0
        ? audioEl.duration
        : 0;
      metadataFn?.({
        title,
        artist: '—',
        tracker: info.tracker,
        type: info.label,
        type_long: title,
        date: null,
        dur,
        song: { channels: null, instruments: null, samples: null, patterns: null },
        message: '',
      });
    };

    audioEl.onended = () => {
      if (repeatCount === -1) {
        // Loop: restart from the beginning.
        audioEl.currentTime = 0;
        audioEl.play();
      } else {
        _clearInterval();
        endedFn?.();
      }
    };
  }

  function _stopAudio() {
    _clearInterval();
    if (currentTrack) {
      currentTrack.onended = null;
      currentTrack.onloadedmetadata = null;
      try { currentTrack.pause(); } catch (_e) { /* ignore */ }
      currentTrack = null;
    }
  }

  function _openAndPlay(url, filename) {
    _stopAudio();

    const ext = getExt(filename);
    const factory = COWBELL_EXT_MAP[ext];
    if (!factory) {
      errorFn?.({ type: 'Load' });
      return;
    }

    try {
      const player = factory();
      const trackOpts = {};
      // SID files play forever unless a duration is given; default to 3 minutes.
      if (ext === 'sid') {
        trackOpts.duration = 180;
      }
      const track = new player.Track(url, trackOpts);
      const audioEl = track.open();
      currentTrack = audioEl;

      _setupHandlers(audioEl, ext);
      _startPolling();
      audioEl.play();
    } catch (_e) {
      errorFn?.({ type: 'Load' });
    }
  }

  function load(url) {
    _openAndPlay(url, url);
  }

  function play(arrayBuffer, filename) {
    _revokeBlobUrl();
    const blob = new Blob([arrayBuffer]);
    blobUrl = URL.createObjectURL(blob);
    _openAndPlay(blobUrl, filename);
  }

  function stop() {
    _stopAudio();
    _revokeBlobUrl();
  }

  function togglePause() {
    if (!currentTrack) return;
    if (currentTrack.paused) {
      currentTrack.play();
    } else {
      currentTrack.pause();
    }
  }

  function setPos(seconds) {
    if (currentTrack) {
      currentTrack.currentTime = seconds;
    }
  }

  function setRepeatCount(count) {
    repeatCount = count;
  }

  function onProgress(fn) { progressFn = fn; }
  function onEnded(fn)    { endedFn    = fn; }
  function onError(fn)    { errorFn    = fn; }
  function onMetadata(fn) { metadataFn = fn; }

  return {
    canHandle,
    load,
    play,
    stop,
    togglePause,
    setPos,
    setRepeatCount,
    onProgress,
    onEnded,
    onError,
    onMetadata,
  };
}
