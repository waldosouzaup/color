# Domínio de colorimetria

## Origem e precedência

Regras operacionais extraídas do arquivo `AULA 42 PT METODO DO MESTRE DA COLORIMETRIA LTDA.docx`, conferidas com o pedido do produto. O `Livro-de-Colorimetria.pdf` complementa iluminação, metameria, aplicação e comportamentos por vista.

A bússola da interface **reproduz a composição de `aplicativo.jpeg`**: doze setores, esferas, rótulos, pigmentos internos, setas e pivô, redesenhados em SVG a partir de medição da imagem. A orientação anterior, que limitava as imagens a referência conceitual, valia para o desenho genérico anterior e não descreve mais o objetivo. O que permanece é a precedência: **arte não substitui matriz**. Inscrições da arte que divergem da matriz estão listadas em [BUSSOLA_VISUAL.md](BUSSOLA_VISUAL.md) e não alteram pigmento, combinação ou dose. A arte de marca dos anexos não é incorporada; os nomes do produto aparecem em vetor.

O manual usa quatro famílias como uma classificação operacional do método. Isso não é apresentado como uma taxonomia científica universal da cor. Divergências da arte da bússola não substituem a precedência do manual.

## Matriz e correções

| Tom    | Direção   | Correção                     | Relação                  |
| ------ | --------- | ---------------------------- | ------------------------ |
| YELLOW | REDISH    | BLUE_GREEN                   | Principal                |
| YELLOW | GREENISH  | RED_BLUE ou VIOLET           | Escolher uma alternativa |
| BLUE   | REDISH    | LEMON_YELLOW                 | Principal                |
| BLUE   | GREENISH  | RED_OXIDE ou VIOLET          | Escolher uma alternativa |
| GREEN  | YELLOWISH | VIOLET, RED_SUPPORT opcional | Principal e suporte      |
| GREEN  | BLUISH    | VIOLET + RED_OXIDE           | Ambas obrigatórias       |
| RED    | BLUISH    | LEMON_YELLOW                 | Principal                |
| RED    | YELLOWISH | RED_BLUE ou VIOLET           | Escolher uma alternativa |

`REDISH` preserva a grafia exigida no contrato. `RED_BLUE` significa **azul avermelhado**. Validação Zod compartilhada e matriz no domínio impedem combinações inválidas. O backend também valida as bases escolhidas e exige as duas adições da correção combinada.

## Fórmula original e correção

A fórmula original é um registro imutável dos componentes informados pelo profissional. Não vem de uma base proprietária copiada. Ao iniciar uma sessão, a soma dos componentes deve coincidir com a massa informada. Fórmulas de outro peso devem ser registradas com os pesos efetivamente preparados; não existe ajuste de escala silencioso.

Pesagem exige modo explícito. Para acumulado `100, 145, 162.50`, os incrementos são `100, 45, 17.50`. O banco conserva o valor digitado e o incremento. Correções são adições separadas e jamais alteram esses componentes.

## Primeiro ângulo e efeito

Antes do diagnóstico inicial exige-se uma chapa. A classificação começa em `ANGLE`; após uma adição, exige-se nova chapa e registro da frente junto com a próxima classificação do ângulo. Aprovação exige confirmação e observações de ambas as vistas, sob iluminação registrada.

O motor A resolve matiz. O motor B está limitado à documentação: comportamentos por vista, aparência das partículas e condições de aplicação, e à **consulta qualitativa** desses comportamentos (seção seguinte). Não calcula alumínio, pérola, granulometria ou flop. Fotos apenas documentam as chapas; não há reconhecimento automático de cor.

## Três perguntas diferentes

| Pergunta do profissional | Ferramenta | Parte de | Entrega | Não faz |
| --- | --- | --- | --- | --- |
| "Minha tinta está amarela avermelhada no ângulo; o que corta?" | **Diagnóstico pela bússola** (motor A) | Tom e subtom **observados** na chapa | Regra vigente entre as oito e a função de corte (`characteristic`) | Não procura base por efeito desejado |
| "Preciso de um pigmento que amarele a frente e deixe o ângulo azul" | **Consulta qualitativa de comportamento** (motor B) | Efeito **desejado** por vista | Bases cujos `PigmentBehavior` documentam as condições, com fonte | Não resolve regra, não indica dose, não grava nada |
| "Quanto adiciono?" | **Cálculo de dosagem** | Coeficiente VERIFIED do contexto exato | Gramas, ou DOSAGEM NÃO CALIBRADA | Não é deduzido de nenhuma das anteriores |

## Consulta qualitativa de comportamento

Fica na Biblioteca de Pigmentos, com atalho na bússola. Responsabilidades separadas, todas determinísticas e sem serviço externo:

1. **Vocabulário** (`behavior-vocabulary.ts`): léxico explícito de matizes (amarelo, azul, verde, vermelho, violeta, laranja, marrom, rosa, dourado, cinza, preto, branco) e qualificadores (limpo/sujo, claro/escuro, leitoso, transparente, partícula fina/graúda, brilho, partícula aparente). Normaliza acentos e caixa. O mesmo léxico lê a pergunta e os descritores cadastrados: o primeiro matiz de um descritor é o principal ("Azul esverdeado" é azul) e os seguintes são tendência.
2. **Critérios** (`behavior-criteria.ts`): cada vista tem matiz principal, tendência, matizes a evitar, qualificadores exigidos e excluídos. É o contrato validado pelo servidor e o que os controles da tela editam.
3. **Interpretação** (`behavior-interpreter.ts`): associa cada termo à vista pela estrutura da frase ("amarele **a frente**", "**frente** amarelada", "azulado **no ângulo**"), trata negação ("sem leitoso", "não pode ficar suja") e distingue pedido de observação ("minha tinta está amarela de frente"). Termo sem vista, matizes principais concorrentes, "ou" entre condições e observação pedem confirmação; nada é buscado em silêncio.
4. **Correspondência** (`behavior-matcher.ts`) e **consulta** (`services/behavior-query.ts`): leitura escopada pela organização da sessão, somente bases ativas, filtros de fabricante, linha e sistema, demonstrativos fora por padrão e identificados quando incluídos.

Regras de correspondência:

- Todas as condições valem para a **mesma base**. Condição de frente só é conferida em registros `FRONT`; de ângulo, em `ANGLE`.
- `GENERAL` nunca comprova vista. Uma base só com registro geral relacionado aparece à parte, como informação insuficiente.
- Matiz pedido precisa ser o principal do descritor. Presente só como tendência ("Vermelho amarelado" para "amarelar") conta como parcial.
- Qualificador exigido precisa estar escrito. Sem menção, o resultado é "sem informação", não "atende". O oposto registrado ("sujo" para "limpo") é "não atende".
- Qualificador excluído ou matiz evitado é atendido quando o registro não o menciona; essa ausência, sozinha, não torna uma base parcial.
- Registros da mesma vista que discordam, ou um registro que afirma opostos, são "divergente".
- Completas primeiro, na ordem fabricante, linha e código. Parciais separadas, com cada condição explicada. Não há percentual de confiança.

Os descritores considerados são matiz, luminosidade, limpeza e partículas. As observações livres do comportamento são exibidas, mas não entram na correspondência.

Exemplo verificado: "amarelar a frente e deixar o ângulo azul" retorna, no catálogo atual, **Branco Micronizado — HS 740 / LM 440**, frente "Amarelado sujo", ângulo "Azulado leitoso", fonte Sherwin-Williams / Lazzuril (`05.jpeg`). O código não está fixado no consultor; a base aparece porque os dois registros correspondem. Pedir frente limpa ou ângulo sem efeito leitoso a desloca para as parciais.

A consulta não altera `Pigment.characteristic`: uma base branca de ângulo azulado continua sem função de corte e não entra no formulário de adição. Correspondência documental não garante o resultado físico da mistura.

## Dosagem

`massaAtual × gramasPor100g / 100`, calculado com Decimal. Só há dose quando o coeficiente está ativo, VERIFIED, tem amostras, aprovador e data, não é demonstrativo e corresponde à organização, versão da regra, base específica, sistema, tipo de tinta e severidade. A base também deve estar ativa e não ser demonstrativa. Coeficiente genérico sem base pode existir como rascunho, mas não libera dose.

Havendo múltiplos coeficientes elegíveis, não se escolhe arbitrariamente: nenhuma dose é liberada até resolver a ambiguidade. Doses arredondadas a zero ou fora dos limites validados também são bloqueadas. Não há interpolação, dose padrão ou extrapolação de valores.

Sem dose válida: **DOSAGEM NÃO CALIBRADA**. O profissional pode registrar a quantidade efetivamente adicionada. Alterar VERIFIED cria nova versão DRAFT; verificar a nova versão exige outra operação. Valores anteriores, motivos e autoria permanecem na auditoria.

## Iterações e Banco de Cores

O backend bloqueia a linha da sessão dentro de uma transação, confere a versão enviada e calcula `massaInicial + todasAsAdições`. Cria iteração, observações, adições e auditoria; atualiza massa e versão atomicamente. Duplo envio com versão antiga é rejeitado.

A aprovação cria um snapshot da fórmula original e outro da fórmula final, além de conservar o vínculo com todas as iterações, fotos, condições, profissional, oficina e datas. A fórmula final lista componentes originais e adições individualmente, mantendo sua proveniência. A busca inclui código, montadora, modelo, ano, descrição, bases, linha e profissional.

Sessões aprovadas não aceitam novas adições. Uma sessão em andamento pode ser arquivada com motivo e histórico preservado. Para uma nova mistura, inicie outro ajuste a partir da fórmula registrada.
