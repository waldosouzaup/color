# ADR-004 — Organização derivada da sessão autenticada

Status: aceito.

Better Auth gerencia credenciais e sessões persistentes. Cadastros públicos estão desabilitados. A aplicação recarrega usuário e organização em cada requisição autenticada, conferindo atividade e perfil.

O `organizationId` nunca é aceito do corpo da requisição. Repositórios filtram por organização do usuário; serviços validam referências, bases e sessões no mesmo escopo. Fotos são servidas por endpoint autenticado e consultadas através da sessão proprietária. Regras-base são globais e suas customizações são privadas.

ADMIN gerencia a própria oficina. PROFESSIONAL executa ajustes. Desativar usuário invalida suas sessões. O administrador não pode desativar seu próprio acesso. Não há console de superadministrador ou criação pública de organizações no MVP.

O isolamento é implementado na aplicação e coberto por integração e API; não há RLS PostgreSQL nesta versão. Acesso direto ao banco deve ser limitado à aplicação e aos operadores autorizados.
