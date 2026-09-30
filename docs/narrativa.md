# Paradise? — narrativa implementada

Este registro descreve a campanha em `src/data/content.js`. O Documento Mestre da raiz continua sendo a fonte de verdade. Nomes de criaturas, receitas, ingredientes e pequenos diálogos são decisões de implementação; os eventos centrais seguem o documento.

## Sequência da campanha

O Porteiro recebe um homem morto, sem nome e sem lembranças. Sua primeira fala é “SEJA BEM-VINDO AO PARAÍSO!”. O Guia, personagem diferente, ensina sobrevivência, fabricação, combate e suporte. Ele apresenta a missão como uma tarefa compatível com as habilidades do viajante em vida.

Os dez biomas aparecem na ordem estabelecida, sempre belos e paradisíacos. Nos nove primeiros há dois chefes fantásticos e um ingrediente principal. O segundo chefe de cada região ocupa a rota de saída. O primeiro chefe e o ingrediente podem ficar como pendências até o jogador retornar pelos suportes. Entrar no décimo exige os dezoito chefes anteriores e os nove ingredientes registrados.

A poção ácida reúne os nove ingredientes. Na luta final, dissolve a proteção da Flor do Último Horizonte e derrete a criatura na fase decisiva. O poder elétrico e magnético só é recebido depois da vitória. Três nós ao redor da fenda dão ao jogador uma última tarefa simples antes da conclusão em cena.

Após o fechamento, a revelação começa com o Guia parabenizando e agradecendo. A entrada `DIALOGUES.riftComplete` contém esse mesmo início para consumidores que a utilizem; a apresentação final deve usar um único percurso e evitar duplicar o agradecimento.

## Revelação e montagem

`REVELATION` associa cada fala a uma chave visual. A UI deve montar as cenas com registros efetivos de `state.memoryEvents`, preservando posição, bioma, chefe ou ação que o jogador realizou. A fala pode esclarecer o significado, mas os replays devem mostrar ações reconhecíveis da partida.

| Chave | Ação revisitada | Reinterpretação |
| --- | --- | --- |
| `rift` | Fechamento dos nós e da fenda | Conclusão da falsa missão |
| `bosses` | Confrontos já vencidos | Vinte chefes representam vinte vítimas; as batalhas repetem assassinatos |
| `acid` | Fabricação e aplicação da poção, confronto final | Namorada descoberta como vigésima vítima; veneno, hesitação e derretimento |
| `electric` | Aquisição e uso da habilidade | Execução do protagonista na cadeira elétrica |
| `survival` | Coleta, comida, água, descanso e trabalho | Contradição de um paraíso em que é necessário sobreviver |
| `respawn` | Retorno a um suporte após a morte, se ocorrido | Morte não oferece fuga da punição |
| `erase` | Montagem das lembranças que acabaram de se tornar claras | Apagamento visível da memória |
| `opening` | Mesmo jardim e mesmo encontro da abertura | Reinício eterno da sentença |

Se o jogador não tiver morrido, a cena `respawn` deve usar o seu último suporte real enquanto o Guia explica a regra; não deve alegar que houve uma morte na partida.

A revelação explica a prisão, a pena de morte, a execução, a identidade do Guia como administrador da punição e a falsa natureza da invasão e da fenda. Não existe recompensa de libertação ou redenção. A autoridade acima do Guia permanece sem explicação.

Os lapsos anteriores são incompletos: uma porta, uma xícara, um nome, uma promessa, um zumbido. Nenhum apresenta diretamente vítimas, assassinatos, prisão ou inferno. Sua relação com os crimes se torna clara depois da revelação.

## Encerramento

O apagamento desfaz rostos, palavras e identidade. O jardim continua colorido e acolhedor. A mesma situação inicial retorna como cena. A última entrada de `REVELATION` é o Porteiro dizendo exatamente:

> SEJA BEM-VINDO AO PARAÍSO!

A experiência termina nessa fala, sem diálogo adicional e sem início jogável de uma nova missão.
