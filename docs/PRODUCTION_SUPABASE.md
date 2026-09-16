# Produção com Supabase

O Supabase fornece o PostgreSQL gerenciado. Next.js, Prisma e Better Auth executam no servidor. O navegador usa somente a API autenticada da aplicação; nenhuma chave pública ou service_role do Supabase é necessária. A autenticação permanece no Better Auth.

## Conexões e schema privado

No painel Supabase, abra **Connect** e copie as conexões do projeto. Use `.env.production.example` como referência para preencher `.env.production.local`. As duas conexões devem apontar ao mesmo projeto, ao banco indicado pelo painel e ao schema `colorimetry`.

| Variável                     | Finalidade                                             |
| ---------------------------- | ------------------------------------------------------ |
| DATABASE_URL                 | Runtime do Prisma; pooler transacional para serverless |
| DIRECT_URL                   | Migrações; conexão direta ou pooler de sessão          |
| BETTER_AUTH_URL              | Origem HTTPS pública, sem caminho adicional            |
| BETTER_AUTH_SECRET           | Segredo aleatório com pelo menos 32 caracteres         |
| APP_ENV                      | `production`                                           |
| ALLOW_DEMO_SEED              | `false`                                                |
| PRODUCTION_ORGANIZATION_NAME | Nome real da oficina inicial                           |
| PRODUCTION_ADMIN_NAME        | Nome do responsável                                    |
| PRODUCTION_ADMIN_EMAIL       | E-mail real do administrador                           |
| PRODUCTION_ADMIN_PASSWORD    | Senha inicial com pelo menos 12 caracteres             |

URLs PostgreSQL precisam de `schema=colorimetry&sslmode=require&sslaccept=strict`. Codifique caracteres especiais da senha como componente de URL. Nunca use variáveis NEXT_PUBLIC para essas conexões.

Para serverless, use a porta 6543 e `pgbouncer=true`. Para processo Node persistente, pode-se usar o pooler de sessão na porta 5432. Migrações sempre usam conexão direta ou sessão, nunca transação. A conexão direta pode exigir IPv6; o pooler de sessão atende hosts IPv4. [Conexões do Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

O exemplo limita o pool do runtime a três conexões por instância. Dimensione esse valor conforme plano, tráfego e número de instâncias. Não desative a validação TLS; se necessário, instale a CA fornecida pelo projeto no ambiente/conector. A conexão real deve ser testada antes da publicação.

Não exponha `colorimetry` no Data API. A migração revoga acesso de PUBLIC, anon e authenticated ao schema, tabelas, sequências e privilégios padrão. O isolamento entre oficinas permanece nos serviços/repositórios; essas revogações não são políticas RLS por oficina. As URLs devem usar uma conta de servidor com acesso ao schema. Para uma conta de runtime dedicada, limite-a ao DML necessário nesse schema; use outra conta com DDL para migrações.

## Preparar o banco real

```sh
pnpm install --frozen-lockfile
pnpm production:check
pnpm production:migrate
pnpm production:verify
pnpm production:bootstrap
```

Os comandos leem `.env.production.local` se presente, ou usam variáveis do ambiente. O check valida os parâmetros sem imprimir senhas. O verify conecta e verifica tabelas e permissões. O bootstrap cria oficina, administrador, oito regras e auditoria; não cria bases demonstrativas ou coeficientes.

## Catálogo do fabricante

```sh
pnpm production:catalog                    # lista as oficinas ativas
pnpm production:catalog <organizationId>   # carrega o catálogo naquela oficina
```

Carrega as bases da tabela "Características das Cores Básicas" (60 de poliéster com frente e ângulo, 22 de poliuretano) na oficina indicada. O upsert usa oficina + fabricante + linha + código: repetir o comando não duplica base nem apaga comportamento editado na interface. Nenhum coeficiente de dosagem é criado — a tabela descreve comportamento óptico, não quantidade.

Para remover a carga, apague os comportamentos e depois as bases das linhas `Lazzuril Base Poliéster` e `Lazzudur Poliuretano` da oficina.

### Conferência e limpeza

```sh
pnpm catalog:check [oficina]                 # compara catálogo × banco, só leitura
pnpm demo:deactivate [oficina]               # simula a desativação de bases demonstrativas
pnpm demo:deactivate [oficina] --apply       # aplica
```

`catalog:check` aponta base faltando, divergência de nome, sistema, família, função de corte ou comportamento, e base da linha do fabricante fora do catálogo. Em produção ele também **reprova** quando existe base demonstrativa ativa, porque ela entra no seletor de correção como se fosse base real; fora de produção apenas avisa.

`demo:deactivate` desativa — não apaga — as bases demonstrativas, preservando histórico e mantendo a ação reversível. Nomes sem marcação recebem o aviso `— DADO DEMONSTRATIVO`. A simulação é o padrão; `--apply` é obrigatório para escrever.

Os dois comandos leem as variáveis do ambiente. Para produção, exporte `.env.production.local` antes:

```sh
set -a && . ./.env.production.local && set +a
pnpm catalog:check development
```

### Sem o pnpm no PATH

Este projeto fixa o gerenciador em `package.json`, mas a máquina pode não ter o binário disponível. Nesse caso, use o Corepack ou chame o `tsx` local direto — as duas formas dispensam instalação global:

```sh
corepack pnpm@10.33.4 exec tsx scripts/demo-cleanup.ts development --apply
# ou
node node_modules/tsx/dist/cli.mjs scripts/demo-cleanup.ts development --apply
```

O mesmo vale para `scripts/catalog-check.ts`. Para deixar o `pnpm` disponível de vez: `corepack enable` ou `npm install -g pnpm@10`.

Repetir o bootstrap preserva a senha de um administrador existente na organização informada. O seed de desenvolvimento está bloqueado em produção. Não execute testes, migrate reset ou db:seed contra a base real.

Após o bootstrap, retire PRODUCTION_ADMIN_PASSWORD das variáveis do runtime. Alteração de senha está em **Minha conta**. Um administrador pode redefinir a senha de outro usuário em Configurações, com revogação de sessões e auditoria. Envio/recuperação de senha por e-mail exige uma integração futura; não foi configurado um serviço de e-mail fictício.

## Hospedagem Docker em servidor

O Dockerfile produz Next.js standalone, sem secrets na imagem e com usuário sem privilégios. O Compose de produção usa Supabase externo e Caddy para HTTPS. A porta da aplicação fica acessível somente na rede interna dos containers.

Depois de apontar o DNS ao servidor e disponibilizar portas 80/443:

```sh
APP_DOMAIN=seu.dominio.com docker compose -f deploy/compose.yml up -d --build
APP_DOMAIN=seu.dominio.com docker compose -f deploy/compose.yml ps
```

APP_DOMAIN precisa coincidir com BETTER_AUTH_URL. O container da aplicação tem filesystem somente leitura, temporários limitados e capabilities removidas. Certificados HTTPS persistem nos volumes do Caddy. O CI constrói a imagem e testa conexão ao banco, login e API autenticada nessas condições com dados efêmeros. O Compose e o HTTPS ainda precisam ser iniciados no servidor escolhido.

## Hospedagem Vercel

Importe o repositório Next.js, configure as variáveis no ambiente Production e use o pooler transacional em DATABASE_URL. Aplique migrações numa etapa controlada antes de publicar. Não rode migrações no início de cada função. `vercel.json` define os comandos de instalação e build.

BETTER_AUTH_URL precisa corresponder ao domínio final. Use projetos/variáveis separados para previews. Fotografias já são persistidas no PostgreSQL; a aplicação não depende de um diretório local de uploads.

## Validação após publicação

- `/api/health` indica processo ativo. `/api/ready` verifica conexão e acesso à tabela; falhas retornam 503 sem detalhes do banco.
- Conferir login, troca de senha, criação de profissional e isolamento de oficinas.
- Executar ajuste autorizado com fórmula, chapa, correção, nova chapa e aprovação. Sem coeficiente validado deve aparecer DOSAGEM NÃO CALIBRADA.
- Conferir HTTPS, cookies Secure, domínio da autenticação e bloqueio do schema na API pública.

O CSP usa nonce por resposta e renderização dinâmica, com unsafe-eval limitado ao desenvolvimento. [CSP no Next.js](https://nextjs.org/docs/app/guides/content-security-policy). Limites de autenticação e de operações persistem no PostgreSQL, compartilhados entre instâncias. [Rate limiting no Better Auth](https://better-auth.com/docs/concepts/rate-limit).

## Operação

Configure backups no Supabase conforme os recursos do projeto e teste restauração em projeto separado. Inclua todo o schema colorimetry, fotografias binárias e auditoria. Não grave exports no repositório.

Prefira migrações aditivas. Preserve a imagem/deployment anterior para rollback de código, verificando compatibilidade com o schema atualizado. Não reverta banco apagando dados técnicos. Monitore disponibilidade, erros 5xx, conexões, armazenamento e latência.

O carregamento da oficina ainda é feito em lote. Paginação e busca no servidor são a próxima evolução para bases grandes. A biblioteca comercial e coeficientes quantitativos reais dependem de cadastro e validação técnica da oficina.

## Estado da entrega

Código, migração, arquivos de implantação e testes foram preparados. A publicação efetiva depende do projeto Supabase, conexões reais, hospedagem e domínio. Testes com PostgreSQL local e build de produção não representam conexão ao Supabase remoto nem publicação externa.

Antes da publicação, preencha a senha PostgreSQL nas duas conexões e a origem pública em BETTER_AUTH_URL. Preencha também os quatro campos PRODUCTION_ORGANIZATION_NAME, PRODUCTION_ADMIN_NAME, PRODUCTION_ADMIN_EMAIL e PRODUCTION_ADMIN_PASSWORD para provisionar o primeiro acesso. As chaves publishable/secret e o endpoint JWKS do Supabase não substituem a senha PostgreSQL.
