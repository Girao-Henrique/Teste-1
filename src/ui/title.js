import {icon} from './icons.js';

/** Tela inicial: marca própria, navegação acessível e o jardim vivo ao fundo. */
export function renderTitle({hasSave=false,native=false,touch=false}={}) {
  const entry=(label,action,{primary=false,mark='default'}={})=>`<button class="${primary?'primary':''}" data-action="${action}"><span class="menu-symbol" aria-hidden="true">${icon(mark)}</span><span class="menu-label">${label}</span><span class="menu-chevron" aria-hidden="true"></span></button>`;
  return `<section class="title-screen" aria-label="Menu inicial">
    <div class="title-halo" aria-hidden="true"><span></span><i></i></div>
    <div class="title-content">
      <div class="title-brand">
        <div class="brand-kicker"><span aria-hidden="true"></span><span class="eyebrow">UMA JORNADA ALÉM DA MEMÓRIA</span></div>
        <h1><img class="wordmark" src="assets/interface/wordmark.svg" alt="Paradise?" width="560" height="158"></h1>
        <div class="title-line" aria-hidden="true"><span></span></div>
        <p>Um novo mundo.<br>Um começo esquecido.</p>
      </div>
      <nav class="title-menu" aria-label="Jornada">
        ${hasSave?entry('Continuar jornada','continue',{primary:true,mark:'map'}):''}
        ${entry('Nova jornada','new',{primary:!hasSave,mark:'default'})}
        ${entry('Configurações','settings',{mark:'crystal'})}
        ${entry('Como jogar','controls',{mark:'sword'})}
        ${hasSave?'':entry('Importar jornada','import',{mark:'bag'})}
        ${native?entry('Sair','quit',{mark:'pause'}):''}
      </nav>
    </div>
    <div class="title-location"><span class="location-mark" aria-hidden="true"></span><div><small>O PRIMEIRO PASSO</small><b>Jardins Celestes</b><span>Onde tudo floresce</span></div></div>
    <div class="title-footer"><span>EXPLORAR <i></i> SOBREVIVER <i></i> DESCOBRIR</span><span class="title-input">${touch?'TOQUE / GAMEPAD':'TECLADO + MOUSE / GAMEPAD'}</span></div>
  </section>`;
}
