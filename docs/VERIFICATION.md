# Verificação da implementação

## Execução de 16 de setembro de 2026 — consultor de comportamento

Consulta de bases por comportamento na frente e no ângulo, pedida no vídeo do
usuário ([REQUISITOS_VIDEO_USUARIO.md](REQUISITOS_VIDEO_USUARIO.md)). Contrato em
[COLORIMETRY_DOMAIN.md](COLORIMETRY_DOMAIN.md#consulta-qualitativa-de-comportamento)
e decisão em [ADR-005](adr/ADR-005-behavior-query.md).

### Onde isso foi executado

A porta 3004 continuava ocupada pelo servidor de desenvolvimento apontado para o
**Supabase de produção**. Nada foi executado contra ele. Integração, navegador e
build usaram PostgreSQL local (`127.0.0.1:5433`, `.env.local-db`); navegador e
build rodaram numa cópia isolada do projeto em `http://localhost:3005` com
`next dev --webpack`. Nenhum seed ou migração foi executado nesta tarefa: o
banco local já tinha o catálogo (82 bases reais e 6 demonstrativas).

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | Passou, sem avisos |
| `pnpm typecheck` | Passou |
| `pnpm test` | 117 testes em 8 arquivos passaram (40 novos: interpretação e correspondência) |
| `pnpm test:db` (banco local) | 63 verificações passaram (24 novas do consultor) |
| `pnpm build` (cópia isolada) | Build de produção concluído |
| `pnpm test:e2e` (cópia isolada, `--timeout=300000`) | 16 cenários passaram (5 novos do consultor) |

### O que os testes comprovam

- As formulações do vídeo ("amarele a frente e deixe o ângulo azul", "amarelar a
  frente e azular o ângulo", "frente amarelada e ângulo azulado", "quero o ângulo
  azul e a frente amarela", sem acento e em caixa alta) viram
  `Frente: amarelar · Ângulo: azular`; a frase invertida inverte as vistas.
- A pergunta do vídeo recupera, no catálogo e no banco, **Branco Micronizado —
  HS 740 / LM 440**, frente "Amarelado sujo", ângulo "Azulado leitoso", fonte
  Sherwin-Williams / Lazzuril (`05.jpeg`). Com código trocado a mesma base volta;
  com a frente editada ela sai e uma base fictícia com os mesmos comportamentos
  entra. Os módulos do consultor não contêm o código nem o nome da base.
- "Frente amarelo esverdeado" (resposta do chatbot) não é correspondência completa;
  "frente limpa" e "ângulo sem efeito leitoso" deslocam a base para as parciais com
  o motivo.
- Condição de frente não é satisfeita pelo ângulo; GENERAL não comprova vista;
  vista ausente, descrição vazia e qualificador não escrito ficam "sem
  informação"; registros que discordam ficam "divergente".
- No banco: outra oficina não aparece, base inativa não entra, demonstrativa fica
  fora por padrão e identificada quando incluída, filtros de fabricante, linha e
  sistema restringem a consulta, edição local de comportamento é usada e
  sobrevive a nova carga do catálogo. Auditoria, pigmentos, comportamentos,
  sessões, iterações, adições, fórmulas e coeficientes ficam idênticos antes e
  depois das consultas; a resposta não tem campo de dose.
- No navegador: pergunta do vídeo com código, comportamentos e fonte; exemplo
  clicável; ajuste de "Limpeza" sem reescrever; observação da tinta pede
  confirmação e oferece a bússola; comportamento sem vista oferece "Aplicar na
  frente/no ângulo"; atalho da bússola abre o consultor com foco no campo; sem
  rolagem horizontal em 375 px.

Evidência visual em `test-results/consultor/` (diretório ignorado): resultado,
parcial "limpo" e observação em 1440 e 375 px, temas claro e escuro, e o
cabeçalho da bússola com o atalho. Nenhum erro de console nessas capturas. Por
teclado, a ordem é campo → exemplo → ajuste de critérios → filtros, com contorno
de foco de 2 px, e Enter no exemplo executa a consulta.

### Ajuste na suíte de navegador

A primeira execução completa falhou em dois cenários de `workflow.spec.ts` com
"Muitas tentativas de entrada": `/sign-in/email` aceita cinco tentativas por
minuto e o novo arquivo acrescentava mais um login. O limite da aplicação não foi
alterado. Os cenários que autenticam pela API (bússola, catálogo e consultor)
passaram a compartilhar uma sessão em `tests/e2e/admin-session.ts`, conferida no
servidor antes do reuso. Na execução seguinte os 16 cenários passaram.

### Limitações desta execução

- `docs/MANUAL_DO_USUARIO.md` foi atualizado; o HTML e o PDF do manual não foram
  regenerados (`scripts/manual-pdf.sh`).
- `pnpm test:supabase` e `pnpm test:e2e:production` não foram executados; nada
  foi apontado para produção.
- O consultor não foi publicado nem verificado no banco de produção.

## Execução de 16 de setembro de 2026 — catálogo Lazzuril / Sherwin-Williams

Conferência da tabela "Características das Cores Básicas" (`05.jpeg`) contra
`domain/colorimetry/lazzuril-catalog.ts`, linha a linha, com a imagem ampliada em
seis faixas.

| Bloco | Linhas na imagem | Linhas no catálogo | Resultado |
| --- | --- | --- | --- |
| Poliéster (Frente + Ângulo) | 60 | 60 | conferem, inclusive nome, código e as duas características |
| Poliuretano (característica única) | 22 | 22 | conferem |

Particularidades do original que foram preservadas em vez de "corrigidas":
`HS 700` aparece em Branco Neve e em Branco; `FC 608` aparece em Azul e em Azul
Escuro; o bloco de poliuretano tem uma coluna única de característica, por isso
é modelado como vista `GENERAL`.

### Correções aplicadas

A coluna `characteristic` do pigmento é a **função de corte do método** e decide
quais bases o formulário de adição oferece. Três vínculos descreviam
comportamento óptico, não função de corte, e foram removidos:

| Base | Vínculo anterior | Motivo da remoção |
| --- | --- | --- |
| Vermelho Rubi (HS 717 / LM 417) | `RED_BLUE` | `RED_BLUE` é o azul avermelhado do método; a base é um vermelho de ângulo azulado |
| Vermelho Rubi (LP 528) | `RED_BLUE` | idem |
| Ocre (LP 505 / LL 135 / LS 205 / FC 605) | `RED_OXIDE` | "amarelo óxido" não tem identificador equivalente no domínio |

`tests/lazzuril-mapping.test.ts` passou a exigir coerência entre a base e a
função de corte e registra a cobertura atual, incluindo a lacuna conhecida de
`RED_SUPPORT`, que a tabela não fornece.

### Comandos desta execução

| Comando | Resultado |
| --- | --- |
| `pnpm test` | 77 testes em 6 arquivos passaram |
| `pnpm typecheck` | Passou |
| `pnpm lint` | Passou |
| `pnpm db:seed` (banco local) | 82 bases carregadas: 88 pigmentos no total (com as 6 DEMO), 148 comportamentos — 60 FRONT, 60 ANGLE e 28 GENERAL |
| `pnpm test:e2e` | 11 cenários passaram, com `--timeout=300000` |

Evidência visual em `test-results/catalogo/`: biblioteca de pigmentos em tabela
(claro, escuro e 375 px), busca por `HS 717`, filtro de poliuretano e filtro da
família Pérola.

### Conferência completa das cores (16/09)

A pergunta "todas as cores estão cadastradas?" foi respondida por três métodos,
porque cada um prova uma coisa diferente:

| Método | O que prova | Resultado |
| --- | --- | --- |
| Contagem de faixas de texto por pixel na imagem | Quantas linhas de dados a tabela tem | 60 de poliéster e 22 de poliuretano |
| Leitura da imagem ampliada em seis faixas | Conteúdo de cada linha | 82 linhas conferidas, sem divergência de texto |
| `pnpm catalog:check` | O que está registrado no banco | 82/82 no local e 82/82 em produção |

Não há OCR neste ambiente: a conferência do texto foi leitura sobre a imagem
ampliada. A contagem de linhas e a comparação catálogo × banco são automáticas.
Relatório linha a linha em `test-results/catalogo/conferencia-linha-a-linha.md`.

### Correções aplicadas em produção

O verificador encontrou, em produção, as três mesmas confusões entre
comportamento óptico e função de corte que já haviam sido corrigidas no código.
Elas foram corrigidas na base, registro a registro:

| Base | Antes | Depois |
| --- | --- | --- |
| `HS 717 / LM 417` Vermelho Rubi | `RED_BLUE` | sem função de corte |
| `LP 528` Vermelho Rubi | `RED_BLUE` | sem função de corte |
| `LP 505 / LL 135 / LS 205 / FC 605` Ocre | `RED_OXIDE` | sem função de corte |

Conferido depois da escrita: os três voltam `(sem função)` e a oficina tem 82
bases reais ativas.

### Bases demonstrativas em produção: resolvido

Produção tinha **sete bases demonstrativas ativas**, que apareciam no seletor de
correção como se fossem reais. Duas eram especialmente enganosas:
`DEMO-RED_OXIDE` chamava-se "AMARELO AVERMELHADO— DEMO" com função de óxido
vermelho, e `DEMO-GREEN_BLUE` chamava-se apenas "VERDE AZULADO", sem marcação
nenhuma.

As três tentativas de escrita em lote a partir da sessão de trabalho foram
barradas pelas regras de permissão do ambiente (implantação, exclusão em massa e
alteração de recurso compartilhado); só a correção pontual dos três vínculos foi
autorizada. A limpeza foi então executada pelo responsável, com
`scripts/demo-cleanup.ts --apply`, e conferida em seguida:

| Medida | Resultado |
| --- | --- |
| `catalog-check` da oficina | "catálogo íntegro: nada faltando nem divergente", saída 0 |
| Bases reais ativas | 82 |
| Bases demonstrativas ativas | 0 |
| Bases demonstrativas preservadas, inativas | 7 (nada foi apagado) |
| Função de corte entre bases ativas | `RED_BLUE` 5 · `LEMON_YELLOW` 4 · `VIOLET` 4 · `BLUE_GREEN` 3 · `RED_OXIDE` 2 |
| `DEMO-GREEN_BLUE` | renomeada para "VERDE AZULADO — DADO DEMONSTRATIVO", inativa |

A distribuição acima é exatamente a do catálogo: `RED_SUPPORT` fica em zero
porque a tabela do fabricante não traz base de suporte vermelho — a adição de
suporte continua sendo registrada manualmente.

### Limitação do carregamento inicial

O catálogo não foi carregado em produção por esta sessão — quando fui conferir,
ele já estava lá, com as três divergências acima. Duas coisas atrapalharam a
execução própria, em momentos diferentes:

1. O pooler do Supabase recusou conexão em 6543 e em 5432 durante parte da
   execução, voltando a responder depois. A instabilidade é intermitente e vale
   conferir antes de qualquer carga.
2. A tentativa de executar a carga a partir desta sessão foi barrada por uma
   regra de permissão do ambiente de trabalho, que classifica escrita em
   produção como operação a ser autorizada pelo responsável.

Em desenvolvimento o catálogo entra pelo `pnpm db:seed`. Em produção, o caminho
é `pnpm production:catalog <organizationId>`, que usa o mesmo upsert idempotente
e não cria coeficiente de dosagem. Sem argumento, o comando lista as oficinas
ativas em vez de adivinhar o destino.

## Execução de 15 de setembro de 2026 — reconstrução da bússola

Node.js 22.23.2, pnpm 10.33.4 (via Corepack), PostgreSQL local persistente em
`127.0.0.1:5433`, ambiente `.env.local-db`.

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | Passou, sem avisos |
| `pnpm typecheck` | Passou, TypeScript strict |
| `pnpm test` | 63 testes em 4 arquivos passaram (domínio, bússola, configuração e limites de entrada) |
| `pnpm test:db` | 39 verificações de integração passaram (massa, concorrência, versões, aprovação, RBAC e isolamento) |
| `pnpm build` | Build de produção concluído |
| `pnpm test:e2e` | 8 cenários passaram, com `--timeout=300000` (ver limitações) |

### Onde isso foi executado

A porta 3004 já estava ocupada por um servidor de desenvolvimento apontando para
o **Supabase de produção**. Nada foi executado contra ele: nem teste, nem seed,
nem captura. Toda a verificação usou uma cópia isolada do projeto servida em
`http://localhost:3005` com `.env.local-db` e PostgreSQL local.

Nessa cópia o `next dev` roda com `--webpack`, porque o Turbopack recusa o
`node_modules` acessado por symlink. O `pnpm build` também foi executado em cópia
isolada, para não interferir no `.next` do servidor em uso.

### Evidências visuais

Capturas em `test-results/bussola/` (diretório ignorado no versionamento):

- `antes/` — implementação anterior em 375, 768 e 1440 px, temas claro e escuro,
  página e modal. Mostra o mostrador metálico escuro, oito esferas, agulha,
  graduação de graus e lente central.
- `depois/` — mesma matriz de capturas com o disco reconstruído.
- `discos/` — disco cromático isolado (página e modal) e segundo disco.
- `comparacao/` — referência e implementação normalizadas, imagem lado a lado e
  diferença absoluta.

Comparação normalizada (elipse da captura corrigida, centro e raio alinhados):

| Medida | Referência | Implementação | Tolerância adotada |
| --- | --- | --- | --- |
| Limites angulares dos 12 setores | desvio máximo 0,6° | desvio máximo 0,8° | 2° |
| Anel interno | 0,681 R | 0,665 R | inspeção visual |
| Diferença média de pixel | — | 29,8 | apoio, não critério |

As tolerâncias são critérios de engenharia propostos nesta tarefa, não medidas
fornecidas pelo autor da imagem. A diferença média de pixel serve para orientar a
inspeção: ela inclui a marca d'água e o serrilhado da fotografia original.

### Evidências funcionais desta execução

- Doze setores, quatro tons fundamentais e oito direções, com limites, centros,
  passagem 0°/360°, ângulos negativos, voltas completas e menor caminho circular
  cobertos por teste de propriedades.
- Verde azulado exibe **Violeta + Óxido vermelho — ambos obrigatórios** na
  página, no modal e no diagnóstico, e prepara as duas adições no fluxo.
- Alternativa exibe “ou” e admite exatamente uma escolha; suporte continua
  opcional e separado do corte principal.
- Tom fundamental seleciona família e não habilita “Usar neste ajuste”.
- Clique, arraste e teclado chegam ao mesmo resultado; a seleção sobrevive a
  abrir e fechar o modal.
- Página e modal montados juntos não repetem nenhum id de SVG.
- Fluxo completo de ajuste, isolamento entre oficinas, rejeição de combinações
  inválidas, origem externa e CSP continuam passando.
- Dez telas em 375, 768, 1024 e 1440 px sem overflow horizontal.

### Limitações desta execução

1. O cenário de responsividade faz 40 navegações; no servidor `--webpack` da
   cópia isolada isso leva cerca de 1,9 min e estoura o teto padrão de 90 s do
   Playwright. Com `--timeout=300000` ele passa. Não foi possível medir o mesmo
   cenário com Turbopack neste ambiente, então o teto padrão não foi reavaliado.
2. `/sign-in/email` aceita cinco tentativas por minuto. A suíte passou a limpar
   os contadores antes da execução (`tests/e2e/global-setup.ts`, só contra
   endereço local) e o cenário da bússola autentica pela API.
3. O cenário de isolamento estava quebrado desde `f4b3a2c`: a listagem do
   workspace deixou de trazer chapas e o teste ainda as procurava ali. Ele passou
   a consultar o detalhe da sessão. A falha é anterior a esta tarefa.
4. `pnpm test:supabase` e `pnpm test:e2e:production` não foram executados: não há
   acesso remoto nesta tarefa e nada foi apontado para produção.

---

## Execução de 9 de setembro de 2026 — registro histórico

Executada com Node.js 22.23.2 e PostgreSQL local persistente. Os números abaixo
são o registro daquela data e **não** foram reexecutados agora.

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | Passou, sem avisos de lint |
| `pnpm typecheck` | Passou, TypeScript strict |
| `pnpm test` | 38 testes de domínio, configuração e limites de entrada passaram |
| `pnpm test:db` | 39 verificações de integração passaram |
| `pnpm test:e2e` | 4 cenários passaram |
| `pnpm test:supabase` | Migrações em schema privado, fluxo de integração, bootstrap e permissões passaram em PostgreSQL local |
| `pnpm test:e2e:production` | 5 cenários passaram no servidor standalone otimizado |
| `pnpm build` | Build de produção concluído |
| `pnpm audit --prod` | Nenhuma vulnerabilidade conhecida reportada nas dependências de execução |

- Fluxo em celular de 375 px: login, fórmula Chevrolet de 500 g, tinta metálica,
  chapa com fotografia, AZUL → ESVERDEADO, indicação de óxido vermelho ou
  violeta, dosagem não calibrada, adição manual de 1 g, nova chapa, aprovação e
  busca/reabertura no Banco de Cores.
- Massa em PostgreSQL: 500 → 501 → 501,50 g com duas adições separadas.
- API rejeita os quatro pares inválidos exigidos, requisições sem autenticação e
  escritas de origem externa.
- Um profissional de outra organização não vê fórmulas, sessões ou cores da
  primeira; não acessa sua foto; não diagnostica sua sessão.
- Coeficiente em teste não libera dose; VERIFIED válido libera a fixture
  matemática; alteração de VERIFIED preserva a versão anterior e cria DRAFT.
- Schema `colorimetry` criado por migrações em banco efêmero; papéis `anon` e
  `authenticated` sem acesso às tabelas.
- Bootstrap cria administrador com hash de senha, sem pigmentos ou coeficientes
  demonstrativos.
- `/api/health` e `/api/ready` retornam 200; CSP com nonce por resposta.

O [CI do primeiro commit](https://github.com/waldosouzaup/color/actions/runs/34390959347)
passou no GitHub, incluindo migrações, lint, tipos, testes unitários, integração
PostgreSQL, schema privado, bootstrap, build e cenários de navegador. O workflow
também constrói o Dockerfile e executa `scripts/test-container.sh`.

O procedimento e os dados necessários para produção estão em
[PRODUCTION_SUPABASE.md](PRODUCTION_SUPABASE.md).
