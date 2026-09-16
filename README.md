# Mestre da Colorimetria

Aplicação de colorimetria automotiva para registrar fórmulas, observar chapas, diagnosticar pelo Método do Mestre, documentar correções e guardar cores aprovadas. **Não inventa dosagens nem fornece fórmulas proprietárias.**

**Produção com Supabase:** consulte [PRODUCTION_SUPABASE.md](docs/PRODUCTION_SUPABASE.md) para schema privado, conexões, bootstrap e implantação.

## Stack e arquitetura

Next.js App Router, React, TypeScript strict, componentes HTML acessíveis com CSS responsivo, PostgreSQL, Prisma 6, Zod, Better Auth, Decimal.js, Vitest e Playwright. CSS próprio evita dependência adicional de uma biblioteca visual. `embedded-postgres` é uma alternativa de desenvolvimento, usada quando Docker não está disponível; a aplicação sempre usa PostgreSQL real.

```text
app/           páginas e endpoints autenticados
components/    componentes acessíveis e a bússola em SVG (disco de doze posições)
features/      bancada, formulários, diagnóstico, sessão e administração
domain/        tipos, matriz, regras e matemática decimal sem React
services/      casos de uso, autorização, validação e transações
repositories/ consultas restritas à organização
lib/          Prisma, autenticação, transporte e tipos
db/           schema, migração e seed
tests/        domínio, integração PostgreSQL e E2E
docs/         domínio, ADRs e contratos CSV
```

## Instalação

Pré-requisitos: Node.js 22.12+ e pnpm 10. Em ambiente sem pnpm, instale-o com `npm install -g pnpm@10` ou use Corepack conforme sua instalação do Node.

```sh
pnpm install
cp .env.example .env
```

Edite `.env` antes de executar. Defina um segredo aleatório de pelo menos 32 caracteres em `BETTER_AUTH_SECRET`, URL pública em `BETTER_AUTH_URL`, credenciais do banco e `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (mínimo 12 caracteres). Nunca publique esse arquivo. Gere um segredo com `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

Se a porta 3000 já estiver ocupada, altere **PORT e BETTER_AUTH_URL juntos**. Neste workspace, a instância local utiliza `http://localhost:3004`. Os scripts dev/start carregam `.env` antes de iniciar o Next.js; `start` usa o artefato standalone gerado pelo build.

`SEED_ADMIN_NAME` e `SEED_ORGANIZATION` personalizam a oficina inicial. `ALLOW_DEMO_SEED=true` cria seis bases fictícias rotuladas, apenas fora de produção. Não cria coeficientes. O seed é idempotente e não troca senhas de usuários existentes.

## PostgreSQL com Docker

```sh
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

O Compose publica PostgreSQL somente em `127.0.0.1:5433` e mantém um volume persistente. O usuário e banco padrão são `color`; a senha local padrão deve ser substituída em ambientes compartilhados. `DATABASE_URL` e `DIRECT_URL` precisam corresponder à configuração do Compose.

### Alternativa local sem Docker

```sh
pnpm db:local
```

Deixe esse terminal aberto. Em outro terminal, execute generate, migrate, seed e dev como acima. O cluster persiste em `.local-postgres/`; Ctrl+C encerra sem apagar dados. Não use Docker e o cluster embutido simultaneamente na mesma porta. Os binários de PostgreSQL são uma dependência de desenvolvimento; para produção use um serviço PostgreSQL administrado.

Abra `http://localhost:3000/login` com as credenciais configuradas no seed. O acesso não usa uma senha fixa no código. Cadastro público está desabilitado. Administradores cadastram profissionais em Configurações. Novas organizações são provisionadas administrativamente no banco; não há cadastro público multiempresa.

## Execução e build

```sh
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:db
pnpm build
pnpm start
```

`typecheck` gera o Prisma Client antes de verificar tipos. `build` usa Webpack estável e não faz chamadas ao banco durante geração de páginas; páginas da oficina são dinâmicas. A migração SQL está versionada em `db/migrations` e é aplicada por `prisma migrate deploy`.

## Testes de navegador

Com PostgreSQL iniciado, migração e seed aplicados:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

⚠️ Os testes leem `BETTER_AUTH_URL` e `DATABASE_URL` do ambiente. Rode-os sempre
com o arquivo de ambiente local (por exemplo `set -a; . ./.env.local-db; set +a`)
e confira que `BETTER_AUTH_URL` aponta para o servidor de desenvolvimento em uso.
Nunca execute testes, seed ou reset com essas variáveis apontando para produção —
`reuseExistingServer` aproveita qualquer servidor já ouvindo naquela porta.

Se Google Chrome estiver em `/usr/bin/google-chrome`, será usado automaticamente. Em outro ambiente, configure `PLAYWRIGHT_CHROMIUM_EXECUTABLE` ou deixe o Playwright usar o Chromium instalado. `BETTER_AUTH_URL` deve corresponder à porta do servidor. O Playwright inicia `pnpm dev` via npm quando não há servidor e reutiliza um servidor existente.

O cenário E2E efetua login, cria uma fórmula de 500 g, seleciona metálica, registra chapa com fotografia, analisa AZUL → ESVERDEADO, verifica ausência de dosagem, adiciona 1 g, registra nova chapa, aprova frente/ângulo, busca no banco e reabre o histórico. Os registros E2E são claramente demonstrativos. Testes adicionais cobrem API inválida, origem externa e ausência de overflow em 375, 768, 1024 e 1440 px.

`test:db` cria duas organizações efêmeras, testa massa 500 → 501 → 501,50, concorrência, bloqueios de sequência, versão de coeficientes e regras, autorização e isolamento; remove somente seus próprios registros no `finally`. Não execute testes contra uma base de produção.

## Regras e dosagem

O motor independente está em `domain/colorimetry/`. Seus testes cobrem as oito regras, combinações inválidas, alternativas/combinações, pesos acumulados e matemática de dosagem. Detalhes em [COLORIMETRY_DOMAIN.md](docs/COLORIMETRY_DOMAIN.md).

A geometria da bússola fica em `domain/compass/`, também sem React: doze setores de 30°, quatro tons fundamentais e oito direções. O contrato visual, as medidas tiradas da referência e as divergências entre a arte impressa e a matriz estão em [BUSSOLA_VISUAL.md](docs/BUSSOLA_VISUAL.md).

Recomendação quantitativa exige coeficiente VERIFIED, ativo, aprovado, não demonstrativo e correspondente à base, regra, sistema, tipo de tinta, organização e severidade. Sem ele, **DOSAGEM NÃO CALIBRADA** e adição manual. O exemplo 0,20 g / 100 g aparece apenas como fixture matemática. Não representa um coeficiente real.

Alterações de coeficientes verificados geram nova versão em DRAFT. A revalidação é outra operação. A auditoria conserva autoria, motivo, antes/depois e data. Edição de regra cria uma versão privada da oficina; regras e doses antigas permanecem nos snapshots das iterações.

## Banco de Cores e relatório

A aprovação encerra a sessão e salva snapshots de fórmula original/final, massa, profissional e oficina. Fotos, iluminação, condições e adições permanecem vinculadas. Busca por código, montadora, modelo, ano, descrição, base, linha e profissional. Fórmulas aprovadas não são sobrescritas.

O botão Relatório abre a impressão do navegador com uma folha própria, sem a navegação. Pode-se escolher “Salvar como PDF” na caixa de impressão. Inclui fórmula inicial, correções, massa final, avaliações, responsável e chapas. Geração programática de PDF fica para uma etapa posterior.

## Segurança e operação

- Sessões persistentes, hash de senha pelo Better Auth, cookies protegidos pelo framework e verificação de atividade da organização em cada acesso.
- Toda referência é conferida contra a organização autenticada; filtros não dependem de organização enviada pelo cliente.
- Escritas exigem origem correspondente a `BETTER_AUTH_URL`; login tem rate limit. Os limitadores de autenticação e de operações usam PostgreSQL compartilhado entre instâncias.
- Fotografias PNG/JPEG/WebP de até 2 MB, com assinatura binária validada, guardadas no banco e servidas por endpoint privado.
- Prisma parametriza SQL; conteúdo textual é renderizado com escaping do React; sem HTML arbitrário ou URLs de imagens fornecidas pelo usuário.
- Logs técnicos de erro ficam no servidor; respostas HTTP não expõem detalhes do banco.
- Use HTTPS em produção, segredo aleatório, acesso restrito ao banco e backup periódico que inclua fotografias. Os binários locais e credenciais de seed são para desenvolvimento.

## Limitações explícitas

- Motor de efeito documenta frente, ângulo, partículas, alumínio e pérola; não gera regras quantitativas não comprovadas.
- Sem leitura colorimétrica automática de foto, espectrofotômetro virtual, IA de dosagem, scraping ou API falsa de fabricante.
- Links oficiais configuráveis abrem em outra aba; `FormulaProvider`/`ManualFormulaProvider` são contratos para integração autorizada futura.
- Importadores CSV e PDF programático são futuros; contratos em [IMPORTS.md](docs/IMPORTS.md).
- A biblioteca traz o catálogo **Lazzuril / Sherwin-Williams** transcrito da tabela "Características das Cores Básicas": 60 bases de poliéster com comportamento separado de frente e ângulo e 22 de poliuretano com característica única, em `domain/colorimetry/lazzuril-catalog.ts`. Cada comportamento carrega fonte e referência próprias. São descrições ópticas do fabricante, não coeficientes: continuam sem liberar dosagem. Bases DEMO seguem disponíveis apenas fora de produção.
- Bootstrap da oficina carrega o conjunto de registros da organização. Para bases grandes, implementar paginação/consulta no servidor e armazenamento de fotos dedicado.
- Há troca de senha na conta e redefinição administrativa. Recuperação/convite por e-mail não estão configurados. O bootstrap de produção provisiona a oficina e o administrador.
- Administração das saídas de regras usa editor JSON técnico validado. Uma interface visual mais especializada pode substituí-lo sem mudar o domínio.
- O isolamento por oficina é no backend. No Supabase, o schema privado também revoga acesso dos papéis públicos. Não há políticas RLS por oficina.

Decisões: [ADRs](docs/adr/). Referências de integração utilizadas: [Next.js](https://nextjs.org/docs), [Better Auth / Prisma](https://better-auth.com/docs/adapters/prisma) e [Prisma 6](https://docs.prisma.io/docs/orm/v6/reference/system-requirements).
