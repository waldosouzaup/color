-- ==============================================================================
-- MESTRE DA COLORIMETRIA — SCRIPT SQL MODELO PARA CRIAÇÃO DE USUÁRIOS
-- ==============================================================================
-- Este script serve como modelo para criar usuários diretamente no banco
-- PostgreSQL / Supabase, no schema privado 'colorimetry'.
--
-- PERFIS DISPONÍVEIS:
--   'ADMIN'        -> Administrador (acesso a regras, calibração e configurações)
--   'PROFESSIONAL' -> Colorista / Preparador (acesso aos ajustes, fórmulas e banco)
--
-- COMO GERAR UM HASH DE SENHA NOVO:
--   No terminal do projeto, execute:
--   node -e "import('better-auth/crypto').then(m => m.hashPassword('SUA_SENHA_AQUI')).then(console.log)"
-- ==============================================================================

SET search_path = colorimetry, public;

-- ------------------------------------------------------------------------------
-- 1. GARANTIR A EXISTÊNCIA DA ORGANIZAÇÃO (OFICINA)
-- ------------------------------------------------------------------------------
-- Por padrão, a organização inicial possui o id 'development'.
-- Você também pode criar novas oficinas caso utilize multi-tenancy.
INSERT INTO colorimetry."Organization" (
  "id",
  "name",
  "active",
  "precision",
  "officialLinks",
  "createdAt"
)
VALUES (
  'development',
  'Minha oficina',
  true,
  2,
  '[
    {"label": "Sistema Mixing", "url": "https://www.sherwin-auto.com.br/sistema-mixing/"},
    {"label": "Sherwin-Williams", "url": "https://www.sherwin-auto.com.br/"},
    {"label": "Catálogo de cores", "url": "https://www.sherwin-auto.com.br/cores/"}
  ]'::jsonb,
  NOW()
)
ON CONFLICT ("id") DO NOTHING;


-- ------------------------------------------------------------------------------
-- 2. EXEMPLO 1: NOVO ADMINISTRADOR DA OFICINA
-- ------------------------------------------------------------------------------
-- Nome: Carlos Mestre (Administrador)
-- E-mail: carlos.mestre@oficina.com.br
-- Senha de teste: MestreColor@2026!
-- Hash gerado via Better-Auth: bf91790738a0d2621bfb192d1af5bf26:23effd5c75f0e0b3951a1b57eac2eca89ffd6876149cbe8ec261b386fb81dfd1fac9f237e00173f863cc5facf6cafea0676ab072020a6957c379918cfa253abd
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id TEXT := 'usr_admin_carlos_01';
  v_email TEXT := 'carlos.mestre@oficina.com.br';
  v_name TEXT := 'Carlos Mestre';
  v_org_id TEXT := 'development';
  v_password_hash TEXT := 'bf91790738a0d2621bfb192d1af5bf26:23effd5c75f0e0b3951a1b57eac2eca89ffd6876149cbe8ec261b386fb81dfd1fac9f237e00173f863cc5facf6cafea0676ab072020a6957c379918cfa253abd';
BEGIN
  -- Criação do Usuário
  INSERT INTO colorimetry."User" (
    "id",
    "name",
    "email",
    "emailVerified",
    "role",
    "organizationId",
    "active",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    v_user_id,
    v_name,
    v_email,
    true,
    'ADMIN'::colorimetry."Role",
    v_org_id,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT ("email") DO UPDATE
  SET "name" = EXCLUDED."name",
      "role" = EXCLUDED."role",
      "active" = true,
      "updatedAt" = NOW();

  -- Criação da Credencial de Autenticação (Better-Auth)
  INSERT INTO colorimetry."Account" (
    "id",
    "accountId",
    "providerId",
    "userId",
    "password",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    'acc_' || v_user_id,
    v_user_id,
    'credential',
    v_user_id,
    v_password_hash,
    NOW(),
    NOW()
  )
  ON CONFLICT ("providerId", "accountId") DO UPDATE
  SET "password" = EXCLUDED."password",
      "updatedAt" = NOW();
END $$;


-- ------------------------------------------------------------------------------
-- 3. EXEMPLO 2: COLORISTA PROFISSIONAL (BANCADA)
-- ------------------------------------------------------------------------------
-- Nome: Lucas Colorista
-- E-mail: lucas.colorista@oficina.com.br
-- Senha de teste: Colorista2026!
-- Hash gerado via Better-Auth: 84d52bc9d5b3ba822385dda4f1c4750f:f9c3f1ce9d702bd2b693defef2b938e992eacedae2c93da266d4a5ffe1d78fad108cc21b543aa672b69a5631c1074d984aa6cf0d73df0316a308a7815d6d9738
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id TEXT := 'usr_prof_lucas_02';
  v_email TEXT := 'lucas.colorista@oficina.com.br';
  v_name TEXT := 'Lucas Colorista';
  v_org_id TEXT := 'development';
  v_password_hash TEXT := '84d52bc9d5b3ba822385dda4f1c4750f:f9c3f1ce9d702bd2b693defef2b938e992eacedae2c93da266d4a5ffe1d78fad108cc21b543aa672b69a5631c1074d984aa6cf0d73df0316a308a7815d6d9738';
BEGIN
  -- Criação do Usuário
  INSERT INTO colorimetry."User" (
    "id",
    "name",
    "email",
    "emailVerified",
    "role",
    "organizationId",
    "active",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    v_user_id,
    v_name,
    v_email,
    true,
    'PROFESSIONAL'::colorimetry."Role",
    v_org_id,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT ("email") DO UPDATE
  SET "name" = EXCLUDED."name",
      "role" = EXCLUDED."role",
      "active" = true,
      "updatedAt" = NOW();

  -- Criação da Credencial de Autenticação (Better-Auth)
  INSERT INTO colorimetry."Account" (
    "id",
    "accountId",
    "providerId",
    "userId",
    "password",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    'acc_' || v_user_id,
    v_user_id,
    'credential',
    v_user_id,
    v_password_hash,
    NOW(),
    NOW()
  )
  ON CONFLICT ("providerId", "accountId") DO UPDATE
  SET "password" = EXCLUDED."password",
      "updatedAt" = NOW();
END $$;


-- ------------------------------------------------------------------------------
-- 4. EXEMPLO 3: PREPARADOR DE TINTAS (CABINE & PISTOLA)
-- ------------------------------------------------------------------------------
-- Nome: Marcos Preparador
-- E-mail: marcos.preparador@oficina.com.br
-- Senha de teste: Senha123456!
-- Hash gerado via Better-Auth: 4be100907f1e34216af00abead206337:42e3608579106d59e79fe75bd548f5db2a69b63a1fddca5ba09f0eeed735b1b7086569316650a5ddf5168e00d00ec52a1f0c323e416fca31b506161fd6b2e9c2
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id TEXT := 'usr_prof_marcos_03';
  v_email TEXT := 'marcos.preparador@oficina.com.br';
  v_name TEXT := 'Marcos Preparador';
  v_org_id TEXT := 'development';
  v_password_hash TEXT := '4be100907f1e34216af00abead206337:42e3608579106d59e79fe75bd548f5db2a69b63a1fddca5ba09f0eeed735b1b7086569316650a5ddf5168e00d00ec52a1f0c323e416fca31b506161fd6b2e9c2';
BEGIN
  -- Criação do Usuário
  INSERT INTO colorimetry."User" (
    "id",
    "name",
    "email",
    "emailVerified",
    "role",
    "organizationId",
    "active",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    v_user_id,
    v_name,
    v_email,
    true,
    'PROFESSIONAL'::colorimetry."Role",
    v_org_id,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT ("email") DO UPDATE
  SET "name" = EXCLUDED."name",
      "role" = EXCLUDED."role",
      "active" = true,
      "updatedAt" = NOW();

  -- Criação da Credencial de Autenticação (Better-Auth)
  INSERT INTO colorimetry."Account" (
    "id",
    "accountId",
    "providerId",
    "userId",
    "password",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    'acc_' || v_user_id,
    v_user_id,
    'credential',
    v_user_id,
    v_password_hash,
    NOW(),
    NOW()
  )
  ON CONFLICT ("providerId", "accountId") DO UPDATE
  SET "password" = EXCLUDED."password",
      "updatedAt" = NOW();
END $$;


-- ==============================================================================
-- 5. CONSULTAS ÚTEIS DE GERENCIAMENTO
-- ==============================================================================

-- A) Listar todos os usuários cadastrados com suas oficinas:
-- SELECT u.id, u.name, u.email, u.role, u.active, o.name AS oficina
-- FROM colorimetry."User" u
-- JOIN colorimetry."Organization" o ON o.id = u."organizationId"
-- ORDER BY u."createdAt" DESC;

-- B) Desativar um usuário temporariamente (bloqueia o login):
-- UPDATE colorimetry."User"
-- SET "active" = false, "updatedAt" = NOW()
-- WHERE "email" = 'marcos.preparador@oficina.com.br';

-- C) Reativar um usuário:
-- UPDATE colorimetry."User"
-- SET "active" = true, "updatedAt" = NOW()
-- WHERE "email" = 'marcos.preparador@oficina.com.br';

-- D) Promover um usuário a Administrador:
-- UPDATE colorimetry."User"
-- SET "role" = 'ADMIN'::colorimetry."Role", "updatedAt" = NOW()
-- WHERE "email" = 'lucas.colorista@oficina.com.br';
