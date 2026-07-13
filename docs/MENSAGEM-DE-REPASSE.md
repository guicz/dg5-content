# Mensagem de repasse

**Assunto:** Handoff tecnico - DG5 Content Intelligence

Ola,

Conforme solicitado, segue o projeto existente para avaliacao tecnica e definicao do que pode ser reaproveitado com seguranca.

- Repositorio: <https://github.com/guicz/dg5-content>
- Tag do handoff: `handoff-2026-07-13`
- Ambiente de teste: <https://dg5-content-intelligence.web.app>
- Guia tecnico: `docs/HANDOFF-TECNICO.md`
- Inventario funcional: `docs/FUNCIONALIDADES.md`
- Modelo de dados: `docs/MODELO-DE-DADOS.md`
- Amostra anonimizada: `docs/amostra-dados-anonimizada.json`

O ZIP enviado foi gerado somente com arquivos versionados. Ele nao inclui chaves, valores do Secret Manager, `.env` local, dados exportados, logs, builds ou dependencias instaladas.

O seed atual esta anonimizado. Como o repositorio remoto e publico e o historico anterior preserva os nomes usados no prototipo, o ZIP e a opcao mais saneada para criar um novo repositorio privado sem carregar esse historico.

O frontend esta em `src/` e o backend em `functions/`. Nao existe um servico Cloud Run separado: as Cloud Functions de segunda geracao usam servicos Cloud Run gerenciados pelo Firebase.

OpenAI e Gemini estao configurados no ambiente atual. A Anthropic ainda nao possui chave real. Os nomes das variaveis e dos segredos, sem valores, estao documentados no handoff.

O acesso ao repositorio nao concede acesso ao Firebase/GCP. Caso seja necessario atuar no ambiente atual, as permissoes de IAM serao concedidas separadamente. Para a primeira avaliacao, recomendamos executar o projeto com os emuladores ou em um Firebase de desenvolvimento proprio.

Pontos ainda incompletos, como papeis separados, multiplas aprovacoes, Memoria Viva/RAG, feedback externo, envio de e-mail e agendamento automatico, estao descritos no inventario para evitar que sejam confundidos com funcionalidades prontas.

Por favor, confirmem o recebimento e retornem com:

1. quais modulos podem ser incorporados como estao;
2. quais precisam de refatoracao;
3. quais devem ser reconstruidos;
4. quais acessos de infraestrutura serao necessarios na proxima etapa.
