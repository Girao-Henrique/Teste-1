# Paradise? — contrato de implementação

Fonte de verdade: PDF na raiz; texto integral em `docs/documento-mestre.txt`.
Jogo local para PC em ES modules + Canvas 2D. Sem dependências de execução.

## Dados (`src/data/content.js`)
Exporta BIOMES (10), BOSSES (20), ITEMS, WEAPONS, RECIPES, DIALOGUES, MEMORIES, REVELATION.
BIOMES: {id:0..9,name,subtitle,description,palette:{grass,grassLight,grassDark,path,water,waterLight,tree,trunk,accent,sky},ingredient:string|null,bosses:[0,1],landmark}.
BOSSES: {id:0..19,name,biome,hp,damage,speed,pattern,secondary,shape,color,accent,description}.
ITEMS objeto por id {name,description,kind}; IDs base: wood,stone,fiber,fruit,water,herb,ore,crystal,essence,food,heal,camp,acid,axe_tool,pickaxe.
WEAPONS objeto por id sword,axe,spear,hammer,daggers,bow,crossbow: {name,damage,range,stamina,cooldown,durability,ranged,arc,color}.
RECIPES array {id,name,description,cost:{item:quantity},output:{item:quantity},support:boolean}; armas usam id da arma. acid requer nove ingredientes, definidos nos biomas.
DIALOGUES objeto por id opening,guide,guideReturn,riftComplete: arrays de {speaker,text}.
MEMORIES array de strings ambíguas. REVELATION array de {speaker,text,visual:string}, termina com apagamento e Porteiro.

## Mundo (`src/world/world.js`)
TILE=16; buildWorld(biome:number) -> {width:96,height:72,tiles:[rows],objects:[],spawn:{x,y},support:{x,y,id},exit:{x,y},bosses:[{id,x,y}],ingredient:{id,x,y}|null,npcs:[{id,x,y}],secrets:[{id,x,y}]}. Coordenadas em pixels.
Tiles 0 relva,1 caminho,2 água,3 paredão,4 ponte,5 piso. isWalkable(world,x,y,radius=6) -> boolean. Pontos de interesse conectados e acessíveis. Nada de obstáculos invisíveis.
Objetos {id,type,x,y,...}; tipos tree,flower,rock,bush,resource,ruin,crystal,waterfall,bridge,camp,support. Recursos usam resource:string e quantity.
Suporte/spawn perto de {160,576}; chefe 1 {768,256}, chefe 2 {1344,576}; saída {1490,576}; ingrediente {1040,944}; segredo {416,256}.

## Render (`src/render/renderer.js`)
export class Renderer constructor(canvas); draw(state,world,time=0); camera={x,y}; screenToWorld(x,y)->{x,y} com x/y nas coordenadas internas do canvas. Base 640x360; nearest neighbor; desenho pixelado próprio, animações por tempo/estado.
Estado player {x,y,hp,maxHp,stamina,maxStamina,facing:{x,y},moving,attackTimer,dodgeTimer,weapon,invulnerable}; enemies [{id,x,y,hp,maxHp,type,telegraph,angle,...}]; boss {id,x,y,hp,maxHp,telegraph,angle,phase,...}|null; projectiles [{x,y,vx,vy,owner,...}]; particles [{x,y,life,...}]. Draw pode tratar campos ausentes com defaults. Jogador/NPCs/chefes/sprites vegetação distintos.

## Engine (`src/game/engine.js`)
export class GameEngine constructor(); start(difficulty='normal'); load(snapshot)->boolean; serialize()->plain state; update(dt,input); act(action,payload); drainEvents()->event[]; state; world.
State {version:1,phase:'playing'|'rift'|'ending'|'finished',difficulty,biome:0,player:{x,y,hp,maxHp,hunger,thirst,sleep,stamina,maxStamina,facing:{x,y},weapon,equipment:{id:{durability,upgrade}},...},inventory:{item:qty},ingredients:[],defeated:[],supports:[],checkpoint:{biome,x,y},storage:{supportId:{item:qty}},worldTime:0,elapsed:0,discoveries:{biome:[]},camps:{biome:[]},upgrades:{health:0,stamina:0,regen:0,speed:0},riftNodes:[],riftClosed:false,memoryEvents:[],enemies:[],boss:null,projectiles:[],particles:[]}.
Input {moveX,moveY,aimX,aimY,attack,strong,dodge,sprint,interact,cycleTarget,potion,electric}; ações discretas apenas uma vez, movimento/sprint contínuos. aim em coordenadas mundo; ausente usa autoaim. Não simular em menus (root controla).
Eventos {type:'dialogue',id}, {type:'toast',text}, {type:'panel',panel:'support'|'inventory',...}, {type:'memory',index}, {type:'save'}, {type:'ending'}.
act ações craft(recipeId),equip(weaponId),eat,drink,heal,camp,sleep,repair,upgrade(attribute),travel(biome),deposit({item,quantity}),withdraw({item,quantity}),dialogueEnd(id),finish. Retorna boolean/success, eventos explicam falhas.
Engine chama buildWorld ao viajar; recursos coletados persistem por bioma. Descoberta em raio e pontos de interesse para mapa. Respawn no suporte fixo, perde parte recursos comuns, nunca ingredientes/equipamento. Camp não altera checkpoint nem solicita save. Tempo 780 segundos, sono crítico após ~3.5 ciclos. Chefes 1 podem ser deixados para depois; chefe 2 ocupa saída; acesso 10 exige 18 chefes +9 ingredientes. Boss 20 exige acid, derrete na última fase; libera eletricidade. Fenda: três nós jogáveis, interação/poder; em seguida evento ending. Registros reais em memoryEvents usados pelo replay final.

## Integração
Root cuida de index.html, styles.css, src/main.js, src/ui/*, persistência em localStorage/exportação JSON, áudio, execução e testes. Demais agentes têm propriedade exclusiva dos arquivos de sua área. Sem publicação ou serviços externos. Tudo no projeto.

## Aplicativos nativos

O mesmo conteúdo de `src/` e `assets/` é copiado para `www/` por `scripts/prepare-app.mjs`. Electron serve esses recursos por um protocolo local seguro, com isolamento de contexto e preload limitado a sair e exportar save. Android serve os recursos de `assets/` a um WebView sob origem HTTPS local interceptada, sem permissão de rede. Nenhum dos aplicativos inicia servidor HTTP.

`TouchControls` agrega direcional, ações mantidas e pulsos por pointer events, com captura independente para multitoque. A entrada final combina toque, teclado e gamepad. Abrir painel zera ações e carga; passar para segundo plano ou retrato pausa a simulação. A ponte Android oferece o seletor nativo de importação/exportação. Saves mantêm o formato versão 1 e são intercambiáveis entre os aplicativos.
