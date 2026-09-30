/** Controles locais de toque; teclado, mouse e gamepad continuam disponíveis. */
export class TouchControls {
  constructor(container) {
    this.enabled = matchMedia('(pointer: coarse)').matches || !!window.ParadiseNative;
    this.move = {x: 0, y: 0};
    this.held = new Map();
    this.pulses = new Set();
    this.sprinting = false;
    this.pointer = null;
    this.portrait = false;
    this.visible = false;
    document.documentElement.classList.toggle('is-touch', this.enabled);
    container.innerHTML = `<div id="touch-controls" class="touch-controls hidden" aria-label="Controles por toque">
      <div class="touch-joystick" role="group" aria-label="Direcional virtual"><span class="joystick-cross">✦</span><div class="joystick-knob"></div></div>
      <div class="touch-combat">
        <button class="touch-button touch-attack" data-touch="attack" aria-label="Atacar">Atacar</button>
        <button class="touch-button touch-dodge" data-touch="dodge" aria-label="Esquivar">Esquiva</button>
        <button class="touch-button touch-interact" data-touch="interact" aria-label="Interagir e coletar">Interagir</button>
        <button class="touch-button touch-strong" data-touch="strong" aria-label="Segurar para carregar golpe">Carregar</button>
        <button class="touch-button touch-sprint" data-touch="sprint" aria-label="Alternar corrida" aria-pressed="false">Correr</button>
        <button class="touch-button touch-target" data-touch="cycleTarget" aria-label="Alternar alvo">Alvo</button>
      </div>
      <div class="touch-specials"><button class="touch-button" data-touch="potion" hidden>Poção ácida</button><button class="touch-button" data-touch="electric" hidden>Campo elétrico</button></div>
    </div>`;
    this.element = container.firstElementChild;
    this.joystick = this.element.querySelector('.touch-joystick');
    this.knob = this.element.querySelector('.joystick-knob');
    const moveJoystick = event => {
      const rect = this.joystick.getBoundingClientRect();
      const radius = rect.width * .32;
      let x = (event.clientX - rect.left - rect.width / 2) / radius;
      let y = (event.clientY - rect.top - rect.height / 2) / radius;
      const length = Math.hypot(x, y);
      if (length > 1) { x /= length; y /= length; }
      this.move = length < .12 ? {x: 0, y: 0} : {x, y};
      this.knob.style.transform = `translate(${this.move.x * radius}px, ${this.move.y * radius}px)`;
    };
    this.joystick.addEventListener('pointerdown', event => {
      if (this.pointer !== null || !this.visible) return;
      event.preventDefault(); this.pointer = event.pointerId;
      this.joystick.setPointerCapture(event.pointerId); moveJoystick(event);
    });
    this.joystick.addEventListener('pointermove', event => {
      if (event.pointerId === this.pointer) { event.preventDefault(); moveJoystick(event); }
    });
    const releaseJoystick = event => {
      if (event.pointerId !== this.pointer) return;
      this.pointer = null; this.move = {x: 0, y: 0}; this.knob.style.transform = '';
    };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) this.joystick.addEventListener(event, releaseJoystick);
    for (const button of this.element.querySelectorAll('[data-touch]')) {
      button.addEventListener('pointerdown', event => {
        event.preventDefault(); if (!this.visible) return;
        const action = button.dataset.touch;
        button.setPointerCapture(event.pointerId);
        if (action === 'sprint') {
          this.sprinting = !this.sprinting;
          button.classList.toggle('active', this.sprinting);
          button.setAttribute('aria-pressed', String(this.sprinting));
        } else if (['attack', 'strong'].includes(action)) {
          this.held.set(event.pointerId, action); button.classList.add('active');
        } else {
          this.pulses.add(action); button.classList.add('active');
        }
      });
      const release = event => {
        this.held.delete(event.pointerId);
        if (button.dataset.touch !== 'sprint') button.classList.remove('active');
      };
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, release);
    }
    this.layout = () => {
      const before = this.portrait;
      this.portrait = this.enabled && innerHeight > innerWidth;
      document.documentElement.classList.toggle('touch-portrait', this.portrait);
      if (this.portrait && !before) { this.reset(); window.dispatchEvent(new Event('paradise-pause')); }
    };
    addEventListener('resize', this.layout); this.layout();
  }
  reset() {
    this.pointer = null; this.move = {x: 0, y: 0};
    this.held.clear(); this.pulses.clear(); this.sprinting = false;
    if (this.knob) this.knob.style.transform = '';
    for (const button of this.element?.querySelectorAll('.active') || []) button.classList.remove('active');
    this.element?.querySelector('[data-touch="sprint"]')?.setAttribute('aria-pressed', 'false');
  }
  update(state, view, started) {
    const visible = this.enabled && started && !view && !this.portrait && state.phase !== 'finished';
    if (this.visible && !visible) this.reset();
    this.visible = visible; this.element.classList.toggle('hidden', !visible);
    this.element.querySelector('[data-touch="potion"]').hidden = state.boss?.id !== 19 || !(state.inventory.acid > 0);
    this.element.querySelector('[data-touch="electric"]').hidden = !state.electricUnlocked;
  }
  read() {
    const down = name => [...this.held.values()].includes(name);
    const input = {moveX: this.move.x, moveY: this.move.y, attack: down('attack'), strong: down('strong'), sprint: this.sprinting};
    for (const action of ['dodge', 'interact', 'cycleTarget', 'potion', 'electric']) input[action] = this.pulses.has(action);
    this.pulses.clear(); return input;
  }
}
