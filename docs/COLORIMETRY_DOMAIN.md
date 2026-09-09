# Domínio de colorimetria

## Origem e precedência

Regras operacionais extraídas do arquivo `AULA 42 PT METODO DO MESTRE DA COLORIMETRIA LTDA.docx`, conferidas com o pedido do produto. O `Livro-de-Colorimetria.pdf` complementa iluminação, metameria, aplicação e comportamentos por vista. As imagens servem de referência conceitual; a interface usa desenhos próprios em SVG/CSS e não incorpora marcas ou artes dos anexos.

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

O motor A resolve matiz. O motor B está limitado à documentação: comportamentos por vista, aparência das partículas e condições de aplicação. Não calcula alumínio, pérola, granulometria ou flop. Fotos apenas documentam as chapas; não há reconhecimento automático de cor.

## Dosagem

`massaAtual × gramasPor100g / 100`, calculado com Decimal. Só há dose quando o coeficiente está ativo, VERIFIED, tem amostras, aprovador e data, não é demonstrativo e corresponde à organização, versão da regra, base específica, sistema, tipo de tinta e severidade. A base também deve estar ativa e não ser demonstrativa. Coeficiente genérico sem base pode existir como rascunho, mas não libera dose.

Havendo múltiplos coeficientes elegíveis, não se escolhe arbitrariamente: nenhuma dose é liberada até resolver a ambiguidade. Doses arredondadas a zero ou fora dos limites validados também são bloqueadas. Não há interpolação, dose padrão ou extrapolação de valores.

Sem dose válida: **DOSAGEM NÃO CALIBRADA**. O profissional pode registrar a quantidade efetivamente adicionada. Alterar VERIFIED cria nova versão DRAFT; verificar a nova versão exige outra operação. Valores anteriores, motivos e autoria permanecem na auditoria.

## Iterações e Banco de Cores

O backend bloqueia a linha da sessão dentro de uma transação, confere a versão enviada e calcula `massaInicial + todasAsAdições`. Cria iteração, observações, adições e auditoria; atualiza massa e versão atomicamente. Duplo envio com versão antiga é rejeitado.

A aprovação cria um snapshot da fórmula original e outro da fórmula final, além de conservar o vínculo com todas as iterações, fotos, condições, profissional, oficina e datas. A fórmula final lista componentes originais e adições individualmente, mantendo sua proveniência. A busca inclui código, montadora, modelo, ano, descrição, bases, linha e profissional.

Sessões aprovadas não aceitam novas adições. Uma sessão em andamento pode ser arquivada com motivo e histórico preservado. Para uma nova mistura, inicie outro ajuste a partir da fórmula registrada.
