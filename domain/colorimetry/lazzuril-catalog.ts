import type { PigmentCharacteristic } from "./types";

export interface LazzurilBehaviorDef {
  view: "FRONT" | "ANGLE" | "GENERAL";
  hueCharacteristic?: string;
  lightnessEffect?: string;
  cleanlinessEffect?: string;
  particleEffect?: string;
  notes?: string;
  source: string;
  sourceReference: string;
}

export interface LazzurilBaseDef {
  code: string;
  name: string;
  systemType: "Poliéster" | "Poliuretano";
  manufacturer: string;
  productLine: string;
  family: "Lisas" | "Alumínio" | "Pérola" | "Efeito" | "Aditivo";
  characteristic?: PigmentCharacteristic;
  description: string;
  behaviors: LazzurilBehaviorDef[];
}

const SOURCE = "Sherwin-Williams / Lazzuril";
const REFERENCE = "Tabela Características das Cores Básicas (05.jpeg)";

function polyesterBase(
  name: string,
  code: string,
  family: LazzurilBaseDef["family"],
  frontDesc: string,
  angleDesc: string,
  characteristic?: PigmentCharacteristic,
  extraNotes = "",
): LazzurilBaseDef {
  return {
    code,
    name,
    systemType: "Poliéster",
    manufacturer: "Sherwin-Williams",
    productLine: "Lazzuril Base Poliéster",
    family,
    characteristic,
    description: `Frente: ${frontDesc} · Ângulo: ${angleDesc}`,
    behaviors: [
      {
        view: "FRONT",
        hueCharacteristic: frontDesc,
        notes: extraNotes,
        source: SOURCE,
        sourceReference: REFERENCE,
      },
      {
        view: "ANGLE",
        hueCharacteristic: angleDesc,
        notes: extraNotes,
        source: SOURCE,
        sourceReference: REFERENCE,
      },
    ],
  };
}

function polyurethaneBase(
  name: string,
  code: string,
  generalDesc: string,
  characteristic?: PigmentCharacteristic,
  extraNotes = "",
): LazzurilBaseDef {
  return {
    code,
    name,
    systemType: "Poliuretano",
    manufacturer: "Sherwin-Williams",
    productLine: "Lazzudur Poliuretano",
    family: "Lisas",
    characteristic,
    description: generalDesc,
    behaviors: [
      {
        view: "GENERAL",
        hueCharacteristic: generalDesc,
        notes: extraNotes,
        source: SOURCE,
        sourceReference: REFERENCE,
      },
    ],
  };
}

export const lazzurilPolyesterCatalog: readonly LazzurilBaseDef[] = [
  polyesterBase("Branco Neve", "HS 700 / LM 400", "Lisas", "Clareia cores lisas", "Claro"),
  polyesterBase("Preto", "HS 701 / LM 401", "Lisas", "Escurece e suja", "Escurece e suja"),
  polyesterBase("Branco", "HS 700 / LM 402", "Lisas", "Suja", "Leitoso claro"),
  polyesterBase("Azul Claro", "HS 703 / LM 403", "Lisas", "Azul esverdeado", "Azul esverdeado / limpo", "BLUE_GREEN"),
  polyesterBase("Azul Médio", "HS 704 / LM 404", "Lisas", "Azul avermelhado", "Azul avermelhado / sujo", "RED_BLUE"),
  polyesterBase("Azul Médio Escuro", "HS 705 / LM 405", "Lisas", "Azul levemente avermelhado / limpo", "Azul avermelhado / limpo", "RED_BLUE"),
  polyesterBase("Azul Escuro", "HS 706 / LM 406", "Lisas", "Azul avermelhado / limpo", "Azul avermelhado / limpo", "RED_BLUE"),
  polyesterBase("Azul", "HS 708 / LM 408", "Lisas", "Azul esverdeado / limpo", "Azul esverdeado / limpo", "BLUE_GREEN"),
  polyesterBase("Vermelho Claro", "HS 709 / LM 409", "Lisas", "Vermelho amarelado", "Vermelho amarelado"),
  polyesterBase("Vermelho Médio", "HS 710 / LM 410", "Lisas", "Vermelho", "Vermelho"),
  polyesterBase("Laranja", "HS 712 / LM 412", "Lisas", "Laranja", "Laranja"),
  polyesterBase("Vermelho Transparente", "HS 713 / LM 413", "Lisas", "Amarelo avermelhado", "Dourado"),
  polyesterBase("Óxido de Ferro Vermelho", "HS 714 / LM 414", "Lisas", "Avermelhado", "Avermelhado sujo leitoso", "RED_OXIDE"),
  polyesterBase("Laranja Claro", "HS 715 / LM 415", "Lisas", "Laranja limpo", "Laranja limpo"),
  polyesterBase("Vermelho", "HS 716 / LM 416", "Lisas", "Vermelho limpo", "Amarelado"),
  // Sem `characteristic`: `RED_BLUE` é o azul avermelhado do método, não um
  // vermelho de ângulo azulado. Mapear aqui ofereceria esta base como corte
  // de azul avermelhado no formulário de adição.
  polyesterBase("Vermelho Rubi", "HS 717 / LM 417", "Lisas", "Vermelho limpo", "Azulado"),
  polyesterBase("Amarelo Claro", "HS 718 / LM 418", "Lisas", "Amarelo", "Amarelo avermelhado"),
  polyesterBase("Amarelo Transparente", "HS 719 / LM 419", "Lisas", "Amarelado", "Amarelado"),
  polyesterBase("Óxido Ferro Amarelo", "HS 720 / LM 420", "Lisas", "Amarelo", "Amarelo sujo leitoso"),
  polyesterBase("Amarelo Cromato", "HS 721 / LM 421", "Lisas", "Amarelado sujo", "Amarelo esverdeado", "LEMON_YELLOW"),
  polyesterBase("Amarelo Esverdeado", "HS 722 / LM 422", "Lisas", "Amarelo esverdeado", "Amarelo esverdeado", "LEMON_YELLOW"),
  polyesterBase("Vermelho", "HS 723 / LM 423", "Lisas", "Vermelho alaranjado", "Vermelho alaranjado"),
  polyesterBase("Marrom Claro", "HS 725 / LM 425", "Lisas", "Marrom avermelhado", "Amarelado sujo"),
  polyesterBase("Marrom Médio", "HS 726 / LM 426", "Lisas", "Marrom avermelhado", "Marrom avermelhado"),
  polyesterBase("Marrom Ouro", "HS 728 / LM 428", "Lisas", "Vermelho amarelado limpo", "Vermelho amarelado limpo"),
  polyesterBase("Rosa", "HS 729 / LM 429", "Lisas", "Rosa limpo", "Rosa limpo"),
  polyesterBase("Verde Claro", "HS 732 / LM 432", "Lisas", "Verde azulado", "Verde azulado"),
  polyesterBase("Verde Escuro", "HS 733 / LM 433", "Lisas", "Verde amarelado", "Verde amarelado"),
  polyesterBase("Violeta avermelhado", "HS 737 / LM 437", "Lisas", "Violeta azulado", "Violeta azulado", "VIOLET"),
  polyesterBase("Violeta", "HS 739 / LM 439", "Lisas", "Violeta amarelado", "Violeta amarelado", "VIOLET"),
  polyesterBase("Branco Micronizado", "HS 740 / LM 440", "Lisas", "Amarelado sujo", "Azulado leitoso"),
  polyesterBase("Preto Azulado", "HS 741 / LM 441", "Lisas", "Escurece sujo", "Preto azulado intenso escurece"),

  // Alumínios
  polyesterBase("Alumínio Médio", "LM 451", "Alumínio", "Sujo", "Claro"),
  polyesterBase("Alumínio Médio Graúdo", "LM 453", "Alumínio", "Claro", "Escuro"),
  polyesterBase("Alumínio Brilhante", "LM 454", "Alumínio", "Claro", "Claro"),
  polyesterBase("Alumínio Super Graúdo", "HS 755 / LM 493", "Alumínio", "Claro", "Escuro"),
  polyesterBase("Alumínio Graúdo Brilhante", "HS 756 / LM 456", "Alumínio", "Claro brilhante", "Escuro"),
  polyesterBase("Alumínio Super Fino", "HS 757 / LM 457", "Alumínio", "Escuro / sujo", "Claro leitoso"),
  polyesterBase("Alumínio Médio Brilhante", "HS 759 / LM 492", "Alumínio", "Claro", "Escuro"),
  polyesterBase("Gold", "HS 760 / LM 460", "Alumínio", "Claro amarelado", "Amarelado sujo"),
  polyesterBase("Alumínio Extra Fino", "HS 761 / LM 491", "Alumínio", "Claro brilhante", "Claro"),
  polyesterBase("Alumínio Médio Fino", "HS 762 / LM 462", "Alumínio", "Claro", "Claro"),

  // Pérolas
  polyesterBase("Pérola Vermelha Fina", "HS 763 / LM 463", "Pérola", "Avermelhado", "Avermelhado"),
  polyesterBase("Pérola Branca Fina", "HS 764 / LM 464", "Pérola", "Claro", "Claro leitoso"),
  polyesterBase("Pérola Azul Fina", "HS 765 / LM 465", "Pérola", "Azulado", "Azulado limpo"),
  polyesterBase("Pérola Vermelha Graúda", "HS 766 / LM 466", "Pérola", "Avermelhado", "Avermelhado"),
  polyesterBase("Pérola Azul Graúda", "HS 767 / LM 467", "Pérola", "Azulado", "Azulado"),
  polyesterBase("Pérola Prata Brilhante", "HS 768 / LM 468", "Pérola", "Claro", "Claro"),
  polyesterBase("Pérola Dourado Média", "HS 769 / LM 469", "Pérola", "Dourado", "Dourado"),
  polyesterBase("Pérola Violeta", "HS 770 / LM 470", "Pérola", "Violeta", "Violeta"),
  polyesterBase("Pérola Violeta Graúda", "HS 772 / LM 472", "Pérola", "Verde", "Vermelho"),
  polyesterBase("Pérola Verde", "HS 773 / LM 473", "Pérola", "Verde amarelado", "Verde amarelado"),
  polyesterBase("Pérola Violeta Azulada", "HS 774 / LM 474", "Pérola", "Violeta azulado limpo", "Violeta azulado limpo"),
  polyesterBase("Pérola Verde Azulada", "HS 775 / LM 475", "Pérola", "Verde azulado", "Verde azulado"),
  polyesterBase("Pérola Bronze", "HS 776 / LM 476", "Pérola", "Dourado fino", "Dourado fino"),
  polyesterBase("Pérola Rosa", "HS 777 / LM 477", "Pérola", "Rosado", "Rosado"),
  polyesterBase("Pérola Ouro", "HS 778 / LM 478", "Pérola", "Amarelado limpo", "Amarelado limpo"),

  // Efeito e Aditivo
  polyesterBase("Grafite", "HS 779 / LM 479", "Efeito", "Escurece", "Cinza leitoso"),
  polyesterBase("Azul Anil", "HS 790 / LM 490", "Lisas", "Azul avermelhado limpo", "Azul avermelhado limpo", "RED_BLUE"),
  polyesterBase("Aditivo para Efeito Metálico", "AD 500", "Aditivo", "Aumentar a aparência da partícula", "Aumentar a aparência da partícula"),
];

export const lazzurilPolyurethaneCatalog: readonly LazzurilBaseDef[] = [
  polyurethaneBase("Preto", "LP 501 / LL 112 / LS 201 / FC 601", "Escurece"),
  polyurethaneBase("Amarelo Cromo", "LP 503 / LL 133 / LS 203 / FC 603", "Amarelado esverdeado", "LEMON_YELLOW"),
  // "Amarelo óxido" não tem identificador equivalente no domínio; `RED_OXIDE`
  // é o óxido vermelho. Fica sem função de corte, como a inscrição da arte.
  polyurethaneBase("Ocre", "LP 505 / LL 135 / LS 205 / FC 605", "Amarelo óxido sujo"),
  polyurethaneBase("Amarelo", "LP 506 / LL 134 / LS 204 / FC 606", "Amarelo avermelhado"),
  polyurethaneBase("Azul", "LP 507 / LL 136 / LS 207 / FC 608", "Azul esverdeado limpo", "BLUE_GREEN"),
  polyurethaneBase("Azul Escuro", "LP 508 / LL 138 / LS 208 / FC 608", "Azul avermelhado", "RED_BLUE"),
  polyurethaneBase("Preto Profundo", "LP 512", "Escurece preto intenso azulado"),
  polyurethaneBase("Verde Claro", "LP 514", "Verde amarelado"),
  polyurethaneBase("Verde Escuro", "LP 515 / LL 115 / LS 215 / FC 615", "Verde azulado"),
  polyurethaneBase("Laranja", "LP 517 / LL 117 / LS 217 / FC 617", "Alaranjado"),
  polyurethaneBase("Rosa", "LP 519", "Avermelhado"),
  polyurethaneBase("Vermelho Carmim", "LP 521 / FC 621", "Vermelho leitoso"),
  polyurethaneBase("Vermelho Óxido", "LP 523 / LL 143 / LS 223 / FC 623", "Vermelho óxido sujo", "RED_OXIDE"),
  polyurethaneBase("Vermelho Vivo", "LL 124 / LS 224 / FC 624", "Vermelho amarelado sujo"),
  polyurethaneBase("Violeta", "LP 525 / LL 145 / LS 225 / FC 625", "Violeta azulado", "VIOLET"),
  polyurethaneBase("Violeta Azulado", "LP 526 / LL 126 / LS 226 / FC 626", "Violeta amarelado sujo", "VIOLET"),
  polyurethaneBase("Vermelho Claro", "LP 527", "Vermelho alaranjado limpo"),
  polyurethaneBase("Vermelho Rubi", "LP 528", "Vermelho azulado limpo"),
  polyurethaneBase("Vermelho", "LP 529", "Vermelho alaranjado"),
  polyurethaneBase("Branco", "LP 550 / LL 130 / LS 250 / FC 650", "Clarear"),
  polyurethaneBase("Vermelho Escuro", "LL 128 / LS 228 / FC 628", "Vermelho azulado"),
  polyurethaneBase("Amarelo Claro", "LP 511 / LS 211 / FC 611", "Amarelo esverdeado limpo", "LEMON_YELLOW"),
];

export const lazzurilFullCatalog: readonly LazzurilBaseDef[] = [
  ...lazzurilPolyesterCatalog,
  ...lazzurilPolyurethaneCatalog,
];
