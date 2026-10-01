import {icon} from './icons.js';
import {BIOMES,BOSSES,ITEMS,WEAPONS,RECIPES} from '../data/content.js';
import {drawRegionMap} from '../render/map-art.js';
import {drawPortrait} from '../render/portrait-art.js';

export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const itemIcon=icon;
const itemName=id=>ITEMS[id]?.name||WEAPONS[id]?.name||id;
const roman=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
const ingredientIds=()=>BIOMES.slice(0,9).map(b=>b.ingredient);
const button=(label,action,value='',extra='')=>`<button class="btn ${extra}" data-action="${action}" data-value="${esc(value)}"><span>${label}</span></button>`;
const row=(mark,title,description,action='',extra='')=>`<article class="row-card ${extra}"><span class="item-icon" aria-hidden="true">${mark}</span><div class="row-details"><b>${title}</b><small>${description}</small></div>${action?`<div class="row-actions">${action}</div>`:''}</article>`;
const label=(text)=>`<h3 class="section-label">${text}</h3>`;
const note=(text)=>`<p class="notice"><span class="notice-mark" aria-hidden="true"></span><span>${text}</span></p>`;
const empty=(text)=>`<p class="empty-note">${text}</p>`;

function wrap(title,body,{small='PARADISE?',tabs=[],active='',footer='O tempo está pausado.',className='',mark='default'}={}) {
  return `<section class="panel ${className}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header class="panel-head"><span class="panel-emblem" aria-hidden="true">${icon(mark)}</span><div class="panel-heading"><small>${small}</small><h2>${esc(title)}</h2></div><button class="close" data-action="close" aria-label="Fechar"><span aria-hidden="true"></span></button></header>
    ${tabs.length?`<nav class="tabs" aria-label="Seções do menu">${tabs.map(t=>`<button data-action="tab" data-value="${t.id}" class="${t.id===active?'active':''}" ${t.id===active?'aria-current="page"':''}>${t.label}</button>`).join('')}</nav>`:''}
    <div class="panel-body">${body}</div>
    <footer class="panel-foot"><span><i aria-hidden="true"></i>${footer}</span><span class="keyboard-only"><kbd>Esc</kbd> Voltar</span></footer>
  </section>`;
}
export function objective(s){if(s.phase==='finished')return 'Jornada concluída';if(s.riftClosed)return 'Encontre o Guia';if(s.electricUnlocked)return 'Use o campo elétrico nos três pilares da fenda';if(s.defeated?.includes(18))return s.inventory.acid?`Enfrente ${BOSSES[19].name}`:'Fabrique a poção ácida no ponto de apoio';if(s.biome===9)return 'Enfrente os dois grandes invasores';if((s.defeated?.length||0)===18&&(s.ingredients?.length||0)===9)return 'Siga para o Limite do Paraíso';if(!s.tutorial?.guide)return 'Encontre o Guia';if(!s.tutorial?.collected)return 'Colete madeira e pedra nos arredores';if(!s.tutorial?.tool)return 'Fabrique uma machadinha na mochila [I]';if(!s.tutorial?.weapon)return 'Fabrique sua primeira arma na mochila [I]';const b=BIOMES[s.biome];return !s.ingredients?.includes(b.ingredient)?`Encontre ${ITEMS[b.ingredient]?.name||'o ingrediente desta região'}`:`Explore ${b.name} e enfrente os grandes invasores`;}

function inventory(s) {
  const mission=ingredientIds();
  const common=Object.entries(s.inventory).filter(([id,n])=>n>0&&!mission.includes(id)&&!WEAPONS[id]);
  const weapons=Object.entries(s.player.equipment||{}).filter(([id])=>WEAPONS[id]);
  const tools=Object.entries(s.player.equipment||{}).filter(([id])=>!WEAPONS[id]);
  const condition=(id,e)=>Math.max(0,Math.round(e.durability/(e.maxDurability||WEAPONS[id]?.durability||130)*100));
  return `<div class="two-columns bag-layout"><div>
    <div class="section-heading">${label('Recursos e provisões')}<span class="info-tag">Sem limite de peso</span></div>
    <div class="inventory-grid">${common.map(([id,n])=>`<article class="item-card" title="${esc(ITEMS[id]?.description||'')}"><b class="qty">${n}</b><span class="item-icon" aria-hidden="true">${itemIcon(id)}</span><label>${esc(itemName(id))}</label></article>`).join('')||empty('Colete recursos pelo mundo para abastecer sua mochila.')}</div>
    <div class="button-row provision-actions">${button('Comer','eat')}${button('Beber','drink')}${button('Usar bálsamo','heal')}${button('Armar acampamento','camp')}</div>
    ${note('Acampamentos permitem dormir. Seu retorno após a morte continua sendo o último ponto fixo de apoio.')}
    <div class="section-heading">${label('Ingredientes da missão')}<span class="info-tag">${s.ingredients.length} / 9 encontrados</span></div>
    <div class="inventory-grid mission-grid">${mission.map(id=>`<article class="item-card mission-item ${s.ingredients.includes(id)?'found':'undiscovered'}" title="${esc(ITEMS[id]?.description||'')}"><span class="item-icon" aria-hidden="true">${itemIcon(id)}</span><label>${esc(itemName(id))}</label><small>${s.ingredients.includes(id)?'Encontrado':'A descobrir'}</small></article>`).join('')}</div>
    ${empty('Os ingredientes de missão ficam em uma bolsa separada e acompanham você em toda a jornada.')}
  </div><div>
    ${label('Equipamentos')}
    ${weapons.map(([id,e])=>row(itemIcon(id),esc(itemName(id)),`${condition(id,e)}% de condição · melhoria ${e.upgrade||0}${s.player.weapon===id?' · equipado':''}`,button(s.player.weapon===id?'Em uso':'Equipar','equip',id,s.player.weapon===id?'primary':''),s.player.weapon===id?'equipped':'')).join('')||empty('Fabrique sua primeira arma.')}
    ${tools.map(([id,e])=>row(itemIcon(id),esc(itemName(id)),`${condition(id,e)}% de condição`)).join('')}
    ${note('Armas quebradas permanecem na mochila e podem ser reparadas em pontos de apoio. Sem níveis ou XP: suas descobertas constroem sua força.')}
  </div></div>`;
}

function crafting(s,atSupport) {
  return `<p class="panel-intro">O que você encontra no mundo se transforma em novas possibilidades.</p><div class="recipe-grid">${RECIPES.map(r=>{
    const costs=Object.entries(r.cost||{}),afford=costs.every(([id,n])=>(s.inventory[id]||0)>=n),support=!r.support||atSupport;
    return `<article class="recipe ${afford&&support?'available':''}"><div class="recipe-heading"><span class="recipe-icon" aria-hidden="true">${itemIcon(r.id)}</span><div><small>${r.support?'BANCADA DE APOIO':'FABRICAÇÃO LIVRE'}</small><h3>${esc(r.name)}</h3></div></div><p>${esc(r.description)}</p><div class="cost">${costs.map(([id,n])=>`<span class="cost-chip ${(s.inventory[id]||0)<n?'missing':''}" title="${esc(itemName(id))}"><span aria-hidden="true">${itemIcon(id)}</span><span>${esc(itemName(id))}<b>${s.inventory[id]||0} / ${n}</b></span></span>`).join('')}</div><div class="recipe-footer"><span>${!support?'Visite um ponto de apoio':afford?'Pronto para fabricar':'Recursos insuficientes'}</span><button class="btn ${afford&&support?'primary':''}" data-action="craft" data-value="${r.id}" ${afford&&support?'':'disabled'}><span>Fabricar</span></button></div></article>`;
  }).join('')}</div>`;
}

function services(s) {
  const u=s.upgrades||{};
  const attrs=[['health','Saúde máxima','Mais espaço para se recuperar.','heal'],['stamina','Fôlego máximo','Mais golpes e esquivas em sequência.','default'],['regen','Recuperação de fôlego','Volte à ação mais rapidamente.','herb'],['speed','Passo leve','Percorra o mundo com mais agilidade.','fiber']];
  return `<div class="support-summary"><div><span aria-hidden="true">${icon('camp')}</span><div><b>Um lugar para descansar</b><small>Recupere saúde, fôlego e sono</small></div></div><div><span aria-hidden="true">${icon('map')}</span><div><b>Seu ponto de retorno</b><small>Checkpoint e salvamento automático</small></div></div></div>
    <div class="button-row support-actions">${button('Dormir','sleep','','primary large')}${button('Reparar equipamentos','repair','','large')}${button('Salvar agora','save','','large')}</div>
    ${note('O descanso passa as horas com segurança. Fome e sede ainda pedem cuidado.')}
    <div class="two-columns"><div>${label('Melhorias permanentes')}${attrs.map(([id,name,description,mark])=>row(icon(mark),name,`${description} · estágio ${u[id]||0}/4`,button('Melhorar','upgrade',id))).join('')}${empty('Cada estágio usa essência e cristais. Os custos aparecem ao escolher uma melhoria.')}</div><div>${label('Melhorias das armas')}${Object.entries(s.player.equipment||{}).filter(([id])=>WEAPONS[id]).map(([id,e])=>row(itemIcon(id),esc(itemName(id)),`Estágio ${e.upgrade||0}/3 · aumenta o impacto`,button('Melhorar','weaponUpgrade',id))).join('')||empty('Fabrique uma arma para aprimorá-la aqui.')}${note('Experimente diferentes armas para descobrir novos alcances, ritmos e custos de fôlego.')}</div></div>`;
}

function storage(s,world) {
  const chest=s.storage[world.support.id]||{};
  const ids=[...new Set([...Object.keys(s.inventory),...Object.keys(chest)])].filter(id=>!ingredientIds().includes(id)&&!WEAPONS[id]&&((s.inventory[id]||0)+(chest[id]||0)>0));
  return `<p class="panel-intro">Este baú pertence a ${esc(BIOMES[s.biome].name)}. Cada ponto de apoio guarda seus próprios itens.</p><div class="storage-list">${ids.map(id=>row(itemIcon(id),esc(itemName(id)),`Mochila: ${s.inventory[id]||0} · Baú: ${chest[id]||0}`,`${button('Guardar','deposit',id)}${button('Retirar','withdraw',id)}`)).join('')||empty('Seu armazenamento está vazio.')}</div>${note('Cada clique move até 10 unidades. Ingredientes da missão permanecem sempre com você.')}`;
}

function travel(s) {
  return `<p class="panel-intro">Os caminhos que você já conhece continuam esperando pelo seu retorno.</p><div class="travel-list">${BIOMES.filter(b=>s.supports.includes(b.id)).map(b=>row(icon('map'),`<span class="region-number">${roman[b.id]}</span>${esc(b.name)}`,`Grandes invasores: ${b.bosses.filter(id=>s.defeated.includes(id)).length}/2${b.ingredient?` · Ingrediente ${s.ingredients.includes(b.ingredient)?'encontrado':'pendente'}`:''}`,b.id===s.biome?'<span class="info-tag current-location">Você está aqui</span>':button('Viajar','travel',b.id),b.id===s.biome?'current':'')).join('')}</div>${note('Viaje entre os pontos fixos descobertos para encontrar ingredientes e resolver as pendências da jornada.')}`;
}

function journal(s) {
  return `<article class="quest-card"><span class="quest-emblem" aria-hidden="true">${icon('map')}</span><div><span class="eyebrow">A MISSÃO DO VIAJANTE</span><h3>Uma missão para suas habilidades</h3><p>O Guia pediu que você enfrente os grandes invasores e encontre os nove ingredientes de uma poção. A fenda fica além do Santuário da Luz.</p></div><div class="quest-metrics"><div><b>${s.defeated.length}<span> / 20</span></b><small>Grandes invasores</small></div><div><b>${s.ingredients.length}<span> / 9</span></b><small>Ingredientes</small></div><div><b>${s.supports.length}<span> / 10</span></b><small>Pontos de apoio</small></div></div></article>
    <div class="next-step"><span aria-hidden="true">${icon('default')}</span><div>${label('Próximo passo')}<p>${esc(objective(s))}</p></div></div>
    ${label('As regiões do paraíso')}<div class="region-list">${BIOMES.map(b=>{
      const visited=(s.visited||s.supports).includes(b.id)||s.biome===b.id;
      return `<article class="region-row ${visited?'':'unknown'} ${s.biome===b.id?'current':''}"><span class="region-number">${roman[b.id]}</span><div><b>${visited?esc(b.name):'Região desconhecida'}</b><small>${visited?`${b.bosses.filter(id=>s.defeated.includes(id)).length}/2 grandes invasores${b.ingredient?` · ${s.ingredients.includes(b.ingredient)?'Ingrediente encontrado':'Ingrediente pendente'}`:''}`:'Explore para descobrir'}</small></div>${s.biome===b.id?'<span class="current-dot" aria-label="Região atual"></span>':''}</article>`;
    }).join('')}</div>${note('Não é preciso eliminar todos os invasores comuns. O décimo bioma exige os dezoito grandes invasores anteriores e os nove ingredientes.')}`;
}

function mapPanel(s,world) {
  const found=(world.bosses||[]).filter(b=>(s.pointsOfInterest?.[s.biome]||[]).includes(b.id)||s.defeated.includes(b.id));
  return `<div class="map-layout"><div class="map-sheet"><div class="map-caption"><span>ATLAS DO PARAÍSO</span><span>REGIÃO ${roman[s.biome]}</span></div><canvas id="region-map" width="384" height="288" class="map-canvas" aria-label="Mapa descoberto da região"></canvas><div class="map-legend"><span><i class="map-you"></i>Você</span><span><i class="map-support"></i>Apoio</span><span><i class="map-boss"></i>Invasor</span><span><i class="map-ingredient"></i>Ingrediente</span></div></div><div>${label(esc(BIOMES[s.biome].subtitle))}<p class="panel-intro">${esc(BIOMES[s.biome].description)}</p>${label('Descobertas da região')}<div class="map-discoveries">${found.map(b=>row(icon(s.defeated.includes(b.id)?'essence':'crystal'),esc(BOSSES[b.id].name),s.defeated.includes(b.id)?'Enfrentado':'Grande invasor encontrado')).join('')||empty('Explore os caminhos para encontrar os grandes invasores.')}</div>${note('O mapa se revela conforme você explora. Caminhos, passagens e áreas opcionais conectam os marcos desta região.')}${button('Diário de pendências','journal')}</div></div>`;
}

function controls(touchEnabled) {
  const list=entries=>`<dl class="key-list">${entries.map(([a,b])=>`<div><dt>${a}</dt><dd><kbd>${b}</kbd></dd></div>`).join('')}</dl>`;
  return `${touchEnabled?'<article class="touch-guide"><h3>O paraíso nas suas mãos</h3><p>Arraste o direcional para mover. Segure Atacar para repetir golpes; segure Carregar e solte para um golpe forte. Esquiva desvia, Interagir coleta e conversa, e Correr liga ou desliga a corrida. Alvo alterna a mira. As provisões ficam na faixa inferior; mochila, mapa e pausa ficam no alto da tela. Poção ácida e Campo elétrico aparecem quando disponíveis.</p></article>':''}<div class="two-columns controls-layout"><div>${label('Teclado e mouse')}${list([['Mover','WASD / setas'],['Ataque','J / clique'],['Golpe carregado','Segurar F / botão direito'],['Esquiva','Espaço'],['Correr','Shift'],['Interagir / coletar','E'],['Alternar alvo','Tab'],['Poção ácida','R'],['Campo elétrico','C'],['Mochila / fabricar','I / B'],['Mapa / diário','M / N'],['Pausar','Esc']])}</div><div>${label('Gamepad')}${list([['Mover','Analógico esquerdo'],['Mirar','Analógico direito'],['Ataque','A / cruz'],['Esquiva','B / círculo'],['Interagir','X / quadrado'],['Carregar golpe','Segurar Y / triângulo'],['Correr','RT / R2'],['Alternar alvo','LB / L1'],['Mochila','Select'],['Pausar','Start'],['Curar','Direcional acima'],['Beber','Direcional à direita'],['Poção ácida','Direcional abaixo'],['Campo elétrico','RB / R1']])}</div></div>${note('A mira escolhe um inimigo próximo quando você não aponta o mouse ou o analógico. Caminhar recupera o fôlego.')}`;
}

export function makePanel(view,{state:s,world,settings,hasSave,touchEnabled=false}) {
  const atSupport=Math.hypot(s.player.x-world.support.x,s.player.y-world.support.y)<65;
  switch(view.kind) {
    case 'inventory': {
      const tab=view.tab||'bag';
      return wrap('Sua mochila',tab==='craft'?crafting(s,atSupport):inventory(s),{tabs:[{id:'bag',label:'Inventário'},{id:'craft',label:'Fabricação'}],active:tab,small:'TUDO O QUE VOCÊ CARREGA',mark:'bag',className:'inventory-panel'});
    }
    case 'support': {
      const tab=view.tab||'services',bodies={services:()=>services(s),craft:()=>crafting(s,true),storage:()=>storage(s,world),travel:()=>travel(s)};
      return wrap('Ponto de apoio',(bodies[tab]||bodies.services)(),{tabs:[{id:'services',label:'Descanso e melhorias'},{id:'craft',label:'Fabricação'},{id:'storage',label:'Baú local'},{id:'travel',label:'Viagem rápida'}],active:tab,small:esc(BIOMES[s.biome].name).toUpperCase(),mark:'camp',className:'support-panel'});
    }
    case 'journal': return wrap('Seu caminho',journal(s),{small:'DIÁRIO DA JORNADA',mark:'map',className:'journal-panel'});
    case 'map': return wrap(BIOMES[s.biome].name,mapPanel(s,world),{small:'MAPA DA REGIÃO',mark:'map',className:'map-panel'});
    case 'pause': return wrap('Um momento de descanso',`<div class="two-columns pause-layout"><nav class="pause-actions" aria-label="Jornada pausada">${button('Continuar jornada','close','','primary large')}${button('Diário da jornada','journal','','large')}${button('Configurações','settings','','large')}${button('Controles','controls','','large')}${button('Voltar ao início','returnTitle','','large')}</nav><div class="pause-summary"><span class="eyebrow">REGIÃO ${roman[s.biome]}</span><h3>${esc(BIOMES[s.biome].name)}</h3><div class="pause-metrics"><div><b>${s.defeated.length}</b><small>grandes invasores<br>enfrentados</small></div><div><b>${s.ingredients.length}</b><small>ingredientes<br>encontrados</small></div></div>${note(atSupport?'Você está em um ponto fixo de apoio e pode salvar manualmente.':'O jogo salva automaticamente sua progressão. Visite um ponto fixo de apoio para salvar manualmente.')}<div class="button-row save-actions">${atSupport?button('Salvar agora','save'):''}${button('Exportar salvamento','export')}${button('Importar salvamento','import')}</div></div></div>`,{small:'JORNADA PAUSADA',className:'pause-panel',mark:'pause'});
    case 'settings': return wrap('Configurações',`<div class="settings-list"><label class="settings-row" for="setting-volume"><span>Volume<small>Música, ambiente e efeitos</small></span><span class="range-field"><span class="range-min" aria-hidden="true"></span><input type="range" id="setting-volume" min="0" max="100" value="${Math.round(settings.volume*100)}" aria-label="Volume"><span class="range-max" aria-hidden="true"></span></span></label><label class="settings-row" for="setting-audio"><span>Áudio ligado<small>Ouça as brisas, os passos e a música do mundo</small></span><input class="toggle" type="checkbox" id="setting-audio" ${settings.muted?'':'checked'} aria-label="Áudio ligado"></label><label class="settings-row" for="setting-motion"><span>Animações e flashes suaves<small>Reduz os flashes nos lapsos de memória</small></span><input class="toggle" type="checkbox" id="setting-motion" ${settings.reducedMotion?'checked':''} aria-label="Reduzir flashes"></label><div class="settings-row"><span>Tela cheia<small>A aventura ocupa todo o seu visor</small></span>${button('Alternar tela cheia','fullscreen')}</div><div class="settings-row"><span>Assistência de mira<small>Disponível em todas as dificuldades; Tab alterna o alvo.</small></span><span class="info-tag active-tag">Ativa</span></div></div>${note('As configurações são guardadas neste dispositivo. A dificuldade é escolhida ao iniciar uma nova jornada.')}${button('Ver controles','controls')}`,{small:'AO SEU JEITO',mark:'crystal',className:'settings-panel'});
    case 'controls': return wrap('Controles',controls(touchEnabled),{small:'EXPLORE COM LIBERDADE',mark:'sword',className:'controls-panel'});
    case 'new': return wrap('Um novo começo',`<p class="panel-intro new-intro">Você desperta em um lugar que parece ter esperado por você.</p><div class="difficulty-grid"><article class="difficulty-card calm"><span class="difficulty-symbol" aria-hidden="true">${icon('herb')}</span><small>NO SEU TEMPO</small><h3>Jornada tranquila</h3><p>Invasores mais brandos e mais espaço para aprender, explorar e descobrir.</p>${button('Começar','start','easy','primary large')}</article><article class="difficulty-card natural"><span class="difficulty-symbol" aria-hidden="true">${icon('sword')}</span><small>UM PASSO DE CADA VEZ</small><h3>Jornada natural</h3><p>Combate acessível com atenção aos padrões, ao fôlego e às suas provisões.</p>${button('Começar','start','normal','primary large')}</article></div>${hasSave?note('Seu salvamento atual só será substituído quando você começar a nova jornada.'):''}`,{small:'ESCOLHA O RITMO DA JORNADA',footer:touchEnabled?'Controles por toque e gamepad.':'Teclado, mouse e gamepad.',mark:'default',className:'new-panel'});
    case 'confirmTitle': return wrap('Voltar ao início?',`<p class="panel-intro">O último salvamento automático será mantido. Você pode continuar a jornada pelo menu inicial.</p><div class="button-row">${button('Continuar aqui','close','','primary large')}${button('Voltar ao menu','title','','large')}</div>`,{className:'confirm',mark:'map'});
    default: return '';
  }
}
export function paintMap(canvas,s,world) {
  if(canvas)drawRegionMap(canvas.getContext('2d'),world,s,canvas.width,canvas.height);
}
export function paintPortrait(canvas,speaker,time=0) {
  if(canvas)drawPortrait(canvas,speaker,time);
}
