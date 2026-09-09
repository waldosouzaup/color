# ADR-001 — Motor de regras independente

Status: aceito.

O domínio TypeScript não depende de React. Uma matriz Zod valida pares e um resolvedor seleciona regras ativas. Cada saída descreve papel e obrigatoriedade, distinguindo alternativas de combinações.

O seed global é referência. Administradores criam versões privadas para sua oficina; não alteram o comportamento de outras organizações. A versão mais recente pode desativar uma combinação. Cada iteração guarda um snapshot da regra aplicada. A edição técnica de saídas usa JSON validado no MVP.
