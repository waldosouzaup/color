# Verificação da implementação

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
