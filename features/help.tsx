"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CircleHelp,
  Download,
  Compass,
  Layers,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  FlaskConical,
  BookOpen,
  Scale,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldAlert,
  Lightbulb,
  FileText,
  History,
  Library,
} from "lucide-react";
import { Heading, Badge } from "@/components/ui";

type TabKey = "steps" | "semida" | "rules" | "tools" | "faq";

interface StepItem {
  number: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  checklist: string[];
  tip?: string;
  link?: { href: string; label: string };
}

const stepsData: StepItem[] = [
  {
    number: "01",
    title: "Iniciar um Novo Ajuste",
    subtitle: "Cadastro da fórmula de origem e componentes",
    badge: "Entrada de dados",
    description:
      "Registre as especificações do veículo e adicione os componentes da fórmula inicial que serão pesados na balança.",
    checklist: [
      "Informe Montadora, Modelo, Ano, Código da Cor e Descrição oficial.",
      "Selecione o Sistema/Linha de tinta e o Fabricante da base.",
      "Insira cada pigmento com seu código e massa em gramas.",
      "Escolha o modo de pesagem: Individual (zera/tara a cada componente) ou Acumulado (soma progressiva).",
      "Defina o tipo de acabamento: Metálica, Poliéster Lisa, Pérola ou Outro.",
    ],
    tip: "Atenção: confira a massa total prevista antes de iniciar a pesagem dos componentes na balança.",
    link: { href: "/new", label: "Cadastrar novo ajuste agora" },
  },
  {
    number: "02",
    title: "Preparação e Chapa de Teste 01",
    subtitle: "Aplicação padronizada na cabine de pintura",
    badge: "Bancada & Cabine",
    description:
      "A homogeneização precisa e a aplicação idêntica à do veículo são vitais para que a leitura na chapa seja fidedigna.",
    checklist: [
      "Pese rigorosamente cada componente na balança de precisão.",
      "Faça a homogeneização completa da tinta no recipiente.",
      "Aplique a tinta em uma chapa metálica de teste nas mesmas condições do carro (pressão, distância e bico da pistola).",
      "No sistema, clique em '+ Nova chapa' dentro da sessão aberta.",
      "Informe se foi aplicado verniz (Com verniz / Sem verniz), anexe uma fotografia e salve o registro.",
    ],
    tip: "Nunca avalie a cor ainda úmida. O solvente e a cura do verniz alteram significativamente a tonalidade percebida.",
  },
  {
    number: "03",
    title: "Diagnóstico com a Bússola Cromática",
    subtitle: "Aplicação do Método Primeiro Ângulo",
    badge: "Diagnóstico visual",
    description:
      "A correção sempre começa pelo ÂNGULO (Flop 45°/110°), nunca pela frente. Os pigmentos sólidos governam o ângulo na chapa.",
    checklist: [
      "Posicione a chapa seca e a peça de referência do carro sob luz controlada (5000K–6500K ou sol natural).",
      "Observe em ângulo rasante (45° e 110° — Flop).",
      "Na sessão de ajuste, clique em 'Diagnosticar matiz' ou abra a Bússola Cromática.",
      "Identifique o Tom Principal: Amarelo, Azul, Verde ou Vermelho.",
      "Identifique a Direção do Subtom: para onde a cor está puxando no ângulo rasante?",
      "Verifique a sugestão de corte indicada pela Fórmula Secreta Semida.",
    ],
    tip: "Se o ângulo fechar na chapa, a frente tende a fechar sozinha. Nunca corrija a frente antes de cravar o ângulo!",
    link: { href: "/compass", label: "Abrir Bússola Cromática interativa" },
  },
  {
    number: "04",
    title: "Registro da Correção e Pesagem",
    subtitle: "Dosagem milimétrica na balança de precisão",
    badge: "Correção matemática",
    description:
      "Adicione o pigmento de corte exato indicado pelo sistema, respeitando o volume atual da mistura.",
    checklist: [
      "Selecione a Intensidade do desvio observado: Leve, Média ou Forte.",
      "Informe a Iluminação utilizada no teste (Cabine, Sol Direto, Sombra, LED Especial).",
      "Consulte a dosagem sugerida pelo sistema em gramas (precisão de 0.01 g).",
      "Pese a adição com cautela máxima na balança (gotas contadas).",
      "Clique em 'Registrar adição' para atualizar a massa total da tinta no sistema.",
    ],
    tip: "Cuidado com o excesso: em pequenos volumes (ex: 100g de tinta), uma única gota em excesso pode virar a cor de forma irreversível.",
  },
  {
    number: "05",
    title: "Nova Chapa e Avaliação de Frente",
    subtitle: "Conferência do ângulo e orientação de partículas",
    badge: "Validação cruzada",
    description:
      "Após homogeneizar o pigmento de corte, prepare uma segunda chapa de teste (Chapa 02) para validação final.",
    checklist: [
      "Aplique e seque a Chapa 02 sob as mesmas condições da primeira chapa.",
      "Cadastre a nova chapa no sistema com fotografia de acompanhamento.",
      "Reavalie primeiro o Ângulo: o desvio foi neutralizado?",
      "Se o ângulo estiver 100% igualado, avalie a Frente (Face 90° perpendicular).",
      "Verifique a orientação das partículas metálicas ou perolizadas sob foco de luz.",
    ],
    tip: "Se o ângulo ainda apresentar leve puxão residual, execute uma segunda iteração de micro-dosagem antes de mexer na frente.",
  },
  {
    number: "06",
    title: "Aprovação Final e Banco de Cores",
    subtitle: "Arquivamento e reaproveitamento na oficina",
    badge: "Aprovação & Acervo",
    description:
      "Com a cor perfeita no ângulo e na frente, aprove a fórmula para integrá-la ao acervo permanente da oficina.",
    checklist: [
      "Clique no botão 'Aprovar fórmula' na tela da sessão.",
      "Revise a soma total dos componentes (fórmula original + correções efetuadas).",
      "Confirme as observações finais do serviço e o profissional responsável.",
      "O sistema trava a sessão contra edições acidentais e cadastra a fórmula no Banco de Cores (/bank).",
      "Na próxima vez que o mesmo veículo entrar na oficina, a fórmula já estará pronta para pesagem direta.",
    ],
    tip: "Fórmulas aprovadas ficam disponíveis para todos os coloristas da sua oficina no Banco de Cores.",
    link: { href: "/bank", label: "Consultar Banco de Cores da oficina" },
  },
];

interface SemidaRule {
  tone: string;
  toneColor: string;
  direction: string;
  cutPigment: string;
  details: string;
  avoid: string;
}

const semidaRules: SemidaRule[] = [
  {
    tone: "Amarelo",
    toneColor: "#eab308",
    direction: "Puxando para Avermelhado",
    cutPigment: "Azul Esverdeado",
    details:
      "Neutraliza o excesso de calor avermelhado sem produzir lama escura.",
    avoid: "Nunca use azul direto puro — gera verde e opacidade.",
  },
  {
    tone: "Amarelo",
    toneColor: "#eab308",
    direction: "Puxando para Esverdeado",
    cutPigment: "Azul Avermelhado ou Combo de Roxo (Violeta)",
    details:
      "O componente avermelhado equilibra o verde e restaura o tom dourado/limpo.",
    avoid: "Não adicione vermelho direto puro para evitar saturação excessiva.",
  },
  {
    tone: "Azul",
    toneColor: "#3b82f6",
    direction: "Puxando para Avermelhado",
    cutPigment: "Amarelo Limão (Esverdeado)",
    details:
      "Corta a tendência violeta/avermelhada trazendo o azul de volta ao tom puro.",
    avoid: "Evite amarelo óxido, que escurece e amarela o flop.",
  },
  {
    tone: "Azul",
    toneColor: "#3b82f6",
    direction: "Puxando para Esverdeado",
    cutPigment: "Óxido Vermelho ou Violeta",
    details:
      "Remove a tonalidade turquesa/petróleo devolvendo a profundidade ao azul.",
    avoid: "Nunca use vermelho vivo concentrado em excesso.",
  },
  {
    tone: "Verde",
    toneColor: "#10b981",
    direction: "Puxando para Amarelado",
    cutPigment: "Violeta Roxo (+ suporte se necessário)",
    details:
      "O violeta neutraliza o reflexo amarelo dourado resfriando o verde.",
    avoid: "Nunca use azul puro isolado sem calibrar a perda de luminosidade.",
  },
  {
    tone: "Verde",
    toneColor: "#10b981",
    direction: "Puxando para Azulado",
    cutPigment: "Violeta Roxo + Óxido Vermelho (Ambos)",
    details:
      "Combinação dupla obrigatória para neutralizar o tom ciano sem criar marrom.",
    avoid: "Nunca adicione óxido vermelho isolado sem o suporte de violeta.",
  },
  {
    tone: "Vermelho",
    toneColor: "#ef4444",
    direction: "Puxando para Azulado",
    cutPigment: "Amarelo Limão (Esverdeado)",
    details:
      "Aquece o vermelho e remove o tom vinho/magenta indesejado no ângulo.",
    avoid: "Evite amarelo ocre/óxido que torna o vermelho opaco.",
  },
  {
    tone: "Vermelho",
    toneColor: "#ef4444",
    direction: "Puxando para Amarelado",
    cutPigment: "Azul Avermelhado ou Violeta",
    details:
      "Traz o vermelho de volta para a matiz profunda eliminando o aspecto alaranjado.",
    avoid: "Nunca use azul esverdeado direto para não gerar marrom terra.",
  },
];

interface FaqItem {
  question: string;
  answer: string;
  tag: string;
}

const faqData: FaqItem[] = [
  {
    question: "Por que a correção SEMPRE deve começar pelo ângulo e nunca pela frente?",
    answer:
      "Os pigmentos sólidos governam a cor no ângulo de visão rasante (45° e 110° — Flop). Se você tentar acertar a frente (Face 90°) primeiro adicionando alumínio, pérola ou pigmento puro, desestabilizará o ângulo de forma irreversível. A experiência prática do Mestre demonstra que quando o ângulo fecha com perfeição, a frente quase sempre fecha automaticamente ou exige apenas micro-ajustes de acabamento.",
    tag: "Fundamento",
  },
  {
    question: "O que acontece se eu adicionar Azul direto em uma tinta Amarela?",
    answer:
      "Regra de oposição categórica: Azul direto em Amarelo não 'neutraliza' — ele reage produzindo verde e uma mistura opaca acinzentada conhecida como 'lama'. O corte correto para neutralizar o amarelo desviado deve ser feito SEMPRE através de pigmentos fracionados (como Azul Esverdeado ou Combo de Roxo), conforme indicado na matriz Semida.",
    tag: "Alerta Crítico",
  },
  {
    question: "Quando é obrigatório aplicar verniz na chapa de teste?",
    answer:
      "Para cores metálicas, perolizadas e qualquer acabamento bicamada, o verniz altera drasticamente a refração da luz, o contraste do flop e a intensidade das partículas de efeito. Avaliar uma chapa sem verniz contra um carro envernizado gera um falso diagnóstico. A Chapa 01 e a Chapa Final devem obrigatoriamente receber a camada de verniz catalisado e seco.",
    tag: "Cabine de Teste",
  },
  {
    question: "Qual a diferença prática entre pesagem 'Individual' e 'Acumulada'?",
    answer:
      "No modo Individual, você zera (tara) a balança antes de despejar cada componente. É ideal para evitar erros de cálculo mental. No modo Acumulado, a balança soma o peso total progressivamente (ex: 50g da base A + 30g da base B = 80g no visor). O sistema permite escolher o modo da sua preferência e calcula os valores correspondentes automaticamente.",
    tag: "Balança",
  },
  {
    question: "O que significa o termo 'virar a cor' e como evitar?",
    answer:
      "'Virar a cor' ocorre quando o colorista adiciona uma quantidade de pigmento superior à tolerância da mistura, fazendo o matiz saltar para o lado oposto sem retorno. Para evitar isso, aplique sempre micro-dosagens (gotas contadas com registro a cada 0.01g) e registre cada iteração no sistema antes de aplicar a chapa.",
    tag: "Prevenção de Perdas",
  },
  {
    question: "Como o Banco de Cores ajuda a oficina a lucrar mais tempo?",
    answer:
      "Quando um ajuste é aprovado, o sistema congela a fórmula final somando todas as correções efetuadas e armazena o registro no Banco de Cores (/bank). Quando outro veículo da mesma cor ou montadora chegar à oficina, basta buscar a fórmula ajustada para pesar a tinta pronta, eliminando retrabalho de testes e economizando horas de cabine.",
    tag: "Produtividade",
  },
];

export function HelpView() {
  const [activeTab, setActiveTab] = useState<TabKey>("steps");
  const [selectedTone, setSelectedTone] = useState<string>("TODOS");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredSemida =
    selectedTone === "TODOS"
      ? semidaRules
      : semidaRules.filter((r) => r.tone.toUpperCase() === selectedTone);

  return (
    <div className="help-page">
      <Heading
        eyebrow="DOCUMENTAÇÃO & DIRETRIZES TÉCNICAS"
        title="Manual do Usuário & Central de Ajuda"
        description="Guia prático passo a passo para a operação colorimétrica na oficina, do cadastro da fórmula à aprovação no Banco de Cores."
      >
        <a
          href="/api/manual"
          download="MANUAL_DO_USUARIO.pdf"
          className="button primary"
          title="Baixar Manual completo em PDF de alta qualidade"
        >
          <Download size={17} />
          Baixar Manual em PDF
        </a>
        <Link href="/compass" className="button secondary">
          <Compass size={17} />
          Bússola Cromática
        </Link>
      </Heading>

      {/* Principle Summary Banners */}
      <section className="help-summary-grid">
        <div className="help-summary-card highlight">
          <div className="help-card-icon">
            <Compass size={24} />
          </div>
          <div>
            <span className="help-card-tag">REGRA DE OURO</span>
            <h4>Método Primeiro Ângulo</h4>
            <p>
              A correção sempre começa pelo <strong>Ângulo (Flop 45°/110°)</strong>.
              Os pigmentos sólidos governam o ângulo na chapa. Se o ângulo fechar,
              a frente tende a fechar sozinha.
            </p>
          </div>
        </div>

        <div className="help-summary-card">
          <div className="help-card-icon">
            <Sparkles size={24} />
          </div>
          <div>
            <span className="help-card-tag">FÓRMULA SEMIDA</span>
            <h4>4 Tons & Cortes Matemáticos</h4>
            <p>
              Diagnóstico preciso sobre <strong>Amarelo, Azul, Verde e Vermelho</strong>.
              Cada desvio é neutralizado pelo pigmento fracionado oposto exato,
              sem perda de saturação.
            </p>
          </div>
        </div>

        <div className="help-summary-card warning">
          <div className="help-card-icon">
            <ShieldAlert size={24} />
          </div>
          <div>
            <span className="help-card-tag">SEGURANÇA COLORIMÉTRICA</span>
            <h4>Zero Contaminação</h4>
            <p>
              <strong>Nunca</strong> adicione azul direto em amarelo (cria verde/lama)
              nem vermelho direto em verde (cria marrom opaco). O corte deve ser
              sempre fracionado.
            </p>
          </div>
        </div>

        <div className="help-summary-card">
          <div className="help-card-icon">
            <Scale size={24} />
          </div>
          <div>
            <span className="help-card-tag">RASTREABILIDADE</span>
            <h4>Balança em Tempo Real</h4>
            <p>
              Controle estrito de pesagem (<strong>0.01 g</strong>), registro fotográfico
              de chapas e arquivamento automático da fórmula ajustada no Banco de Cores.
            </p>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="help-tabs-nav">
        <button
          className={`help-tab-btn ${activeTab === "steps" ? "active" : ""}`}
          onClick={() => setActiveTab("steps")}
        >
          <Layers size={17} />
          <span>Fluxo em 6 Etapas</span>
        </button>

        <button
          className={`help-tab-btn ${activeTab === "semida" ? "active" : ""}`}
          onClick={() => setActiveTab("semida")}
        >
          <Compass size={17} />
          <span>Fórmula Secreta Semida</span>
        </button>

        <button
          className={`help-tab-btn ${activeTab === "rules" ? "active" : ""}`}
          onClick={() => setActiveTab("rules")}
        >
          <AlertTriangle size={17} />
          <span>Regras de Oposição</span>
        </button>

        <button
          className={`help-tab-btn ${activeTab === "tools" ? "active" : ""}`}
          onClick={() => setActiveTab("tools")}
        >
          <BookOpen size={17} />
          <span>Atalhos do Sistema</span>
        </button>

        <button
          className={`help-tab-btn ${activeTab === "faq" ? "active" : ""}`}
          onClick={() => setActiveTab("faq")}
        >
          <CircleHelp size={17} />
          <span>Perguntas Frequentes</span>
        </button>
      </div>

      {/* TAB CONTENT: STEPS */}
      {activeTab === "steps" && (
        <section className="help-section">
          <div className="help-section-header">
            <div>
              <h3>Fluxo Operacional em 6 Etapas da Oficina</h3>
              <p>
                Roteiro sequencial padronizado para conduzir qualquer acerto de cor do
                início ao fim com zero desperdício de tinta.
              </p>
            </div>
            <a
              href="/api/manual"
              download="MANUAL_DO_USUARIO.pdf"
              className="button secondary small"
            >
              <Download size={14} />
              PDF para impressão
            </a>
          </div>

          <div className="help-timeline">
            {stepsData.map((step) => (
              <div key={step.number} className="help-step-card">
                <div className="help-step-aside">
                  <span className="help-step-number">{step.number}</span>
                  <Badge kind="primary">{step.badge}</Badge>
                </div>

                <div className="help-step-body">
                  <div className="help-step-title-row">
                    <h4>{step.title}</h4>
                    <span className="help-step-sub">{step.subtitle}</span>
                  </div>

                  <p className="help-step-desc">{step.description}</p>

                  <div className="help-step-checklist">
                    <strong>Checklist operacional:</strong>
                    <ul>
                      {step.checklist.map((item, idx) => (
                        <li key={idx}>
                          <CheckCircle2 size={15} className="help-check-icon" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {step.tip && (
                    <div className="help-step-tip">
                      <Lightbulb size={16} />
                      <span>
                        <strong>Dica do Mestre:</strong> {step.tip}
                      </span>
                    </div>
                  )}

                  {step.link && (
                    <div className="help-step-action">
                      <Link href={step.link.href} className="button secondary small">
                        {step.link.label}
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB CONTENT: SEMIDA */}
      {activeTab === "semida" && (
        <section className="help-section">
          <div className="help-section-header">
            <div>
              <h3>Matriz da Fórmula Secreta Semida</h3>
              <p>
                Consulte as regras de neutralização e corte conforme o Tom Principal e
                a direção do subtom observado no ângulo rasante.
              </p>
            </div>
            <div className="help-tone-filters">
              {["TODOS", "AMARELO", "AZUL", "VERDE", "VERMELHO"].map((tone) => (
                <button
                  key={tone}
                  className={`button small ${selectedTone === tone ? "primary" : "secondary"}`}
                  onClick={() => setSelectedTone(tone)}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div className="help-semida-grid">
            {filteredSemida.map((rule, idx) => (
              <div key={idx} className="help-semida-card">
                <div className="help-semida-header">
                  <span
                    className="help-tone-pill"
                    style={{
                      borderColor: rule.toneColor,
                      color: rule.toneColor,
                    }}
                  >
                    Tom: {rule.tone}
                  </span>
                  <span className="help-dir-label">{rule.direction}</span>
                </div>

                <div className="help-semida-cut-box">
                  <small>PIGMENTO DE CORTE INDICADO:</small>
                  <strong>{rule.cutPigment}</strong>
                </div>

                <p className="help-semida-desc">{rule.details}</p>

                <div className="help-semida-alert">
                  <ShieldAlert size={14} />
                  <span>{rule.avoid}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="help-callout">
            <Compass size={22} />
            <div>
              <strong>Deseja consultar no disco interativo?</strong>
              <p>
                A Bússola da Colorimetria tem doze posições: quatro tons
                fundamentais e oito direções de subtom. Escolha pelo disco, pelos
                botões ou pelo teclado; o painel mostra os pigmentos de corte da
                regra vigente na sua oficina.
              </p>
            </div>
            <Link href="/compass" className="button primary">
              Abrir Bússola Interativa
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* TAB CONTENT: RULES */}
      {activeTab === "rules" && (
        <section className="help-section">
          <div className="help-section-header">
            <div>
              <h3>Regras de Oposição & Riscos de Contaminação</h3>
              <p>
                Princípios de física óptica e química que evitam perdas irreparáveis de
                tinta e horas perdidas na bancada.
              </p>
            </div>
          </div>

          <div className="help-rules-grid">
            <div className="help-rule-card danger">
              <div className="help-rule-title">
                <ShieldAlert size={22} />
                <h4>PROIBIÇÃO 1: Azul Direto em Amarelo</h4>
              </div>
              <p>
                <strong>O que acontece:</strong> A adição de azul direto sobre uma tinta
                amarela reage criando um verde descontrolado e uma camada acinzentada
                opaca (“lama”).
              </p>
              <div className="help-rule-remedy">
                <strong>Correção correta:</strong> Se o amarelo está avermelhado, use
                <strong> Azul Esverdeado</strong>. Se o amarelo está esverdeado, use
                <strong> Azul Avermelhado</strong> ou <strong>Combo de Roxo (Violeta)</strong>.
              </div>
            </div>

            <div className="help-rule-card danger">
              <div className="help-rule-title">
                <ShieldAlert size={22} />
                <h4>PROIBIÇÃO 2: Vermelho Direto em Verde</h4>
              </div>
              <p>
                <strong>O que acontece:</strong> Vermelho e verde em doses puras anulam a
                luminosidade e convertem o matiz em marrom terra fechado e sem brilho.
              </p>
              <div className="help-rule-remedy">
                <strong>Correção correta:</strong> Para verde amarelado, use <strong>Violeta Roxo</strong>.
                Para verde azulado, aplique a combinação dupla <strong>Violeta Roxo + Óxido Vermelho</strong>.
              </div>
            </div>

            <div className="help-rule-card warning">
              <div className="help-rule-title">
                <Scale size={22} />
                <h4>Risco de Virar a Cor (Micro-dosagem)</h4>
              </div>
              <p>
                Em recipientes pequenos (100g a 250g), <strong>uma única gota</strong>
                pesa aproximadamente <code>0.02g a 0.04g</code>. Esse peso pode ser mais que o
                suficiente para ultrapassar o ponto de equilíbrio.
              </p>
              <div className="help-rule-remedy">
                <strong>Boas práticas:</strong> Pese a cada gota. Adicione 50% da dose estimada,
                faça o teste na chapa e só adicione o restante se necessário.
              </div>
            </div>

            <div className="help-rule-card info">
              <div className="help-rule-title">
                <Lightbulb size={22} />
                <h4>Iluminação e Metamerismo</h4>
              </div>
              <p>
                Cores avaliadas sob luz incandescente amarela ou lâmpadas fluorescentes
                comuns apresentam distorção visual severa (metamerismo).
              </p>
              <div className="help-rule-remedy">
                <strong>Padrão da oficina:</strong> Utilize luz solar direta às 10h–15h ou
                luminária de cabine com temperatura de cor calibrada entre <strong>5000K e 6500K</strong> (CRI &gt; 90).
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB CONTENT: TOOLS */}
      {activeTab === "tools" && (
        <section className="help-section">
          <div className="help-section-header">
            <div>
              <h3>Guia Rápido dos Módulos do Sistema</h3>
              <p>
                Navegue com facilidade entre as ferramentas especializadas do Mestre da Colorimetria.
              </p>
            </div>
          </div>

          <div className="help-tools-grid">
            <div className="help-tool-card">
              <div className="help-tool-icon">
                <FlaskConical size={24} />
              </div>
              <h4>Meus Ajustes (/sessions)</h4>
              <p>
                Acompanhamento em tempo real de todas as sessões de tintas abertas na
                oficina, iterações de correções e status de aprovação.
              </p>
              <Link href="/sessions" className="button secondary small">
                Acessar Meus Ajustes <ArrowRight size={14} />
              </Link>
            </div>

            <div className="help-tool-card">
              <div className="help-tool-icon">
                <Compass size={24} />
              </div>
              <h4>Bússola da Colorimetria (/compass)</h4>
              <p>
                Disco interativo com os 4 tons fundamentais, as 8 direções de
                subtom e os pigmentos de corte da regra vigente.
              </p>
              <Link href="/compass" className="button secondary small">
                Abrir Bússola <ArrowRight size={14} />
              </Link>
            </div>

            <div className="help-tool-card">
              <div className="help-tool-icon">
                <Library size={24} />
              </div>
              <h4>Banco de Cores (/bank)</h4>
              <p>
                Catálogo permanente de fórmulas acertadas e aprovadas pela oficina, com
                pesquisa rápida por código, montadora e modelo.
              </p>
              <Link href="/bank" className="button secondary small">
                Explorar Banco de Cores <ArrowRight size={14} />
              </Link>
            </div>

            <div className="help-tool-card">
              <div className="help-tool-icon">
                <FileText size={24} />
              </div>
              <h4>Fórmulas Originais (/formulas)</h4>
              <p>
                Cadastro das fórmulas padrão enviadas pelas montadoras e fabricantes de
                tinta antes de qualquer ajuste local.
              </p>
              <Link href="/formulas" className="button secondary small">
                Ver Fórmulas <ArrowRight size={14} />
              </Link>
            </div>

            <div className="help-tool-card">
              <div className="help-tool-icon">
                <BookOpen size={24} />
              </div>
              <h4>Biblioteca de Pigmentos (/pigments)</h4>
              <p>
                Tabela de todas as bases e pigmentos disponíveis na oficina, com suas
                propriedades de cobertura e transparência.
              </p>
              <Link href="/pigments" className="button secondary small">
                Ver Pigmentos <ArrowRight size={14} />
              </Link>
            </div>

            <div className="help-tool-card">
              <div className="help-tool-icon">
                <History size={24} />
              </div>
              <h4>Histórico de Ajustes (/history)</h4>
              <p>
                Rastreabilidade e auditoria completa de todas as pesagens, testes e chapas
                já realizadas na oficina.
              </p>
              <Link href="/history" className="button secondary small">
                Ver Histórico <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* TAB CONTENT: FAQ */}
      {activeTab === "faq" && (
        <section className="help-section">
          <div className="help-section-header">
            <div>
              <h3>Perguntas Frequentes & Solução de Dúvidas</h3>
              <p>
                Respostas práticas para as situações mais comuns enfrentadas na cabine e
                na bancada de pesagem.
              </p>
            </div>
          </div>

          <div className="help-faq-list">
            {faqData.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`help-faq-item ${isOpen ? "open" : ""}`}
                >
                  <button
                    className="help-faq-question"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <div className="help-faq-q-text">
                      <Badge kind="primary">{item.tag}</Badge>
                      <strong>{item.question}</strong>
                    </div>
                    <div className="help-faq-chevron">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="help-faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
