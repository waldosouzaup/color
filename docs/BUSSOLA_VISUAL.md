# Contrato visual da Bússola da Colorimetria

Este documento descreve o que o instrumento desenha, de onde vieram as medidas e
o que ainda não está comprovado. Ele complementa `COLORIMETRY_DOMAIN.md`, que
continua sendo a autoridade sobre regras, dosagem e invariantes.

## 1. Origem das medidas

A geometria foi obtida por medição de pixels em `aplicativo.jpeg` (captura de
720 × 1600 px com dois discos). O procedimento está reproduzido nos scripts de
análise usados na tarefa: varredura radial para achar contorno e anel, detecção
de blocos saturados para as esferas e varredura angular para divisórias e setas.

Disco superior: centro em (356,3; 423,7); raio horizontal 332,5 px e vertical
350 px. A diferença é **deformação elíptica da captura**, não um requisito: o
SVG usa geometria circular e a comparação normaliza a elipse antes de medir.

| Elemento | Medida na referência | Proporção usada no SVG |
| --- | --- | --- |
| Anel interno | 231 px | 0,677 do raio |
| Pivô preto | 30 px | 0,088 |
| Esfera de tom fundamental | centro a 284 px, raio 41 px | 0,835 e 0,121 |
| Esfera de subtom | centro a 298 px, raio 31 px | 0,875 e 0,090 |
| Esferas de pigmento (banda interna) | raio 16 px, centros entre 95 e 213 px | 0,047 e 0,31–0,61 |
| Setas do pivô | ponta a 68 px | 0,105 → 0,20 |

Limites angulares medidos na banda externa: 0,1 · 28,9 · 58,3 · 89,6 · 121,4 ·
151,1 · 179,9 · 208,8 · 238,6 · 270,4 · 301,8 · 331,4. São doze divisórias de
aproximadamente 30°, com desvio máximo de 1,7° em relação aos múltiplos exatos —
compatível com a deformação da captura. O desenho adota os múltiplos de 30°.

## 2. Composição

- **Disco superior (cromático):** contorno escuro, doze setores de 30°, anel
  interno em 0,677 do raio, fundos pastel por família, quatro esferas grandes de
  tom fundamental, oito esferas médias de subtom, rótulos radiais, pigmentos
  menores na banda interna, oito setas curtas partindo do pivô e pivô preto.
- **Disco inferior (identidade):** dois quadrantes opacos com a identidade
  gráfica (superior esquerdo e inferior direito), dois quadrantes claros
  divididos em três setores de 30° cada, abertura circular central de 0,099 do
  raio. É apresentado **separado**, abaixo do disco cromático, como na captura.
- O disco permanece claro nos dois temas da aplicação; o tema muda o entorno,
  nunca as amostras de cor.

### Posições (0° no topo, sentido horário)

| Centro | Elemento | Chave de regra |
| --- | --- | --- |
| 15° | Amarelo fundamental | — (família) |
| 45° | Amarelo avermelhado | `YELLOW:REDISH` |
| 75° | Azul avermelhado | `BLUE:REDISH` |
| 105° | Azul fundamental | — (família) |
| 135° | Azul esverdeado | `BLUE:GREENISH` |
| 165° | Vermelho amarelado | `RED:YELLOWISH` |
| 195° | Vermelho fundamental | — (família) |
| 225° | Vermelho azulado | `RED:BLUISH` |
| 255° | Verde azulado | `GREEN:BLUISH` |
| 285° | Verde fundamental | — (família) |
| 315° | Verde amarelado | `GREEN:YELLOWISH` |
| 345° | Amarelo esverdeado | `YELLOW:GREENISH` |

Doze elementos gráficos, oito associações operacionais. São posições gráficas
idealizadas do desenho, **não** ângulos físicos medidos na chapa nem graus de
desvio colorimétrico.

## 3. Arte impressa × matriz operacional

A banda interna reproduz as inscrições do desenho original. Elas **não** são a
recomendação do sistema: o painel ao lado do disco mostra sempre as saídas da
regra vigente da oficina. Onde a arte diverge da matriz documentada, a
divergência fica registrada aqui e a matriz prevalece.

| Setor | Inscrições da arte (do anel para o centro) | Matriz operacional | Situação |
| --- | --- | --- | --- |
| Amarelo avermelhado | Amarelo esverdeado · Azul esverdeado | Azul esverdeado | arte acrescenta um pigmento |
| Azul avermelhado | Combo de roxo · Vermelho transparente · Vermelho óxido (letras F e A) | Amarelo limão | **divergente** |
| Azul esverdeado | Combo de roxo · Vermelho óxido | Óxido vermelho ou violeta | coincide |
| Vermelho amarelado | Combo de roxo · Vermelho óxido | Azul avermelhado ou violeta | coincide em parte |
| Vermelho azulado | Combo de roxo · Azul esverdeado | Amarelo limão | **divergente** |
| Verde azulado | Amarelo esverdeado · Amarelo óxido · Vermelho óxido (letra V) | Violeta + óxido vermelho, ambos obrigatórios | coincide em parte |
| Verde amarelado | Vermelho transparente · Vermelho óxido · Combo de roxo (letras F e A) | Violeta, com suporte vermelho opcional | coincide em parte |
| Amarelo esverdeado | Combo de roxo · Azul esverdeado | Azul avermelhado ou violeta | coincide em parte |

Correspondências de nome adotadas, por estarem explícitas nas fontes do projeto:
combo de roxo = violeta, azul esverdeado = `BLUE_GREEN`, vermelho óxido =
`RED_OXIDE`, amarelo esverdeado = amarelo limão (`LEMON_YELLOW`). **Vermelho
transparente** e **amarelo óxido** não têm identificador equivalente no domínio e
ficam apenas como inscrição da arte.

A imagem `Sem título.jpeg`, na raiz, mostra outro agrupamento ainda: para
vermelho amarelado ela indica azul esverdeado, o que também diverge da matriz.
Nenhuma dessas divergências foi transformada em regra.

## 4. Letras e setas

As letras **F**, **A** (setores de azul avermelhado e verde amarelado) e **V**
(verde azulado), com o arco curvo ao lado, aparecem na arte sem legenda. Nenhuma
fonte do projeto — aula, livro, manual ou ADRs — explica sua função. São
reproduzidas como inscrição, sem interpretação. As oito setas curtas partem do
pivô, uma por setor de subtom, e terminam a 0,20 do raio.

## 5. Interação

- Clique, toque ou caneta selecionam o setor imediatamente no `pointerdown`.
- Arraste contínuo acompanha o ponteiro; a captura fica no próprio SVG e é
  liberada em `pointerup`, `pointercancel` e `lostpointercapture`. Um ponteiro
  por gesto; o pivô não seleciona.
- Teclado: o disco é um único ponto de foco. Setas percorrem os doze setores no
  sentido horário/anti-horário, Home e End vão ao primeiro e ao último,
  Enter/Espaço confirmam a posição atual.
- Controles HTML equivalentes: quatro botões de tom fundamental e oito de
  direção, com o mesmo estado do disco.
- Selecionar um tom fundamental escolhe a **família** e apresenta seus dois
  subtons; não resolve pigmento algum.
- A leitura completa aparece em HTML, fora dos rótulos minúsculos do SVG, e é
  anunciada por região `aria-live`.
- `prefers-reduced-motion` desliga transições. O bloqueio de gestos vale só para
  o desenho, então a página continua rolando pelos demais controles.

## 6. Adaptação por escala

Miniatura, página e modal usam a mesma geometria. Na miniatura (`sm`) os rótulos
não são desenhados; na página (`md`) aparecem os nomes de tom e subtom; no modal
(`xl`) também as inscrições miúdas da arte. Abaixo de 900 px de viewport as
inscrições miúdas somem do mostrador ampliado. Nenhuma informação operacional
depende delas: o painel textual acompanha todas as escalas.

## 7. Pendências declaradas

1. **Mecânica do segundo disco.** A imagem não demonstra se ele é máscara, capa,
   verso ou peça móvel, se as áreas claras são transparentes ou qual camada gira.
   Enquanto não houver fonte, os discos ficam separados e a consulta acontece no
   disco cromático. Confirmar esse comportamento é a única decisão pendente de
   produto para a bússola.
2. **Arte de marca do segundo disco.** Não existe no projeto asset vetorial ou
   raster em resolução suficiente. Os quadrantes escuros trazem os nomes em
   vetor, sem a arte de respingos da referência.
3. **Inscrições da arte divergentes da matriz**, listadas na seção 3.
4. **Significado de F, A e V**, sem fonte.
