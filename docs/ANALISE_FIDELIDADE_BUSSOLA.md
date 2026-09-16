# Análise de fidelidade da bússola

Data: 15/09/2026. Código examinado: commit `588deb8`, sem alterações prévias no diretório de trabalho.

**Nota de atualização — 16/09/2026:** esta análise descreve o estado histórico acima. O repositório evoluiu desde então. A explicação em vídeo do usuário esclareceu uma necessidade adicional: localizar bases pelo comportamento desejado na frente e no ângulo, usando o catálogo técnico. Consulte `REQUISITOS_VIDEO_USUARIO.md` para as evidências, a comparação com o código atual (`2923398`) e o complemento ao prompt. O vídeo não demonstra a mecânica dos discos.

## 1. Conclusão

A implementação atual possui um domínio de correções aproveitável, mas representa outro instrumento visual. Ela usa oito posições equidistantes, um bisel metálico escuro, graduação de graus e uma lente central. A imagem `aplicativo.jpeg` apresenta um disco claro, doze setores externos, quatro esferas de tons fundamentais, oito esferas de direções e informações de correção distribuídas no interior. Um segundo disco aparece separado, abaixo do primeiro.

A correção exige reconstruir a geometria e a apresentação do componente, integrar essa representação ao estado existente e completar a comunicação das regras. Trocar apenas cores, sombras ou tamanho não resolve a diferença estrutural.

**Doze setores gráficos não significam doze regras de correção.** O domínio documenta oito pares válidos de tom e direção. As quatro posições de tom fundamental precisam existir visualmente sem gerar recomendações inventadas.

## 2. Escopo e evidência

Foram lidos todos os 11 arquivos preexistentes em `/docs`: cinco Markdown na raiz, quatro ADRs, um HTML e um PDF.

Foram examinados também `README.md`, `AGENTS.md`, `CLAUDE.md`, componentes da bússola, páginas consumidoras, formulário de diagnóstico, motor de regras, repositório de regras, trechos dos serviços de ajuste, estilos e testes relevantes. O PDF teve texto extraído de todas as páginas e inspeção visual das páginas 2–5, que contêm o método, a matriz e o fluxo operacional.

A comparação da implementação foi feita por leitura do código; não foi executada uma sessão interativa de navegador nesta análise. Defeitos observáveis no código estão separados de riscos que precisam ser reproduzidos. Os documentos originais na raiz, como a aula DOCX e o livro PDF, foram identificados, mas não auditados integralmente nesta rodada.

Verificação executada: `npm test`, resultado **39 testes aprovados em três arquivos**, em 15/09/2026. Não foram executados build, integração PostgreSQL, E2E nem acesso ao Supabase remoto. Nenhum código de aplicação foi alterado.

## 3. O que cada documento estabelece

| Fonte | Conteúdo relevante | Consequência para a correção |
| --- | --- | --- |
| `COLORIMETRY_DOMAIN.md` | Oito regras; precedência operacional; primeiro ângulo; calibração; massa e histórico | Principal contrato técnico. Preservar regras e invariantes, revisando a antiga orientação de imagem apenas conceitual diante do novo pedido |
| `MANUAL_DO_USUARIO.md` | Fluxo de uso; seleção de tom/direção; mostrador arrastável; Ângulo/Frente | Orienta navegação e interação, mas não especifica a mecânica do segundo disco |
| `MANUAL_DO_USUARIO.html` | Manual diagramado; matriz e miniesfera de corte; afirmação de dose indicada | É uma adaptação editorial, não uma cópia literal do Markdown. Necessita alinhamento às condições reais de dosagem |
| `MANUAL_DO_USUARIO.pdf` | Cinco páginas correspondentes ao conteúdo diagramado | Não contém uma especificação técnica da geometria original nem comprova rotação de máscara |
| `VERIFICATION.md` | Registro de verificações de 09/09/2026, inclusive fluxo e responsividade | Evidência histórica; não comprova equivalência com a referência nem substitui uma execução atual |
| `IMPORTS.md` | Contratos de importação futura; revisão e calibração | Não fornece biblioteca comercial completa, importador pronto nem dados para inventar doses |
| `PRODUCTION_SUPABASE.md` | PostgreSQL privado, Prisma, Better Auth e implantação | A reconstrução visual não exige trocar autenticação, expor banco ou executar migrações |
| `ADR-001-rules-engine.md` | Domínio sem React; regras privadas por oficina; snapshots | Reutilizar o resolvedor e separar geometria de regra operacional |
| `ADR-002-calibration-coefficients.md` | Coeficiente verificado com contexto exato; versionamento | Preservar `DOSAGEM NÃO CALIBRADA` quando não houver coeficiente elegível |
| `ADR-003-weight-decimal-strategy.md` | Decimal.js, strings decimais, bloqueio e versão | Não converter o modelo de massa em cálculos de `Number` durante a refatoração |
| `ADR-004-multitenancy.md` | Organização derivada da sessão; isolamento no backend | O navegador deve continuar consumindo a API autenticada da aplicação |

### 3.1 Divergências entre fontes

1. **Fidelidade visual:** `COLORIMETRY_DOMAIN.md:5` deliberadamente restringia as imagens ao uso conceitual. O pedido atual muda o objetivo visual. Essa frase precisa ser atualizada; não deve justificar a permanência do instrumento metálico.
2. **Regras versus arte:** a mesma documentação determina que a arte não substitui a matriz operacional. Isso continua pertinente: inscrições minúsculas, cores aproximadas e setas na captura não autorizam alterar pigmentos ou combinações.
3. **Dose:** HTML/PDF dizem que a bússola exibirá a dose indicada, sem explicitar ali todas as condições. O Markdown é mais cuidadoso, e domínio/ADRs definem condições estritas. Uma consulta sem sessão, massa, base e calibração não deve prometer gramas.
4. **Classificação:** HTML/PDF usam afirmações universais sobre quatro tons; o domínio define uma classificação operacional do método. A interface deve preferir essa formulação limitada ao método, evitando transformá-la em taxonomia científica universal.
5. **Precisão:** “Alta Precisão” e graus no componente podem sugerir medição. Os graus atuais são posições de interface; não representam desvio colorimétrico medido, ângulo de observação da chapa ou leitura de sensores. `features/help.tsx:543` ainda menciona “graus de desvio”, expressão a revisar.
6. **Distribuição do manual:** os PDFs em `/docs`, `/public` e na raiz são atualmente idênticos por SHA-256. `/api/manual` procura primeiro a cópia de `/public`. Editar apenas o Markdown ou só o PDF de `/docs` não atualiza automaticamente o arquivo entregue ao usuário.
7. **Versão e verificações:** HTML/PDF anunciam “Versão do Sistema: 2.0”, enquanto `package.json` declara `0.1.0`; não há equivalência de versionamento documentada. O relatório histórico registra 38 testes; a execução atual encontrou 39. Isso é diferença temporal, não prova de falha.

## 4. Leitura da referência

O arquivo disponível chama-se **`aplicativo.jpeg`**. A menção a “aplicativo.jpg” no pedido se refere a essa imagem; não há necessidade de renomeá-la.

### 4.1 Elementos diretamente observáveis

- Captura de 720 × 1600 px, com dois discos em disposição vertical. Barras do Android são contexto da captura, não componentes da aplicação.
- Disco superior aproximadamente entre x=24–689 e y=77–778, com centro próximo de (357, 423). Há pequena deformação elíptica na captura; não se deve transformar essa deformação em requisito funcional.
- Doze setores externos de aproximadamente 30°, anel interno próximo de 69% do raio, contornos escuros e fundos claros com tonalidades pastel.
- Quatro esferas grandes de tons fundamentais e oito menores de direções. As esferas têm volume e reflexo localizado, não aparência de LEDs.
- Nomes de famílias e subtons orientados conforme a composição radial. Pigmentos menores e rótulos de correção aparecem no interior, com setas próximas a um pequeno pivô preto.
- Ausência do bisel metálico, das 72 marcas de graduação e da grande lente textual central usados no código atual.
- Disco inferior aproximadamente entre x=20–696 e y=847–1524: centro branco, quadrantes superior esquerdo e inferior direito escuros com identidade gráfica; áreas superior direita e inferior esquerda claras subdivididas radialmente.

### 4.2 Reconstrução geométrica proposta

Convenção: 0° no topo, ângulo crescente no sentido horário. Os números abaixo são uma **idealização geométrica da captura**, a conferir em sobreposição visual; não são medições colorimétricas.

| Setor | Centro proposto | Conteúdo externo | Associação operacional |
| --- | --- | --- | --- |
| 0°–30° | 15° | Amarelo fundamental | Seleção de família; nenhuma dose automática |
| 30°–60° | 45° | Amarelo avermelhado | `YELLOW:REDISH` |
| 60°–90° | 75° | Azul avermelhado | `BLUE:REDISH` |
| 90°–120° | 105° | Azul fundamental | Seleção de família |
| 120°–150° | 135° | Azul esverdeado | `BLUE:GREENISH` |
| 150°–180° | 165° | Vermelho amarelado | `RED:YELLOWISH` |
| 180°–210° | 195° | Vermelho fundamental | Seleção de família |
| 210°–240° | 225° | Vermelho azulado | `RED:BLUISH` |
| 240°–270° | 255° | Verde azulado | `GREEN:BLUISH` |
| 270°–300° | 285° | Verde fundamental | Seleção de família |
| 300°–330° | 315° | Verde amarelado | `GREEN:YELLOWISH` |
| 330°–360° | 345° | Amarelo esverdeado | `YELLOW:GREENISH` |

A sequência preserva os dois subtons ao redor do tom fundamental, incluindo a passagem 360°/0°. A aparência externa tem doze posições; o mapa de regras continua com oito chaves.

### 4.3 O que a imagem não comprova

Não comprova que o disco inferior seja uma máscara móvel, que as áreas brancas sejam transparentes, qual camada gira, qual é a posição de repouso de um mecanismo, nem como as letras internas se relacionam ao seletor Ângulo/Frente. Também não comprova sensores, dosagem, animação ou gestos.

O manual confirma arraste de agulha e consulta, mas não descreve uma sobreposição física dos dois discos. A implementação inicial mais sustentada pelas fontes é reproduzir a disposição visível e oferecer a seleção interativa documentada. Uma simulação de máscara sobreposta deve ser sustentada por outra fonte ou validada como decisão de produto, sem ser anunciada como reprodução comprovada.

## 5. Diagnóstico do código

### 5.1 Problemas confirmados por inspeção

| Prioridade | Evidência | Diagnóstico e efeito |
| --- | --- | --- |
| Alta | `components/compass.tsx:20` | `ruleAngles` distribui oito regras a cada 45°, a partir de 22,5°. A imagem exige espaço também para os quatro tons fundamentais |
| Alta | `components/compass.tsx:32` e `:350` | Tons fundamentais são rótulos nos pontos cardeais; as quatro esferas grandes da referência não são renderizadas |
| Alta | `components/compass.tsx:301` e seguintes | Bisel, dial escuro, graduação e lente central substituem os setores impressos claros. O segundo disco não é representado |
| Alta | `components/compass.tsx:591` | O centro usa somente `activeRule.outputs[0]`. Verde azulado aparece com apenas violeta, embora a regra exija também óxido vermelho; alternativas e suporte somem dessa leitura |
| Alta | `components/compass.tsx:662` | Pivô desenhado após o conteúdo central sobrepõe a miniesfera de correção, centrada apenas seis unidades abaixo do eixo |
| Média | `components/compass.tsx:98` | `setIsDragging(true)` é seguido de `handlePointerMove(e)`, cujo fechamento ainda lê `isDragging=false`; a atualização inicial retorna antes de selecionar. Clique nos grupos funciona, mas o fundo do dial não tem seleção equivalente |
| Média | `components/compass.tsx:149` e `:491` | IDs fixos de filtros/gradientes e clips derivados só da regra se repetem quando página e modal coexistem. A duplicação é certa; a manifestação visual precisa de teste no navegador |
| Média | `components/compass.tsx:323` aproximadamente | O caminho vermelho usa extremidades opostas, formando arco de 180°, e o verde possui início/fim praticamente coincidentes. O fundo não corresponde aos quatro quadrantes de 90° descritos nos comentários |
| Média | `app/globals.css:1471` e `:1508` | Estilos usam `--panel-bg` e `--panel-border`, sem definições encontradas em `globals.css`; o SVG recorre a fallbacks escuros. `touch-action: none` cobre todo o container, inclusive a barra de modos |
| Média | `app/globals.css:3655` | Regras antigas miram `.compass`, mas o SVG atual usa `.compass-svg`. Não é correto assumir que a regra de ocultar texto em 390 px ainda se aplique |
| Média | `components/compass-panels.tsx:14` | `methodInsights` é fixo por tom/direção e não acompanha saídas editadas pela oficina. Pode explicar um pigmento diferente daquele da regra customizada |
| Alta para validação | `tests/domain.test.ts:106` | O teste geométrico afirma os valores atuais como corretos. Ele protege a geometria divergente, não a fidelidade à imagem |

**Limite do achado sobre saídas:** `CompassDiagnosis` já percorre todas as saídas e `Diagnosis` distingue alternativas, combinações e suporte. Portanto, o problema não é ausência geral dessas regras no sistema, e sim a inconsistência entre o mostrador resumido e as outras apresentações.

### 5.2 Riscos a reproduzir antes de declarar como falhas

- Captura de ponteiro em `e.target`, cancelamento, perda de captura, saída dos limites e múltiplos toques.
- Giro longo na passagem 337,5° → 22,5°: o CSS interpola o valor absoluto; conferir a trajetória visual e implementar menor caminho angular se houver movimento.
- Seleção de regra inativa: o backend e o botão de uso já bloqueiam a aplicação. A consulta pode mostrá-la, mas precisa comunicar indisponibilidade e não aparentar uma recomendação válida.
- Divergência entre seleção implícita de `rules[0]` no componente e estado do chamador quando a lista muda ou fica vazia.
- Legibilidade e foco em 375 px: passar no teste de overflow não garante leitura dos rótulos nem operação por teclado.
- `viewMode` altera a apresentação, mas as regras permanecem iguais. Isso é compatível com a limitação do motor B, desde que a interface não sugira outro algoritmo de correção.

### 5.3 Partes a preservar

- Matriz validada, papéis `PRIMARY`, `ALTERNATIVE`, `COMBINED`, `SUPPORT`, `required` e versões das regras.
- `getRules()` prioriza a versão privada da oficina, inclusive desativação; a UI deve consumir esse resultado, sem substituí-lo por `initialRules`.
- Página e modal compartilham seleção e modo no chamador; o E2E existente verifica seleção mantida ao fechar o modal.
- Encaminhamento para `/sessions/{id}?diagnosis=TOM.DIRECAO`, consumido por `SessionDetail` e `Diagnosis`.
- Validação de todas as adições obrigatórias e exatamente uma alternativa no backend.
- Primeiro ângulo, chapa exigida, reavaliação da frente, transações, massa decimal e snapshots.
- Supabase como PostgreSQL privado, Better Auth e isolamento existente. Uma correção visual não demanda mudança dessa arquitetura.

## 6. Matriz operacional preservada

| Tom/direção | Saídas | Semântica |
| --- | --- | --- |
| `YELLOW:REDISH` | `BLUE_GREEN` | Principal |
| `YELLOW:GREENISH` | `RED_BLUE`, `VIOLET` | Escolher uma alternativa |
| `BLUE:REDISH` | `LEMON_YELLOW` | Principal |
| `BLUE:GREENISH` | `RED_OXIDE`, `VIOLET` | Escolher uma alternativa |
| `GREEN:YELLOWISH` | `VIOLET`, `RED_SUPPORT` | Principal e suporte opcional |
| `GREEN:BLUISH` | `VIOLET`, `RED_OXIDE` | Ambas obrigatórias |
| `RED:BLUISH` | `LEMON_YELLOW` | Principal |
| `RED:YELLOWISH` | `RED_BLUE`, `VIOLET` | Escolher uma alternativa |

`RED_BLUE` significa **azul avermelhado**. `REDISH` mantém a grafia do contrato. Os nomes da arte precisam de correspondência explícita com os identificadores do domínio; cor de uma esfera não é um identificador confiável.

## 7. Estratégia recomendada

1. Registrar baseline visual no navegador e fechar a tabela de divergências com evidências.
2. Criar geometria declarativa de doze setores em módulo independente; manter as oito regras operacionais separadas.
3. Reconstruir disco, esferas, rótulos, setas e segundo disco conforme a referência; usar assets locais quando disponíveis e vetor para a estrutura interativa.
4. Centralizar seleção por chave de tom/direção, com tratamento de família sem subtom, regra ausente e regra inativa.
5. Exibir todas as saídas e seus conectivos; compartilhar essa apresentação entre mostrador, painel, modal e diagnóstico.
6. Corrigir interação por toque, mouse e teclado, IDs SVG e estilos da bússola.
7. Validar visualmente com recortes normalizados da referência e funcionalmente com cenários de domínio, interface e persistência.
8. Atualizar documentação e cópias do manual efetivamente distribuídas.

O prompt executável está em `PROMPT_CLAUDE_CODE_BUSSOLA.md`. Ele solicita implementação e verificação em etapas, delimita o que a fotografia permite concluir e impede que a reconstrução visual altere silenciosamente as regras técnicas.

## 8. Fechamento da correção

A reconstrução foi implementada. O instrumento metálico foi substituído pelo
disco de doze setores medido na referência; a geometria saiu do componente React
e virou módulo puro em `domain/compass/`, usado ao mesmo tempo por desenho, hit
testing e indicação de seleção.

| Achado da seção 5.1 | Situação |
| --- | --- |
| `ruleAngles` com oito posições de 45° | Substituído por doze setores de 30° em `domain/compass/geometry.ts` |
| Tons fundamentais sem esfera | Quatro esferas grandes desenhadas; selecionam família, sem correção automática |
| Bisel, dial escuro, graduação e lente central | Removidos; disco claro com fundos pastel, anel em 0,677 R e pivô de 0,088 R |
| Segundo disco ausente | Reproduzido em `components/compass-identity-disc.tsx`, separado, com mecânica declarada pendente |
| `activeRule.outputs[0]` no mostrador | Saídas completas em `describeOutputs`, com “ou”, “+”, obrigatoriedade e suporte |
| Pivô sobre a miniesfera de correção | Pivô pequeno, desenhado antes do destaque; nada de informação coberta |
| `pointerdown` lendo `isDragging` desatualizado | Seleção calculada no próprio `pointerdown`, sem depender de estado assíncrono |
| Captura em `e.target` | Captura no SVG, com `pointercancel`, `lostpointercapture` e um ponteiro por gesto |
| IDs SVG fixos | `useId()` por instância; teste E2E confere página e modal montados juntos |
| Paths de quadrante incoerentes | Geometria declarativa (`annularSectorPath`, `wedgePath`) coberta por teste |
| `--panel-bg` e `--panel-border` sem definição | Definidos como apelidos no `:root`; seletores `.compass` obsoletos removidos |
| `methodInsights` fixo por par | Só é exibido quando a regra ainda corresponde à matriz documentada |
| Teste fixando 22,5°–337,5° | Substituído por `tests/compass.test.ts`, com propriedades geométricas |
| “graus de desvio” na ajuda | Texto corrigido; os números eram posições do seletor |

O contrato visual, as medidas e as divergências entre arte e matriz estão em
[BUSSOLA_VISUAL.md](BUSSOLA_VISUAL.md). As verificações executadas estão em
[VERIFICATION.md](VERIFICATION.md).
