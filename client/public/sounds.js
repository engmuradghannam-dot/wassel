// WasselERP Sound Generator — Web Audio API (no files needed)
// All sounds generated in real-time using oscillators

window.WasselSounds = {
  ctx: null,

  getCtx() {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  // ─── Message received ─────────────────────────────────────────
  message() {
    try {
      const ctx = this.getCtx();
      const o   = ctx.createOscillator();
      const g   = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.2);
    } catch {}
  },

  // ─── Sent message ──────────────────────────────────────────────
  sent() {
    try {
      const ctx = this.getCtx();
      const o   = ctx.createOscillator();
      const g   = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(600, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.start(); o.stop(ctx.currentTime + 0.15);
    } catch {}
  },

  // ─── Incoming call (repeating ring) ───────────────────────────
  callRingInterval: null,
  startRing() {
    this.stopRing();
    let count = 0;
    const ring = () => {
      if (count++ > 30) { this.stopRing(); return; }
      try {
        const ctx = this.getCtx();
        const now = ctx.currentTime;
        [0, 0.15].forEach(delay => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = 'triangle';
          o.frequency.value = 480;
          g.gain.setValueAtTime(0, now + delay);
          g.gain.linearRampToValueAtTime(0.4, now + delay + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
          o.start(now + delay);
          o.stop(now + delay + 0.3);
        });
      } catch {}
    };
    ring();
    this.callRingInterval = setInterval(ring, 2000);
  },
  stopRing() {
    if (this.callRingInterval) { clearInterval(this.callRingInterval); this.callRingInterval = null; }
  },

  // ─── Call connected ────────────────────────────────────────────
  callConnected() {
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;
      [523, 659, 784].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = freq;
        const t = now + i * 0.12;
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o.start(t); o.stop(t + 0.25);
      });
    } catch {}
  },

  // ─── Call ended ────────────────────────────────────────────────
  callEnded() {
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;
      [784, 523, 392].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = freq;
        const t = now + i * 0.15;
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        o.start(t); o.stop(t + 0.2);
      });
    } catch {}
  },

  // ─── Notification ──────────────────────────────────────────────
  notification() {
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;
      [440, 554, 659, 880].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = freq;
        const t = now + i * 0.08;
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.start(t); o.stop(t + 0.12);
      });
    } catch {}
  },

  // ─── Error ────────────────────────────────────────────────────
  error() {
    try {
      const ctx = this.getCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sawtooth';
      o.frequency.value = 200;
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(); o.stop(ctx.currentTime + 0.4);
    } catch {}
  },

  // ─── Meeting started ──────────────────────────────────────────
  meetingStart() {
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;
      [262, 330, 392, 523, 659].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = freq;
        const t = now + i * 0.1;
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.start(t); o.stop(t + 0.3);
      });
    } catch {}
  }
};
