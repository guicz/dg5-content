# DG5 Content Intelligence

MVP interno da DG5 para organizar conhecimento de clientes, Brand Brain, planejamento editorial, produção textual, criativos manuais, revisão por IA e aprovação interna.

## Estado atual

- Frontend React + Vite com layout responsivo e identidade DG5.
- Firebase Authentication com acesso restrito a contas `@dg5.com.br`.
- Firestore como fonte de verdade dos módulos operacionais.
- Cloud Storage para documentos internos e criativos.
- Cloud Functions para geração, revisão textual, Brand Brain, direção de arte e auditoria em `AILog`.
- AI Gateway com OpenAI, Claude e Gemini; sem chave, o ambiente local usa fallback identificado.
- Função diária para detectar posts Meta vencidos, criar notificações e gravar e-mail na coleção `mail`.
- Regras de segurança para Firestore e Storage.
- Emuladores locais de Auth, Firestore, Functions, Pub/Sub e Storage.

## Ambiente publicado

- URL: `https://dg5-content-intelligence.web.app`
- Projeto Firebase: `dg5-content-intelligence`
- Região do Firestore: `southamerica-east1`
- Ativos no ambiente remoto: Hosting, Authentication com Google, Firestore, Storage, regras, índices, cinco Cloud Functions, Secret Manager e Scheduler diário.
- Funções em produção: `generateContent`, `reviewContent`, `generateBrandBrain`, `reviewCreative` e `checkMetaScheduling`.
- OpenAI e Gemini configurados com segredos reais no backend.
- Pendentes: chave da Anthropic e serviço que consumirá a coleção `mail`.

O backend está operacional. Para qualquer provedor ainda sem chave, os agentes usam o fallback determinístico identificado no sistema e não fazem chamadas pagas.

### Padrões do AI Gateway

- Geração e revisão textual em testes: OpenAI `gpt-5-nano`.
- Brand Brain e revisão visual em testes: Google `gemini-3.1-flash-lite`.
- Alternativa Anthropic quando configurada: `claude-haiku-4-5`.
- Roteamento: adaptativo por tarefa, cliente e desempenho histórico.
- Controles de teste: raciocínio mínimo e limite de 2.200 tokens de saída por chamada.

### Estimativa direta de IA em 10/07/2026

Premissas: OpenAI `gpt-5-nano` a US$ 0,05/1 milhão de tokens de entrada e US$ 0,40/1 milhão de saída; Gemini `gemini-3.1-flash-lite` a US$ 0,25/1 milhão de entrada e US$ 1,50/1 milhão de saída.

- Geração textual com 5.000 tokens de entrada e 1.500 de saída: cerca de US$ 0,00085.
- Revisão textual com 3.000 tokens de entrada e 800 de saída: cerca de US$ 0,00047.
- Revisão visual com 5.000 tokens de entrada e 1.000 de saída: cerca de US$ 0,00275.
- Ciclo completo de um conteúdo: cerca de US$ 0,00407; 100 ciclos: US$ 0,407, aproximadamente R$ 2,24 com câmbio assumido de R$ 5,50.
- Brand Brain inicial com 30.000 tokens de entrada e 2.000 de saída: cerca de US$ 0,01050 por cliente.

Valores aproximados, sem Firebase, Storage, e-mail, impostos ou variação de tokens de imagens/documentos. Referências: [OpenAI](https://developers.openai.com/api/docs/models/gpt-5-nano) e [Gemini](https://ai.google.dev/gemini-api/docs/gemini-3).

## Rodar localmente

Pré-requisitos: Node 22, pnpm e Java 21. Nesta máquina, o Java 21 portátil está em `.tools/` e não altera a instalação do Windows.

```powershell
cd C:\Users\Bruna\Documents\Codex\2026-07-09\le\work\dg5-content-intelligence
pnpm install
.\scripts\start-local.ps1
```

- Aplicação: `http://localhost:5177/`
- Firebase Emulator UI: `http://localhost:4000/`

## Ativar IA e envio de e-mail

1. OpenAI e Gemini já estão ativos. Para incluir Claude no roteamento, configurar o segredo restante:

```powershell
firebase functions:secrets:set ANTHROPIC_API_KEY
```

2. Reimplantar as Functions para vincular as novas versões dos segredos.
3. Instalar/configurar a extensão Trigger Email ou outro consumidor para a coleção `mail`.

## Comandos de validação

```powershell
pnpm test
pnpm --filter dg5-content-intelligence-functions test
pnpm build
```

## Limites conscientes do MVP

- Cliente aprova fora da plataforma; o operador registra o retorno.
- Agendamento no Meta é manual.
- A revisão visual é consultiva e aceita imagens; PDF criativo deve ser convertido em imagem.
- Documentos enviados ao Brand Brain são processados diretamente pelo Gemini quando ele é o provedor configurado e a chave existe.
- Sem provedor de e-mail configurado, o backend cria a notificação e a mensagem em `mail`, mas não envia externamente.
