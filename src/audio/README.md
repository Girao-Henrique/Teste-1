# Áudio de Paradise?

`audio.js` sintetiza música, ambiente e efeitos originais usando WebAudio, sem dependências, downloads ou amostras. A direção segue o documento mestre: fantasia acolhedora em todos os dez biomas, inclusive à noite; os lapsos usam fragmentos musicais discretos. Os sons elétricos aparecem somente quando a lógica do jogo os solicita.

## Integração

```js
import { AudioManager } from './audio/audio.js';
const audio = new AudioManager();

// Em uma interação real do jogador, para respeitar a política do navegador:
await audio.unlock();
audio.setVolume(0.65);
audio.setMuted(false);

// No loop de simulação, dt em segundos:
audio.update(engine.state, dt);
audio.play('collect');

// Ao sair do jogo ou interromper a trilha em uma cena/menu:
audio.stop();
```

`update` usa `biome` (0–9), `worldTime` (segundos, ciclo de 780 s), `boss`, `phase` e `paused` opcional. A música noturna acompanha o relógio do jogo das 19h às 6h: `t = (worldTime % 780) / 780`, `hora = (t * 24 + 8) % 24`, noite quando `t >= 11 / 24 && t < 22 / 24`. A sequência só avança quando esse método é chamado com `dt > 0`; menus não devem chamar `update`. Notas já iniciadas terminam suavemente. Use `stop()` para cortar a trilha ao pausar; um `update` ou `play` posterior retoma o áudio. `phase: 'finished'` encerra a trilha. O estado de áudio não integra o salvamento da campanha.

`play` aceita `attack`, `hit`, `hurt`, `dodge`, `collect`, `craft`, `heal`, `death`, `boss`, `travel`, `memory`, `electric`, `ending` e `ui`. Retorna `true` quando o efeito começa e `false` quando o áudio está indisponível, mudo, o nome é desconhecido ou o cooldown impede repetição. `unlock` retorna uma promessa de boolean; uma falha não lança exceção nem bloqueia o jogo.

Volume global vai de 0 a 1 e é suavizado para evitar estalos. O compressor reduz sobreposição; até 28 vozes podem tocar simultaneamente. Efeitos rápidos têm cooldown curto e não ficam em fila quando a janela é suspensa. Dez perfis musicais variam tonalidade, andamento e timbre; arranjos noturnos usam menos notas e continuam agradáveis. O final reapresenta o motivo inicial para apoiar o ciclo narrativo.

## Validação

A implementação permite importar o módulo em Node sem navegador. A criação de contexto ocorre exclusivamente em `unlock()`. Os testes de integração podem fornecer um `AudioContext` simulado ou verificar WebAudio no navegador: desbloqueio, volume, mute, cooldown, limite de vozes, troca de bioma, pausa e encerramento. Não há arquivos sonoros externos a distribuir.
