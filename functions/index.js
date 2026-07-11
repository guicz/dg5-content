import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { fallbackContent, parseModelJson, reviewTextDeterministic, secretReady } from "./lib.js";

initializeApp();

const db = getFirestore();
const bucket = getStorage().bucket();
const region = "southamerica-east1";
const openAIKey = defineSecret("OPENAI_API_KEY");
const anthropicKey = defineSecret("ANTHROPIC_API_KEY");
const geminiKey = defineSecret("GEMINI_API_KEY");
const aiSecrets = [openAIKey, anthropicKey, geminiKey];

function requireDG5User(request) {
  const email = request.auth?.token?.email;
  if (!request.auth || !email?.endsWith("@dg5.com.br")) {
    throw new HttpsError("permission-denied", "Acesso permitido apenas para usuários DG5 autenticados.");
  }
  return { uid: request.auth.uid, email };
}

function requiredString(value, field, maxLength = 120_000) {
  if (typeof value !== "string" || !value.trim()) throw new HttpsError("invalid-argument", `Campo obrigatório: ${field}.`);
  if (value.length > maxLength) throw new HttpsError("invalid-argument", `${field} excede o limite permitido.`);
  return value.trim();
}

async function getDocument(collectionName, id, label) {
  const snapshot = await db.collection(collectionName).doc(id).get();
  if (!snapshot.exists) throw new HttpsError("not-found", `${label} não encontrado.`);
  return { id: snapshot.id, ...snapshot.data() };
}

async function getContext(clientId, plannedContentId) {
  const client = await getDocument("clients", requiredString(clientId, "clientId", 120), "Cliente");
  const brainSnapshot = await db.collection("brandBrains").where("clientId", "==", client.id).limit(1).get();
  const brain = brainSnapshot.empty ? {} : { id: brainSnapshot.docs[0].id, ...brainSnapshot.docs[0].data() };
  const planned = plannedContentId ? await getDocument("plannedContents", requiredString(plannedContentId, "plannedContentId", 120), "Planejamento") : null;
  return { client, brain, planned };
}

async function gatewayConfig() {
  const snapshot = await db.collection("aiGateway").doc("default").get();
  return snapshot.exists ? snapshot.data() : {};
}

function keyFor(provider) {
  if (provider === "openai") return openAIKey.value();
  if (provider === "anthropic") return anthropicKey.value();
  return geminiKey.value();
}

async function chooseModel(task, clientId, config) {
  const mappings = {
    generation: [config.textGenerationProvider || "openai", config.textGenerationModel || "gpt-5-nano"],
    review: [config.reviewProvider || "openai", config.reviewModel || "gpt-5-nano"],
    vision: [config.visionProvider || "gemini", config.visionModel || "gemini-3.1-flash-lite"],
    brand: [config.brandProvider || "gemini", config.brandModel || "gemini-3.1-flash-lite"],
  };
  const performance = await db.collection("modelPerformance")
    .where("clientId", "==", clientId)
    .where("task", "==", task)
    .get();
  const best = performance.docs
    .map((item) => item.data())
    .filter((item) => item.provider && item.model && Number.isFinite(item.avgFitScore))
    .sort((a, b) => b.avgFitScore - a.avgFitScore)[0];
  const [rawProvider, model] = best ? [best.provider, best.model] : mappings[task];
  const provider = String(rawProvider).toLowerCase();
  return {
    provider,
    model,
    reason: best ? "Melhor aderência histórica para este cliente e tarefa." : "Configuração padrão da tarefa no AI Gateway.",
  };
}

function textFromOpenAI(response) {
  if (response.choices?.[0]?.message?.content) return response.choices[0].message.content;
  return response.output?.flatMap((item) => item.content || []).find((item) => item.text)?.text || "";
}

async function callOpenAI({ model, system, prompt, image }) {
  const content = image
    ? [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.data}` } }]
    : prompt;
  const body = {
    model,
    max_completion_tokens: 2200,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: system }, { role: "user", content }],
  };
  if (model.startsWith("gpt-5")) body.reasoning_effort = "minimal";
  else body.temperature = 0.3;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${openAIKey.value()}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  return textFromOpenAI(await response.json());
}

async function callAnthropic({ model, system, prompt, image }) {
  const content = image
    ? [{ type: "image", source: { type: "base64", media_type: image.mimeType, data: image.data } }, { type: "text", text: prompt }]
    : [{ type: "text", text: prompt }];
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": anthropicKey.value(), "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 2200, temperature: 0.3, system, messages: [{ role: "user", content }] }),
  });
  if (!response.ok) throw new Error(`Anthropic ${response.status}: ${await response.text()}`);
  const payload = await response.json();
  return payload.content?.find((item) => item.type === "text")?.text || "";
}

async function callGemini({ model, system, prompt, image, documents = [] }) {
  const parts = [{ text: `${system}\n\n${prompt}` }];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  for (const document of documents) parts.push({ inlineData: { mimeType: document.mimeType, data: document.data } });
  const generationConfig = { temperature: 0.3, responseMimeType: "application/json", maxOutputTokens: 2200 };
  if (model === "gemini-3.1-flash-lite") generationConfig.thinkingConfig = { thinkingLevel: "minimal" };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey.value())}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig }),
  });
  if (!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`);
  const payload = await response.json();
  return payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
}

async function callModel({ provider, ...options }) {
  if (!secretReady(keyFor(provider))) return { mode: "fallback", text: "" };
  try {
    const text = provider === "openai"
      ? await callOpenAI(options)
      : provider === "anthropic"
        ? await callAnthropic(options)
        : await callGemini(options);
    return { mode: "live", text };
  } catch (error) {
    logger.error("AI provider failed", { provider, model: options.model, error: error.message });
    return { mode: "fallback", text: "", error: error.message };
  }
}

async function writeAILog({ task, clientId, choice, mode, user, durationMs, metadata = {} }) {
  await db.collection("aiLogs").add({
    task,
    clientId,
    provider: choice.provider,
    model: choice.model,
    reason: choice.reason,
    mode,
    requestedBy: user.email,
    durationMs,
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export const generateContent = onCall({ region, secrets: aiSecrets, timeoutSeconds: 120, memory: "512MiB" }, async (request) => {
  const user = requireDG5User(request);
  const startedAt = Date.now();
  const { client, brain, planned } = await getContext(request.data.clientId, request.data.plannedContentId);
  const config = await gatewayConfig();
  const choice = await chooseModel("generation", client.id, config);
  const fallback = fallbackContent(client, brain, planned);
  const system = "Você é um redator sênior da DG5. Responda apenas JSON válido com as chaves text e artSuggestion. Não invente fatos.";
  const prompt = `CLIENTE: ${JSON.stringify(client)}\nBRAND BRAIN: ${JSON.stringify(brain)}\nDEMANDA: ${JSON.stringify(planned)}\nCrie o conteúdo textual primeiro e depois uma orientação objetiva para o designer.`;
  const modelResult = await callModel({ ...choice, system, prompt });
  let result = parseModelJson(modelResult.text, fallback);
  const fit = reviewTextDeterministic(result.text, brain);
  let routed = false;

  if (fit.score < 70 && config.routingMode === "adaptive") {
    const alternatives = ["openai", "anthropic", "gemini"].filter((provider) => provider !== choice.provider && secretReady(keyFor(provider)));
    if (alternatives[0]) {
      const retryChoice = { provider: alternatives[0], model: alternatives[0] === "openai" ? "gpt-5-nano" : alternatives[0] === "anthropic" ? "claude-haiku-4-5" : "gemini-3.1-flash-lite" };
      const retry = await callModel({ ...retryChoice, system, prompt: `${prompt}\nA primeira versão teve baixa aderência. Priorize o tom e as restrições do Brand Brain.` });
      if (retry.mode === "live") {
        result = parseModelJson(retry.text, fallback);
        routed = true;
      }
    }
  }

  await writeAILog({ task: "generation", clientId: client.id, choice, mode: modelResult.mode, user, durationMs: Date.now() - startedAt, metadata: { fitScore: fit.score, routed } });
  return { ...result, mode: modelResult.mode, provider: choice.provider, model: choice.model, routed };
});

export const reviewContent = onCall({ region, secrets: aiSecrets, timeoutSeconds: 120 }, async (request) => {
  const user = requireDG5User(request);
  const startedAt = Date.now();
  const text = requiredString(request.data.text, "text");
  const { client, brain, planned } = await getContext(request.data.clientId, request.data.plannedContentId);
  const config = await gatewayConfig();
  const choice = await chooseModel("review", client.id, config);
  const fallback = reviewTextDeterministic(text, brain);
  const system = "Você revisa conteúdo para uma agência. Responda apenas JSON com score de 0 a 100, label e guidance como lista de orientações práticas. Não exponha a lógica da nota no texto de orientação.";
  const prompt = `BRAND BRAIN: ${JSON.stringify(brain)}\nDEMANDA: ${JSON.stringify(planned)}\nTEXTO: ${text}\nAvalie tom, posicionamento, clareza, restrições e termos proibidos.`;
  const modelResult = await callModel({ ...choice, system, prompt });
  const parsed = parseModelJson(modelResult.text, fallback);
  const score = Number.isFinite(Number(parsed.score)) ? Math.max(0, Math.min(100, Number(parsed.score))) : fallback.score;
  const result = { score, passed: score >= 70, label: parsed.label || fallback.label, guidance: Array.isArray(parsed.guidance) ? parsed.guidance.slice(0, 6) : fallback.guidance };
  await writeAILog({ task: "review", clientId: client.id, choice, mode: modelResult.mode, user, durationMs: Date.now() - startedAt, metadata: { fitScore: score } });
  return result;
});

export const generateBrandBrain = onCall({ region, secrets: aiSecrets, timeoutSeconds: 180, memory: "1GiB" }, async (request) => {
  const user = requireDG5User(request);
  const startedAt = Date.now();
  const { client, brain } = await getContext(request.data.clientId);
  const config = await gatewayConfig();
  const choice = await chooseModel("brand", client.id, config);
  const fileSnapshot = await db.collection("clientFiles").where("clientId", "==", client.id).where("kind", "==", "knowledge").limit(4).get();
  const documents = [];
  if (choice.provider === "gemini" && secretReady(geminiKey.value())) {
    for (const fileDocument of fileSnapshot.docs) {
      const file = fileDocument.data();
      if (!file.storagePath || !file.type || file.size > 10 * 1024 * 1024) continue;
      const [buffer] = await bucket.file(file.storagePath).download();
      documents.push({ mimeType: file.type, data: buffer.toString("base64") });
    }
  }
  const fallback = { brandBrain: { ...brain, strategicSummary: brain.strategicSummary || client.notes || "Resumo estratégico pendente de validação interna." } };
  const system = "Você é estrategista de marca da DG5. Responda apenas JSON com brandBrain contendo tone, positioning, audience, preferences, restrictions, bannedWords, qualityCriteria, strategicSummary e learnings. Não invente fatos ausentes.";
  const prompt = `CLIENTE: ${JSON.stringify(client)}\nGUIA ATUAL: ${JSON.stringify(brain)}\nFONTES DISPONÍVEIS: ${fileSnapshot.docs.map((item) => item.data().name).join(", ")}\nConsolide uma versão inicial para revisão humana.`;
  const modelResult = await callModel({ ...choice, system, prompt, documents });
  const result = parseModelJson(modelResult.text, fallback);
  await writeAILog({ task: "brand", clientId: client.id, choice, mode: modelResult.mode, user, durationMs: Date.now() - startedAt, metadata: { documentCount: documents.length } });
  return { ...result, mode: modelResult.mode, model: choice.model };
});

export const reviewCreative = onCall({ region, secrets: aiSecrets, timeoutSeconds: 180, memory: "1GiB" }, async (request) => {
  const user = requireDG5User(request);
  const startedAt = Date.now();
  const storagePath = requiredString(request.data.storagePath, "storagePath", 500);
  const content = await getDocument("contents", requiredString(request.data.contentId, "contentId", 120), "Conteúdo");
  const { client, brain } = await getContext(request.data.clientId);
  if (!storagePath.startsWith(`clients/${client.id}/creative/`)) throw new HttpsError("permission-denied", "Arquivo fora do cliente informado.");
  const [metadata] = await bucket.file(storagePath).getMetadata();
  if (!metadata.contentType?.startsWith("image/")) throw new HttpsError("invalid-argument", "A revisão visual aceita imagens no MVP.");
  if (Number(metadata.size) > 12 * 1024 * 1024) throw new HttpsError("invalid-argument", "A imagem excede 12 MB.");
  const [buffer] = await bucket.file(storagePath).download();
  const image = { mimeType: metadata.contentType, data: buffer.toString("base64") };
  const config = await gatewayConfig();
  const choice = await chooseModel("vision", client.id, config);
  const fallback = {
    summary: "Revisão técnica preliminar. Confirme os itens com direção de arte humana.",
    findings: [
      "Conferir todo o texto da peça com a versão aprovada.",
      "Validar legibilidade, contraste, margens e hierarquia em tela pequena.",
      "Examinar mãos, rostos, objetos e texturas para identificar artefatos de imagem gerada por IA.",
      `Confirmar aderência aos critérios: ${brain.qualityCriteria || "guia oficial do cliente"}.`,
    ],
  };
  const system = "Você é Diretor de Arte sênior da DG5. Responda apenas JSON com summary e findings. Seja técnico, consultivo e específico. Não aprove ou bloqueie automaticamente.";
  const prompt = `CLIENTE: ${JSON.stringify(client)}\nBRAND BRAIN: ${JSON.stringify(brain)}\nCONTEÚDO APROVADO: ${content.text}\nSUGESTÃO DE ARTE: ${content.artSuggestion}\nAnalise português, digitação, hierarquia, legibilidade, composição, contraste, marca e sinais de distorções de IA como dedos extras, rostos irreais e objetos incoerentes.`;
  const modelResult = await callModel({ ...choice, system, prompt, image });
  const result = parseModelJson(modelResult.text, fallback);
  const findings = Array.isArray(result.findings) ? result.findings.slice(0, 10) : fallback.findings;
  await writeAILog({ task: "vision", clientId: client.id, choice, mode: modelResult.mode, user, durationMs: Date.now() - startedAt });
  return { summary: result.summary || fallback.summary, findings, mode: modelResult.mode, model: choice.model };
});

export const checkMetaScheduling = onSchedule({ region, schedule: "0 8 * * *", timeZone: "America/Sao_Paulo" }, async () => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const pendingSnapshot = await db.collection("plannedContents")
    .where("requiresMetaScheduling", "==", true)
    .where("metaScheduled", "==", false)
    .where("publishDate", "<=", today)
    .get();

  const batch = db.batch();
  for (const itemDocument of pendingSnapshot.docs) {
    const item = itemDocument.data();
    const clientSnapshot = await db.collection("clients").doc(item.clientId).get();
    const clientName = clientSnapshot.data()?.name || "Cliente";
    const notificationId = `meta-${itemDocument.id}-${today}`;
    const message = `${item.title} de ${clientName} chegou à data prevista sem agendamento no Meta.`;
    batch.set(db.collection("notifications").doc(notificationId), {
      type: "meta_pending",
      status: "unread",
      clientId: item.clientId,
      plannedContentId: itemDocument.id,
      title: "Agendamento pendente",
      message,
      responsibleEmail: item.responsibleEmail,
      publishDate: item.publishDate,
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    if (item.responsibleEmail) {
      batch.set(db.collection("mail").doc(notificationId), {
        to: [item.responsibleEmail],
        message: {
          subject: `[DG5] Agendamento pendente: ${clientName}`,
          text: `${message}\n\nAcesse o DG5 Content Intelligence para atualizar o status.`,
        },
      }, { merge: true });
    }
  }
  await batch.commit();
  logger.info("Meta scheduling check completed", { date: today, pending: pendingSnapshot.size });
});
