# Verificação da implementação

Executada em 9 de setembro de 2026, com Node.js 22.23.2 e PostgreSQL local persistente.

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

O executável pnpm foi usado a partir de uma instalação temporária, pois não estava instalado globalmente no ambiente. O projeto possui `pnpm-lock.yaml` e versão do gerenciador fixada em `package.json`.

## Evidências funcionais

- Fluxo em celular de 375 px: login, fórmula Chevrolet de 500 g, tinta metálica, chapa com fotografia, AZUL → ESVERDEADO, indicação de óxido vermelho ou violeta, dosagem não calibrada, adição manual de 1 g, nova chapa, aprovação e busca/reabertura no Banco de Cores.
- Massa em PostgreSQL: 500 → 501 → 501,50 g com duas adições separadas. Duas gravações simultâneas com a mesma versão resultam em uma gravação válida e uma rejeitada.
- API rejeita os quatro pares inválidos exigidos, requisições sem autenticação e escritas de origem externa.
- Um profissional de uma segunda organização não vê fórmulas, sessões ou cores da primeira; não acessa sua foto; não diagnostica sua sessão; não executa operações administrativas.
- Coeficiente em teste não libera dose. VERIFIED válido libera a fixture matemática. Alteração de VERIFIED preserva a versão anterior e cria DRAFT. Outra organização e outro sistema não recebem dose.
- Regras personalizadas de uma oficina não alteram as regras da outra.
- Dez telas verificadas em 375, 768, 1024 e 1440 px sem overflow horizontal. Capturas de desktop e celular inspecionadas visualmente.
- Limite de operações concorrentes: 90 aceitas e duas rejeitadas; nova janela libera uma operação. Persistência no PostgreSQL.
- Redefinição de senha restrita ao administrador da mesma oficina, revogação de sessões e auditoria sem senha; troca da própria senha pela API autenticada conferida no navegador.
- Schema `colorimetry` criado por migrações em banco efêmero; fluxo completo de integração executado nesse schema. Os papéis `anon` e `authenticated` não conseguem consultar suas tabelas.
- Bootstrap cria administrador com hash de senha, não cria pigmentos ou coeficientes demonstrativos, preserva credenciais quando repetido e rejeita conflito com outra oficina.
- `/api/health` e `/api/ready` retornam 200 no teste standalone; CSP apresenta nonce diferente por resposta, strict-dynamic e ausência de unsafe-eval em produção.

Capturas e relatórios de testes são gerados em `test-results/` e `playwright-report/`, ambos ignorados no versionamento. Os registros do cenário de navegador são identificados como DADO DEMONSTRATIVO. Fixtures de integração pertencem a organizações efêmeras removidas ao final.

O preflight de produção identifica corretamente as conexões ainda não preenchidas em `.env.production.local`. Não houve conexão ao Supabase remoto ou deploy externo. O [CI do primeiro commit](https://github.com/waldosouzaup/color/actions/runs/34390959347) passou no GitHub, incluindo migrações, lint, tipos, testes unitários, integração PostgreSQL, schema privado, bootstrap, build e cinco cenários de navegador.

O workflow também passa a construir o Dockerfile e executar `scripts/test-container.sh`: container sem privilégios, filesystem somente leitura, conexão ao PostgreSQL efêmero, saúde, CSP, login e consulta da API autenticada. O teste não usa credenciais do Supabase real. Docker e Caddy precisam ser iniciados no servidor escolhido caso essa seja a hospedagem; uma execução de CI não publica o aplicativo.

O procedimento e os dados necessários estão em [PRODUCTION_SUPABASE.md](PRODUCTION_SUPABASE.md).
