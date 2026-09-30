// Trilha e efeitos originais, sintetizados em tempo real. Nenhum arquivo externo.
const SCALE = [0, 2, 4, 7, 9];
const MOTIF = [0, null, 2, 4, 3, null, 1, 2, 4, null, 3, 2, 1, null, 2, 0];
const BIOME_MUSIC = [
  { root: 62, bpm: 78, timbre: 'triangle', brightness: 0.9 },
  { root: 57, bpm: 70, timbre: 'sine', brightness: 0.7 },
  { root: 65, bpm: 84, timbre: 'triangle', brightness: 1 },
  { root: 60, bpm: 76, timbre: 'sine', brightness: 0.8 },
  { root: 67, bpm: 66, timbre: 'triangle', brightness: 0.75 },
  { root: 64, bpm: 64, timbre: 'sine', brightness: 0.6 },
  { root: 69, bpm: 72, timbre: 'sine', brightness: 1 },
  { root: 65, bpm: 68, timbre: 'triangle', brightness: 0.75 },
  { root: 62, bpm: 62, timbre: 'sine', brightness: 0.7 },
  { root: 60, bpm: 60, timbre: 'sine', brightness: 0.6 },
];
const COOLDOWNS = {
  attack: 0.065, hit: 0.075, hurt: 0.2, dodge: 0.12, collect: 0.1,
  craft: 0.3, heal: 0.35, death: 1.5, boss: 1.8, travel: 1,
  memory: 1.2, electric: 0.16, ending: 2, ui: 0.065,
};
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** Áudio acolhedor de fantasia. Falha de áudio nunca interrompe o jogo. */
export class AudioManager {
  constructor() {
    this.context = null;
    this.volume = 0.65;
    this.muted = false;
    this.voices = new Set();
    this.maxVoices = 28;
    this.lastPlayed = new Map();
    this.beat = 0;
    this.beatClock = 0;
    this.ambientClock = 3.5;
    this.musicKey = '';
    this.currentState = null;
    this.stopped = false;
    this.unsupported = false;
    this.noiseBuffer = null;
    this._unlockPromise = null;
  }

  /** Chamar a partir de clique, tecla ou botão de gamepad reconhecido pelo app. */
  async unlock() {
    if (this.unsupported) return false;
    if (this._unlockPromise) return this._unlockPromise;
    this._unlockPromise = this._unlock();
    try { return await this._unlockPromise; }
    finally { this._unlockPromise = null; }
  }

  async _unlock() {
    try {
      if (!this.context || this.context.state === 'closed') {
        const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Context) { this.unsupported = true; return false; }
        this.context = new Context({ latencyHint: 'interactive' });
        const ctx = this.context;
        this.master = ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;
        this.compressor = ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 22;
        this.compressor.ratio.value = 3;
        this.compressor.attack.value = 0.008;
        this.compressor.release.value = 0.16;
        this.master.connect(this.compressor);
        this.compressor.connect(ctx.destination);
        this.buses = {};
        for (const [name, level] of Object.entries({ music: 0.58, sfx: 0.82, ambient: 0.28 })) {
          const bus = ctx.createGain();
          bus.gain.value = level;
          bus.connect(this.master);
          this.buses[name] = bus;
        }
        // Eco curto e amortecido; mantém o detalhe dos efeitos de combate.
        this.echo = ctx.createDelay(1);
        this.echo.delayTime.value = 0.22;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1700;
        this.echoFeedback = ctx.createGain();
        this.echoFeedback.gain.value = 0.12;
        this.echoWet = ctx.createGain();
        this.echoWet.gain.value = 0.11;
        this.buses.music.connect(this.echo);
        this.buses.ambient.connect(this.echo);
        this.echo.connect(filter);
        filter.connect(this.echoFeedback);
        this.echoFeedback.connect(this.echo);
        this.echo.connect(this.echoWet);
        this.echoWet.connect(this.master);
        this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
        const samples = this.noiseBuffer.getChannelData(0);
        let softNoise = 0;
        for (let i = 0; i < samples.length; i++) {
          softNoise = (softNoise + (Math.random() * 2 - 1) * 0.1) / 1.1;
          samples[i] = softNoise * 3;
        }
        this.musicKey = '';
      }
      if (this.context.state === 'suspended') await this.context.resume();
      return this.context.state === 'running';
    } catch {
      // Permissões do navegador/dispositivos ausentes podem falhar sem fatalidade.
      return false;
    }
  }

  setVolume(value) {
    if (Number.isFinite(value)) this.volume = clamp(value, 0, 1);
    this._setMaster();
  }

  setMuted(value) {
    this.muted = Boolean(value);
    this._setMaster();
  }

  _setMaster() {
    if (!this.context || !this.master) return;
    const time = this.context.currentTime;
    this.master.gain.cancelScheduledValues(time);
    this.master.gain.setTargetAtTime(this.muted || this.stopped ? 0 : this.volume, time, 0.025);
  }

  _ready() {
    return Boolean(this.context && this.context.state === 'running' && !this.muted && this.volume > 0);
  }

  _activate() {
    if (this.stopped) { this.stopped = false; this._setMaster(); }
  }

  _register(source, envelope, extra = []) {
    // Reserve capacidade para efeitos mesmo durante acordes e transições.
    if (this.voices.size >= this.maxVoices) this._stopVoice(this.voices.values().next().value);
    const voice = { source, envelope, extra, ended: false };
    this.voices.add(voice);
    source.onended = () => {
      this.voices.delete(voice);
      source.disconnect();
      envelope.disconnect();
      for (const node of extra) node.disconnect();
    };
    return voice;
  }

  _stopVoice(voice) {
    if (!voice || voice.ended) return;
    voice.ended = true;
    this.voices.delete(voice);
    const now = this.context.currentTime;
    voice.envelope.gain.cancelScheduledValues(now);
    voice.envelope.gain.setTargetAtTime(0, now, 0.005);
    try { voice.source.stop(now + 0.025); } catch { /* Já finalizada. */ }
  }

  _tone(midi, duration = 0.35, options = {}) {
    if (!this._ready()) return;
    const ctx = this.context;
    const start = ctx.currentTime + (options.delay || 0) + 0.006;
    const end = start + duration;
    const osc = ctx.createOscillator();
    osc.type = options.type || 'sine';
    osc.frequency.setValueAtTime(frequency(midi), start);
    if (options.to !== undefined) osc.frequency.exponentialRampToValueAtTime(frequency(options.to), end);
    const gain = ctx.createGain();
    const peak = options.gain ?? 0.12;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + Math.min(duration / 3, options.attack || 0.012));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(this.buses[options.bus || 'sfx']);
    this._register(osc, gain);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  _noise(duration, options = {}) {
    if (!this._ready()) return;
    const ctx = this.context;
    const start = ctx.currentTime + (options.delay || 0) + 0.006;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = options.filter || 'bandpass';
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(options.frequency || 900, start);
    if (options.to) filter.frequency.exponentialRampToValueAtTime(options.to, start + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(options.gain || 0.12, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.buses[options.bus || 'sfx']);
    this._register(source, gain, [filter]);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  _notes(notes, step = 0.085, options = {}) {
    notes.forEach((note, index) => this._tone(note, options.duration || 0.32,
      { ...options, delay: (options.delay || 0) + index * step }));
  }

  /** IDs internos de efeitos; não são textos exibidos ao jogador. */
  play(name) {
    if (!(name in COOLDOWNS) || !this._ready()) return false;
    const now = this.context.currentTime;
    if (now - (this.lastPlayed.get(name) ?? -Infinity) < COOLDOWNS[name]) return false;
    this.lastPlayed.set(name, now);
    this._activate();
    switch (name) {
      case 'attack':
        this._noise(0.12, { frequency: 1800, to: 600, gain: 0.13 });
        this._tone(63, 0.095, { to: 45, gain: 0.04, type: 'triangle' });
        break;
      case 'hit':
        this._tone(55, 0.09, { to: 39, type: 'triangle', gain: 0.19 });
        this._noise(0.065, { frequency: 1100, gain: 0.15 });
        break;
      case 'hurt':
        this._tone(55, 0.2, { to: 49, gain: 0.17, type: 'triangle' });
        this._noise(0.11, { frequency: 650, gain: 0.08 });
        break;
      case 'dodge': this._noise(0.18, { frequency: 1100, to: 2400, gain: 0.14 }); break;
      case 'collect': this._notes([79, 86], 0.065, { gain: 0.085, duration: 0.25 }); break;
      case 'craft':
        this._tone(60, 0.09, { type: 'triangle', gain: 0.13 });
        this._notes([72, 76, 79], 0.085, { delay: 0.1, gain: 0.09 });
        break;
      case 'heal': this._notes([67, 71, 74, 79], 0.11, { duration: 0.55, gain: 0.09 }); break;
      case 'death': this._notes([76, 71, 67, 62], 0.18, { duration: 0.75, gain: 0.095 }); break;
      case 'boss':
        this._notes([50, 57, 62, 69], 0.12, { duration: 0.6, gain: 0.13, type: 'triangle' });
        break;
      case 'travel': this._notes([62, 64, 66, 69, 73, 78], 0.085, { duration: 0.6, gain: 0.09 }); break;
      case 'memory':
        // Fragmento incompleto e distante; não denuncia a reviravolta.
        this._tone(78, 0.65, { attack: 0.2, gain: 0.07 });
        this._tone(73, 0.8, { delay: 0.18, attack: 0.2, gain: 0.045 });
        break;
      case 'electric':
        this._noise(0.22, { frequency: 3600, to: 1400, gain: 0.18 });
        this._notes([74, 86, 81], 0.045, { type: 'triangle', duration: 0.16, gain: 0.08 });
        break;
      case 'ending': this._notes([74, 78, 81, 78, 76, 74], 0.26, { duration: 1.05, gain: 0.075 }); break;
      case 'ui': this._tone(79, 0.12, { gain: 0.07 }); break;
    }
    return true;
  }

  /** Chamar somente quando a simulação avança; dt em segundos. */
  update(state, dt) {
    if (!state || !Number.isFinite(dt) || dt <= 0) return;
    this.currentState = state;
    if (state.phase === 'finished' || state.paused) { if (!this.stopped) this.stop(); return; }
    if (!this._ready()) return;
    this._activate();
    const biome = clamp(Math.floor(state.biome || 0), 0, 9);
    const worldTime = Number.isFinite(state.worldTime) ? state.worldTime : 0;
    const day = ((worldTime % 780) + 780) % 780 / 780;
    const night = day >= 11 / 24 && day < 22 / 24;
    const ending = state.phase === 'ending';
    const profile = ending ? BIOME_MUSIC[0] : BIOME_MUSIC[biome];
    const key = `${biome}:${night}:${ending}`;
    if (key !== this.musicKey) {
      this.musicKey = key;
      this.beat = 0;
      this.beatClock = 0;
      this.ambientClock = 2.5;
    }
    const beatTime = 60 / (profile.bpm * (night || ending ? 0.8 : 1)) / 2;
    this.beatClock -= Math.min(dt, 0.25);
    if (this.beatClock <= 0) {
      // Não recupera notas perdidas depois de abas suspensas ou pausas longas.
      this.beatClock = beatTime;
      this._musicBeat(profile, night, ending, Boolean(state.boss));
      this.beat = (this.beat + 1) % 64;
    }
    if (!ending) {
      this.ambientClock -= Math.min(dt, 0.25);
      if (this.ambientClock <= 0) {
        this._ambience(biome, night);
        this.ambientClock = 6 + Math.random() * 8;
      }
    }
  }

  _musicBeat(profile, night, ending, boss) {
    const phrase = Math.floor(this.beat / 16);
    const position = this.beat % 16;
    const index = MOTIF[position];
    const root = profile.root;
    const soft = night || ending;
    if (index !== null && (!soft || position % 2 === 0)) {
      const note = root + SCALE[(index + (phrase % 2 ? 1 : 0)) % SCALE.length] + 12;
      this._tone(note, soft ? 1.25 : 0.65, {
        bus: 'music', type: soft ? 'sine' : profile.timbre,
        gain: (soft ? 0.047 : 0.065) * profile.brightness, attack: 0.02,
      });
      if (position === 4 && !soft) this._tone(note + 12, 0.4, { bus: 'music', gain: 0.016 });
    }
    if (position === 0 || position === 8) {
      const bass = root - 12 + (position === 8 ? 7 : 0);
      this._tone(bass, soft ? 1.8 : 1.4, { bus: 'music', gain: 0.062, attack: 0.05 });
      this._tone(root + (phrase % 2 ? 9 : 4), 1.4, { bus: 'music', gain: 0.024, attack: 0.1 });
    }
    // Pulso leve para leitura de ritmo, sem mudar a identidade do mundo.
    if (boss && !ending && position % 4 === 0) {
      this._tone(root - 12, 0.15, { bus: 'music', type: 'triangle', gain: 0.07, to: root - 24 });
    }
  }

  _ambience(biome, night) {
    if ([0, 1, 2, 5].includes(biome) && !night) {
      const note = 90 + (biome % 3) * 2;
      this._tone(note, 0.11, { bus: 'ambient', gain: 0.12, to: note + 5 });
      this._tone(note + 2, 0.15, { bus: 'ambient', gain: 0.09, to: note - 1, delay: 0.15 });
    } else if ([3, 4, 6, 8].includes(biome)) {
      this._noise(0.55, { bus: 'ambient', filter: 'lowpass', frequency: 850, to: 400, gain: 0.11 });
      if (biome === 6) this._notes([86, 90], 0.2, { bus: 'ambient', duration: 0.6, gain: 0.05 });
    } else {
      this._tone(86 + (biome % 3) * 2, 1.2, { bus: 'ambient', gain: 0.04, attack: 0.2 });
    }
  }

  /** Silencia imediatamente e prepara a próxima frase. Não destrói o contexto. */
  stop() {
    this.stopped = true;
    this._setMaster();
    for (const voice of [...this.voices]) this._stopVoice(voice);
    this.musicKey = '';
    this.beat = 0;
    this.beatClock = 0;
    this.ambientClock = 3.5;
  }
}
