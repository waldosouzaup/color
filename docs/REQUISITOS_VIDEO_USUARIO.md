# Requisitos esclarecidos pelo vídeo do usuário

Data da análise: 16/09/2026.

Fonte: `/home/waldo/Downloads/WhatsApp Video 2026-09-15 at 8.56.13 PM.mp4`, duração de aproximadamente 48 segundos. Foram examinados os quadros da gravação e a transcrição automática local da fala em português, cruzando-a com o texto visível. Os tempos abaixo são aproximados; as descrições da fala são paráfrases, não uma transcrição literal revisada.

Estado do projeto consultado: commit `2923398`. A implementação já evoluiu desde a análise de 15/09, feita no commit `588deb8`. Não se deve tratar todos os problemas daquela análise histórica como ainda presentes.

## 1. O que o usuário está pedindo

O usuário demonstra uma consulta em linguagem natural a um catálogo técnico previamente fornecido. Ele quer informar **o comportamento desejado na frente e no ângulo da tinta** e receber **o pigmento/base cujo cadastro corresponde às duas condições**, com nome, código e explicação.

Exemplo mostrado na conversa:

> “preciso de um pigmento que amarelo a frente e deixe o ângulo azul”

Intenção normalizada: **encontrar uma base que amarele a frente e produza comportamento azulado no ângulo, conforme a tabela cadastrada**.

O comportamento demonstrado é uma busca orientada por propriedades ópticas. A bússola continua sendo uma parte do produto, mas a fidelidade visual dela, sozinha, não atende a essa necessidade.

## 2. Evidências por trecho

| Trecho aproximado | O que aparece/é explicado | Requisito extraído |
| --- | --- | --- |
| 00:00–00:10 | O usuário mostra o envio de uma tabela e o pedido “consegue gravar esses dados?” | Manter os dados técnicos disponíveis para consultas posteriores |
| 00:10–00:22 | Percorre a tabela organizada na conversa | Consultar um catálogo estruturado, preservando nomes, códigos, sistemas e propriedades |
| 00:22–00:31 | Faz a pergunta sobre amarelar a frente e deixar o ângulo azul | Aceitar uma intenção em português com condições separadas por vista |
| 00:31–00:40 | Mostra a resposta que associa o pedido a uma base da lista | Recuperar uma base a partir das duas condições e explicar a correspondência |
| 00:39–00:46 | Destaca verbalmente “LM 440” e a resposta na tela | Devolver a identificação comercial utilizável pelo profissional |
| Final da gravação | O chatbot mostra alternativas, dicas e oferta de fórmula/quantidades | Conteúdo do chatbot, sem confirmação verbal de que essas extensões sejam requisitos do usuário |

O vídeo não mostra a bússola nem o funcionamento dos dois discos. Portanto, **não resolve a pendência sobre a mecânica do segundo disco**.

## 3. Pedido do usuário versus resposta do chatbot

A gravação tem três camadas que precisam ser distinguidas:

1. **Pedido demonstrado pelo usuário:** guardar/consultar uma tabela e localizar uma base por comportamento na frente e no ângulo.
2. **Resposta exibida pelo chatbot Dola:** indicação de base, código, descrições, aproximações e sugestões adicionais.
3. **Fonte técnica:** a tabela original que deve sustentar os dados e ser verificável no sistema.

O usuário usa o chatbot para exemplificar a experiência desejada. Isso não transforma todos os códigos, conselhos ou quantidades sugeridos pelo chatbot em dados corretos ou em requisitos aprovados. A afirmação “tudo guardado” na tela também não comprova persistência técnica; o aplicativo precisa implementar e verificar sua própria persistência.

### Divergência concreta encontrada

| Informação | Resposta do chatbot no vídeo | Tabela local `05.jpeg` e catálogo atual |
| --- | --- | --- |
| Nome | Branco Micronizado | Branco Micronizado |
| Código | **HS 739 / LM 440** | **HS 740 / LM 440** |
| Frente | Amarelo esverdeado | **Amarelado sujo** |
| Ângulo | Azulado leitoso | **Azulado leitoso** |

A tabela `05.jpeg` foi conferida visualmente. `domain/colorimetry/lazzuril-catalog.ts:128` contém a mesma linha: Branco Micronizado, HS 740 / LM 440, frente “Amarelado sujo”, ângulo “Azulado leitoso”. A linha anterior do catálogo associa HS 739 / LM 439 a Violeta.

Esta comparação é documental; não representa ensaio físico da tinta nem garantia de resultado de mistura. Ela evidencia que o sistema precisa recuperar o código correto e conservar qualificadores como **sujo** e **leitoso**, em vez de resumir tudo a “amarelo” e “azul”. A tabela local é a evidência disponível nesta análise; sua versão comercial atual não foi verificada externamente.

## 4. O que o projeto já tem e o que falta

### Estrutura disponível

- `domain/colorimetry/lazzuril-catalog.ts`: catálogo transcrito com comportamentos `FRONT`, `ANGLE` e `GENERAL`.
- `db/schema.prisma:199`: `PigmentBehavior` guarda vista, matiz, luminosidade, limpeza, partículas, notas e fonte/referência.
- `services/lazzuril-seed.ts`: carga por organização e chave comercial. Na atualização de um cadastro existente, não sobrescreve seus comportamentos.
- `features/catalogs.tsx`: biblioteca com tabela/cartões, descrições de frente/ângulo e filtros.
- `tests/lazzuril-mapping.test.ts`: protege a diferença entre comportamento óptico e função de corte do método.

### Lacuna confirmada no código consultado

A busca de `features/catalogs.tsx:51` concatena nome, código, dados e comportamentos num texto e executa `includes(search.toLowerCase())` com a frase inteira. Ela não interpreta “amarelar a frente e deixar o ângulo azul” como duas condições, nem preserva a associação entre o termo desejado e a vista no mecanismo de busca.

Para atender ao vídeo é necessário um **consultor de bases por comportamento**, aproveitando os dados existentes. Não é necessário começar criando outro catálogo ou substituir o motor da bússola.

### Distinção de domínio a preservar

- **Bússola/motor de matiz:** parte do tom e subtom observados e resolve uma regra de correção.
- **Consulta de comportamento:** parte do efeito procurado e encontra bases cujas propriedades documentadas correspondem ao pedido.
- **Dosagem:** depende de evidência/calibração própria; não é deduzida da consulta.

Um Branco Micronizado com ângulo azulado não se torna um pigmento `RED_BLUE` ou `BLUE_GREEN`. A propriedade `Pigment.characteristic` continua representando a função de corte; os filtros da nova consulta usam `PigmentBehavior`.

O limite atual do “motor B” em `COLORIMETRY_DOMAIN.md` deve ser atualizado quando a consulta estiver implementada: passa a permitir recuperação qualitativa de comportamentos documentados, permanecendo sem cálculo físico de efeito ou dosagem automática.

## 5. Fluxo proposto

1. Profissional informa a pergunta em português; pode restringir fabricante, linha e sistema.
2. Sistema mostra a intenção entendida: **Frente → amarelar; Ângulo → azular**.
3. Consulta cruza as duas condições para a **mesma base**, na oficina autenticada e no contexto selecionado.
4. Resultado informa nome, código exato do cadastro, fabricante/linha/sistema, descrição completa de cada vista e fonte.
5. Se uma condição não tiver evidência, o resultado não é apresentado como correspondente às duas. Possíveis resultados parciais aparecem separados, com a condição não atendida explícita.
6. Consulta não registra adição, não modifica massa e não inventa quantidade.

Exemplo de resposta esperada, ancorada no cadastro local:

> **Base compatível com as direções consultadas: Branco Micronizado — HS 740 / LM 440.**
>
> Frente: **Amarelado sujo**. Ângulo: **Azulado leitoso**.
>
> Fonte: tabela “Características das Cores Básicas”, Sherwin-Williams / Lazzuril, `05.jpeg`.
>
> A correspondência vem dessas descrições da tabela. A consulta não determina dosagem.

Se o usuário pedir frente amarela **limpa** ou ângulo azul **sem efeito leitoso**, essa base não pode aparecer como correspondência completa.

## 6. Complemento executável para o Claude Code

Use este bloco junto do prompt da bússola, depois de conferir o estado atual do repositório:

> Implemente a consulta de bases por comportamento óptico descrita no vídeo do usuário e neste documento. Aproveite `PigmentBehavior` e o catálogo existente; primeiro confira o que já está implementado, pois a análise anterior da bússola é histórica.
>
> A entrada principal deve aceitar português natural, incluindo o exemplo “preciso de um pigmento que amarele a frente e deixe o ângulo azul”. Disponibilize controles equivalentes para frente e ângulo e mostre a interpretação antes/junto do resultado. Pergunte somente quando a vista ou a intenção estiverem realmente ambíguas.
>
> Separe interpretação de texto, consulta e apresentação. Uma solução determinística com vocabulário explícito é adequada se cobrir os pedidos previstos; não é obrigatório contratar um LLM. Se houver LLM, ele interpreta a intenção, mas nomes, códigos, propriedades e fontes devem vir exclusivamente dos registros recuperados e validados.
>
> Modele cada condição vinculada a sua vista. Normalize termos como “amarelar/amarelado/amarelo” e “azular/azulado/azul”, conservando os descritores originais e qualificadores de limpeza, luminosidade e partículas. Não confunda pedido de mudança com diagnóstico de uma cor já observada. Não faça busca apenas por presença das palavras em qualquer campo.
>
> Combine as condições com AND na mesma base, fabricante, linha e sistema. Um registro `GENERAL` não comprova sozinho dois comportamentos específicos `FRONT` e `ANGLE`. Respeite oficina, disponibilidade e identificação de dados demonstrativos. Se o contexto comercial não estiver informado, mostre-o em cada resultado, sem tratar linhas ou códigos de fabricantes diferentes como equivalentes.
>
> Não fixe o resultado “LM 440” em código. O exemplo precisa funcionar por recuperação dos comportamentos cadastrados. Mostre todos os candidatos completos pertinentes, com ordenação explicável; se não houver, informe a ausência. Resultados parciais devem indicar exatamente qual condição está ausente ou em desacordo. Não invente percentuais de confiança.
>
> Cada resultado deve mostrar nome/código originais, descrições completas por vista, fonte e referência, além do motivo da correspondência. Preserve “Amarelado sujo” e “Azulado leitoso”. Não replique “HS 739 / LM 440” nem “Amarelo esverdeado” do chatbot: divergem da linha original conferida.
>
> Mantenha essa consulta separada das oito regras da bússola e da dosagem. Não altere `Pigment.characteristic` para acomodar comportamentos ópticos. Não faça uma base sem função de corte entrar artificialmente numa correção validada; eventual integração de uma nova classe de adição ao fluxo exige contrato próprio e testes. Nesta entrega, a consulta deve funcionar sem gravar uma correção.
>
> Atualize a ajuda e o contrato de domínio para distinguir consulta qualitativa, diagnóstico pelo método e cálculo de dose. Não interprete a oferta de fórmula/quantidades feita pelo chatbot como pedido de implementação.
>
> Adicione testes significativos: o exemplo recupera a base correta; código/nome são os do cadastro; vistas invertidas não retornam a mesma correspondência indevidamente; restrição “limpo” não aceita “sujo”; restrição “sem leitoso” não aceita “leitoso”; ausência de uma vista não vira prova; fontes contraditórias são sinalizadas; bases de outra oficina não aparecem; demonstrações não são apresentadas como bases reais; ausência de resultado não fabrica recomendação; consulta não gera dose nem grava adição.
>
> Verifique no navegador em celular a pergunta do vídeo, os critérios interpretados e o resultado com fonte. Entregue arquivos alterados, testes executados e limitações de linguagem suportada. Não execute alterações ou testes contra produção.

## 7. Escopo desta análise

Esta rodada registra o requisito e atualiza o direcionamento do prompt. Não altera a aplicação, o catálogo ou o banco. Não houve validação física de pigmentos nem verificação de dados no banco de produção. A transcrição foi feita localmente; o vídeo não foi enviado a serviço externo de transcrição.
