# ADR-003 — Decimal e integridade da massa

Status: aceito.

Entradas e transporte JSON usam strings decimais com ponto; a interface aceita vírgula nos pesos operacionais. Decimal.js calcula incrementos, somas e doses. PostgreSQL guarda massas em NUMERIC(16,4), coeficientes em NUMERIC(16,6).

Pesos não são calculados com Number no backend. Number aparece apenas em validações de faixa pequena e formatação visual; não produz massa persistida. Até quatro casas são aceitas para adições. Apresentação padrão é 0,01 g, configurável entre zero e quatro casas; os registros mantêm a precisão original.

Transações com bloqueio da sessão e versão otimista impedem adições duplicadas e aprovação concorrente. Cada escrita de chapa também incrementa a versão.
