# Manual do Usuário — Sistema Mestre da Colorimetria

Bem-vindo ao **Mestre da Colorimetria**, o sistema especializado em igualação e ajuste de cores automotivas baseado no **Método Semida** e no princípio do **Primeiro Ângulo**.

Este guia foi elaborado para orientar o profissional colorista e o preparador de tintas passo a passo, desde o cadastro da fórmula original até a aprovação e arquivamento no Banco de Cores da oficina.

---

## Sumário

1. [Acesso e Interface](#1-acesso-e-interface)
2. [O Princípio Fundamental: Método Primeiro Ângulo](#2-o-princípio-fundamental-método-primeiro-ângulo)
3. [Passo 1: Iniciar um Novo Ajuste (Fórmula de Origem)](#3-passo-1-iniciar-um-novo-ajuste-fórmula-de-origem)
4. [Passo 2: Preparação e Primeira Chapa de Teste](#4-passo-2-preparação-e-primeira-chapa-de-teste)
5. [Passo 3: Diagnóstico com a Bússola da Colorimetria](#5-passo-3-diagnóstico-com-a-bússola-da-colorimetria)
6. [Passo 4: Registro da Correção e Pesagem na Balança](#6-passo-4-registro-da-correção-e-pesagem-na-balança)
7. [Passo 5: Nova Chapa e Avaliação da Frente](#7-passo-5-nova-chapa-e-avaliação-da-frente)
8. [Passo 6: Aprovação Final e Banco de Cores](#8-passo-6-aprovação-final-e-banco-de-cores)
9. [Consultas Rápidas e Ferramentas Auxiliares](#9-consultas-rápidas-e-ferramentas-auxiliares)

---

## 1. Acesso e Interface

### 1.1 Login no Sistema
1. Acesse o endereço da sua oficina pelo navegador (em desenvolvimento, algo como `http://localhost:3004`).
2. Digite seu **E-mail** e **Senha** cadastrados e clique em **"Entrar na oficina"**.
3. Não existe cadastro público: quem cria novos acessos é o administrador da oficina, em **Configurações**. A senha precisa ter no mínimo 12 caracteres.
4. Errou a senha várias vezes? O sistema aceita cinco tentativas por minuto; espere um minuto antes de tentar de novo.

### 1.2 Alternância de Tema (Dark Studio / Claro)
- No canto superior direito da tela, clique no botão de **Tema** (ícone de Sol/Lua).
- **Tema Dark Studio (Recomendado):** Ideal para estúdios e cabines de pintura com iluminação controlada, evitando ofuscamento visual.
- **Tema Claro:** Para ambientes de escritório com luz natural intensa.

---

## 2. O Princípio Fundamental: Método Primeiro Ângulo

Antes de mexer em qualquer pigmento, memorize a regra de ouro do método:

> **"A correção sempre começa pelo ÂNGULO (Flop). Nunca pela FRENTE (Face)."**

- **Por quê?**
  - Os **pigmentos sólidos** governam o ângulo na chapa.
  - Partículas de efeito (**alumínio e pérola**) influenciam a frente.
  - **Se o ângulo fechar na chapa, a frente tende a fechar sozinha.**

---

## 3. Passo 1: Iniciar um Novo Ajuste (Fórmula de Origem)

1. No menu lateral ou no painel principal, clique no botão **"Novo ajuste"** (ou acesse `/new`).
2. **Etapa 1 — Identificação do Veículo:**
   - Preencha: Montadora (ex.: *Chevrolet*), Modelo (ex.: *Onix*), Ano (ex.: *2024*).
   - Digite o **Código da Cor** (ex.: *WA-123*) e a **Descrição** (ex.: *Prata Switchblade*).
   - Selecione o Sistema/Linha de tinta e o Fabricante.
3. **Etapa 2 — Componentes e Pesagem:**
   - Adicione cada base/pigmento com seu código e peso em gramas.
   - Escolha o modo de pesagem da sua balança:
     - **Individual:** Você zera a balança (tara) a cada componente adicionado.
     - **Acumulado:** A balança soma os pesos progressivamente sem zerar.
4. **Etapa 3 — Tipo de Tinta & Confirmação:**
   - Selecione: **Metálica**, **Poliéster Lisa**, **Pérola** ou **Outro**.
   - Confira a massa total calculada e clique em **"Criar ajuste"**.

---

## 4. Passo 2: Preparação e Primeira Chapa de Teste

1. Pese rigorosamente os componentes na balança e faça a homogeneização da tinta.
2. Na cabine, aplique a tinta em uma **chapa de teste** metálica usando a mesma pressão e distância de pistola que usará no veículo.
3. No sistema, dentro da sessão aberta, localize a seção **"Chapas de teste"** e clique em **"+ Nova chapa"**:
   - Informe se aplicou verniz (*Com verniz* ou *Sem verniz*).
   - Registre as condições de aplicação (temperatura, bico da pistola e pressão).
   - Tire uma fotografia da chapa e anexe ao registro.
   - Clique em **"Registrar chapa"**.

---

## 5. Passo 3: Diagnóstico com a Bússola da Colorimetria

Com a primeira chapa seca sob iluminação controlada (luz do sol ou luz de cabine 5000K–6500K):

1. **Observe a chapa em ângulo rasante (45° e 110° — Flop)** comparando com a peça de referência do carro.
2. Na sessão de ajuste, clique em **"Diagnosticar matiz"** (ou abra a **Bússola da Colorimetria** em `/compass`).

> **Como a bússola funciona.** O disco tem doze posições: os quatro tons fundamentais (amarelo, azul, vermelho e verde) e, ao lado de cada um, as suas duas direções de subtom. Selecionar um tom fundamental escolhe apenas a família e oferece os dois subtons válidos — nenhuma correção é indicada nesse passo. Selecionar um subtom resolve a regra da sua oficina e mostra todos os pigmentos de corte, com "ou" para alternativas e "+" para combinações obrigatórias. O que gira é a sua seleção dentro do disco: nenhuma peça é girada e nenhuma consulta altera massa, fórmula ou histórico. O segundo disco, com a identidade gráfica, é apresentado abaixo apenas como reprodução da referência; sua mecânica não está documentada. As inscrições miúdas dentro do disco reproduzem a arte impressa — a recomendação válida é sempre a do painel ao lado.
3. **Identifique o Tom Principal (1º Passo):**
   - A cor pertence obrigatoriamente a um dos 4 fundamentos:
     - 🟡 **Amarelo**
     - 🔵 **Azul**
     - 🟢 **Verde**
     - 🔴 **Vermelho**
4. **Identifique a Direção do Subtom (2º Passo):**
   - Para onde a tinta está puxando no ângulo?
     - *Amarelo:* puxa para **Avermelhado** ou **Esverdeado**.
     - *Azul:* puxa para **Avermelhado** ou **Esverdeado**.
     - *Verde:* puxa para **Amarelado** ou **Azulado**.
     - *Vermelho:* puxa para **Amarelado** ou **Azulado**.
5. **Consulte a Fórmula Secreta Semida (Pigmentos de Corte):**
   - O sistema indicará automaticamente o pigmento de corte exato:
     - *Amarelo avermelhado* → corta com **Azul Esverdeado**.
     - *Amarelo esverdeado* → corta com **Azul Avermelhado** ou **Combo de Roxo (Violeta)**.
     - *Azul avermelhado* → corta com **Amarelo Limão**.
     - *Azul esverdeado* → corta com **Óxido Vermelho** ou **Violeta**.
     - *Verde amarelado* → corta com **Violeta Roxo** (+ suporte se necessário).
     - *Verde azulado* → corta com **Violeta Roxo + Óxido Vermelho** (ambos obrigatórios).
     - *Vermelho azulado* → corta com **Amarelo Limão**.
     - *Vermelho amarelado* → corta com **Azul Avermelhado** ou **Violeta**.

> ⚠️ **ATENÇÃO — REGRAS DE OPOSIÇÃO E CONTAMINAÇÃO:**
> - **Nunca adicione azul direto em amarelo (ou amarelo em azul):** A mistura direta cria verde e uma "lama" acinzentada que destrói a cor.
> - **Nunca adicione vermelho direto em verde (ou verde em vermelho):** Gera um marrom opaco e sem brilho.
> - O corte deve ser sempre feito através do pigmento fracionado indicado pela bússola!

---

## 6. Passo 4: Registro da Correção e Pesagem na Balança

1. Selecione a **Intensidade da Diferença**:
   - **Leve:** Pequeno desvio perceptível apenas em ângulo crítico.
   - **Média:** Desvio nítido a meia distância.
   - **Forte:** Desvio evidente sob qualquer luz.
2. Informe o tipo de **Iluminação** da avaliação (Cabine, Sol Direto, Sombra, LED Especial).
3. **Dosagem Indicada:**
   - Se a oficina possui calibração ativa para aquela base, o sistema calculará a dose exata sugerida em gramas (`0.01 g`).
   - Se a dosagem não estiver calibrada, o profissional pode aplicar as gotas com cautela e registrar a quantidade real adicionada.
4. Pese o pigmento na balança de precisão, adicione à mistura e confirme a operação no sistema clicando em **"Registrar adição"**.

---

## 7. Passo 5: Nova Chapa e Avaliação da Frente

1. Misture bem a tinta após a adição do pigmento de corte.
2. **Aplique uma nova chapa de teste (Chapa 02)**.
3. Cadastre a nova chapa no sistema.
4. **Reavalie o Ângulo:**
   - O ângulo fechou com a referência?
   - Se ainda houver desvio, repita o diagnóstico de matiz para uma nova iteração.
5. **Avalie a Frente (Face — 90°):**
   - Com o ângulo aprovado, olhe a chapa de frente perpendicular.
   - Verifique a orientação das partículas metálicas ou perolizadas.

---

## 8. Passo 6: Aprovação Final e Banco de Cores

1. Quando o ângulo e a frente estiverem perfeitamente alinhados com o veículo:
   - Clique em **"Aprovar fórmula"**.
   - Confirme as observações finais e o profissional responsável.
2. **O que o sistema faz automaticamente:**
   - Gera o snapshot da **Fórmula Final Ajustada** (somando os componentes iniciais com todas as correções efetuadas).
   - Bloqueia a sessão para impedir alterações acidentais.
   - Salva a cor no **Banco de Cores da Oficina** (`/bank`), catalogada por montadora, modelo, código e ano.
   - Na próxima vez que o mesmo veículo entrar na oficina, a fórmula já estará pronta para uso imediato!

---

## 9. Consultas Rápidas e Ferramentas Auxiliares

| Tela | O que você encontra |
|---|---|
| **Bússola da Colorimetria** (`/compass`) | Disco com doze posições: 4 tons fundamentais e 8 direções de subtom. Selecione clicando, arrastando ou pelo teclado; o painel mostra os pigmentos de corte da regra vigente. O seletor Ângulo/Frente registra a vista avaliada e não muda a regra. |
| **Banco de Cores** (`/bank`) | Acervo de todas as fórmulas já acertadas e aprovadas pela oficina, com pesquisa rápida por código, cor ou modelo. |
| **Biblioteca de Pigmentos** (`/pigments`) | Lista completa de bases, tipos de pigmento e fabricantes cadastrados. |
| **Histórico de Ajustes** (`/history`) | Rastreabilidade total de cada iteração, massa consumida e auditoria de pesagem. |

---

*Mestre da Colorimetria — A ciência e a precisão do ajuste de cores ao alcance da sua oficina.*
