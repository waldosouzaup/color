# Contratos para importação futura

Codificação UTF-8, delimitador vírgula, cabeçalho obrigatório, strings entre aspas quando necessário. Pesos com ponto decimal, sem separador de milhar. Campos vazios opcionais viram null. Nunca transportar organizationId de um CSV não confiável: o importador deve usar a organização da sessão.

## Pigmentos

```csv
manufacturer,productLine,code,name,systemType,family,direction,characteristic,description,isDemo,active
DEMO,Treinamento,DEMO-VIOLET,Violeta demonstrativa,DEMO,Matiz,,VIOLET,DADO DEMONSTRATIVO,true,true
```

Chave natural: organização + fabricante + linha + código. `characteristic` usa as constantes documentadas no domínio; pode ficar vazio para base de efeito. Duplicatas devem exigir revisão, nunca sobrescrever silenciosamente.

## Comportamentos

```csv
manufacturer,productLine,code,view,hueCharacteristic,lightnessEffect,cleanlinessEffect,particleEffect,notes,source,sourceReference
DEMO,Treinamento,DEMO-VIOLET,GENERAL,,,,,Sem propriedades calibradas,DADO DEMONSTRATIVO,Seed
```

`view`: ANGLE, FRONT ou GENERAL. Fonte e referência obrigatórias para todo comportamento.

A tabela "Características das Cores Básicas" (Sherwin-Williams / Lazzuril) já está transcrita em `domain/colorimetry/lazzuril-catalog.ts` e é carregada por `services/lazzuril-seed.ts`, que faz upsert por organização + fabricante + linha + código — repetir a carga não duplica nem sobrescreve edições de comportamento. O poliéster usa FRONT e ANGLE separados; o poliuretano usa GENERAL, porque a fonte traz uma única coluna de característica.

A coluna `characteristic` do pigmento é **função de corte do método**, não o comportamento óptico da tabela: só é preenchida quando a base é de fato aquele pigmento corretivo. Um vermelho de ângulo azulado não vira `RED_BLUE` (azul avermelhado), e "amarelo óxido" não tem identificador no domínio. `tests/lazzuril-mapping.test.ts` protege essa distinção.

## Coeficientes

Campos: correctionRuleId, pigmentCode, manufacturer, productLine, paintSystem, paintType, severity, gramsPer100g, minimumSuggestedG, maximumSuggestedG, precision, source, sampleSize, notes, isDemo.

Toda importação futura deve entrar como DRAFT, gerar auditoria e exigir revisão por administrador. Não importar approvedBy, approvedAt nem VERIFIED como autoridade externa. O MVP documenta o contrato e oferece cadastro manual; não implementa importador CSV em produção.
