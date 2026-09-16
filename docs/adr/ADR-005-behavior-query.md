# ADR-005 — Consulta de comportamento determinística

Status: aceito.

O profissional precisa perguntar, em português, por uma base que produza um efeito na frente e outro no ângulo ("amarele a frente e deixe o ângulo azul"). A busca textual da biblioteca procurava a frase inteira e não separava as vistas.

Decisão: interpretar a pergunta com vocabulário explícito e regras de associação à vista, sem LLM nem serviço externo. A interpretação produz critérios estruturados por vista, mostrados e editáveis na tela. O servidor valida os critérios, lê os comportamentos atuais da oficina da sessão e classifica as bases em completas, parciais e só com registro geral, com explicação por condição.

Motivos:

- Os exemplos de uso cabem em um vocabulário pequeno e conhecido; o resultado é reproduzível e testável.
- Produto, código, propriedades e fonte vêm só do banco. Não há texto gerado que possa inventar código ou descrição (o chatbot do vídeo trocou HS 740 por HS 739 e "Amarelado sujo" por "Amarelo esverdeado").
- Ambiguidade vira pergunta objetiva na tela, não palpite.
- Nenhum dado da oficina sai do servidor.

Consequências: frases fora do vocabulário não são entendidas e pedem ajuste pelos controles. Ampliar a linguagem é editar o léxico e acrescentar testes. Um LLM poderia, no futuro, apenas propor critérios estruturados, que continuariam validados e visíveis antes da consulta.

A consulta é somente leitura: não registra adição, não altera massa, fórmula, sessão ou `Pigment.characteristic`, e não calcula dose.
