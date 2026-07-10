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
- Pendentes: chaves reais da OpenAI, Anthropic e Gemini, além do serviço que consumirá a coleção `mail`.

O backend está operacional. Enquanto os segredos mantiverem o valor seguro `not-configured`, os agentes usam o fallback determinístico identificado no sistema e não fazem chamadas pagas aos provedores de IA.

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

1. Substituir os valores de fallback pelos segredos reais necessários:

```powershell
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
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
