export function fallbackContent(client, brain, planned) {
  const tone = brain.tone || "claro, direto e coerente com a marca";
  const positioning = brain.positioning || client.notes || "o posicionamento aprovado";
  const positioningSentence = String(positioning).replace(/[.!?]+$/, "");
  const objective = planned.objective || "reforçar o posicionamento da marca";
  return {
    text: `${planned.title}\n\n${client.name} transforma conhecimento em decisões mais seguras. Para ${objective.toLowerCase()}, esta mensagem deve adotar um tom ${tone.toLowerCase()}\n\nO ponto central é mostrar, de forma prática, como o posicionamento da marca se conecta ao dia a dia do público: ${positioningSentence}.\n\nQual é a próxima decisão que merece mais contexto?`,
    artSuggestion: `Criar ${planned.format || "peça"} para ${planned.channel || "canal digital"} com uma ideia central por tela, hierarquia objetiva e imagem real relacionada a ${client.segment || "atividade do cliente"}. Priorizar legibilidade em telas pequenas, contraste alto e estes critérios: ${brain.qualityCriteria || "clareza e consistência de marca"}`,
  };
}

export function reviewTextDeterministic(text, brain = {}) {
  const normalized = String(text || "").toLowerCase();
  const bannedWords = String(brain.bannedWords || "")
    .split(",")
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);
  const hits = bannedWords.filter((word) => normalized.includes(word));
  const firstPositioningWord = String(brain.positioning || "").toLowerCase().split(/\s+/).find((word) => word.length > 5);
  const hasPositioning = !firstPositioningWord || normalized.includes(firstPositioningWord);
  const lengthScore = normalized.length >= 180 ? 18 : normalized.length >= 110 ? 10 : 0;
  const positioningScore = hasPositioning ? 12 : 0;
  const score = Math.max(30, Math.min(96, 58 + lengthScore + positioningScore - hits.length * 16));
  const guidance = [];
  if (hits.length) guidance.push(`Remover ou substituir os termos restritos: ${hits.join(", ")}.`);
  if (normalized.length < 110) guidance.push("Desenvolver melhor a ideia central com contexto específico do cliente.");
  if (!hasPositioning) guidance.push("Aproximar a mensagem do posicionamento aprovado no Brand Brain.");
  if (!/[.!?]$/.test(String(text || "").trim())) guidance.push("Finalizar a mensagem com uma conclusão ou chamada clara.");
  if (!guidance.length) guidance.push("O texto está coerente; faça apenas a leitura final de ritmo e clareza.");
  return {
    score,
    passed: score >= 70,
    label: score >= 86 ? "Muito aderente" : score >= 70 ? "Aderente" : score >= 55 ? "Ajustes leves" : "Precisa de revisão",
    guidance,
  };
}

export function parseModelJson(value, fallback) {
  if (!value) return fallback;
  try {
    const clean = String(value).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    return { ...fallback, ...JSON.parse(clean) };
  } catch {
    return fallback;
  }
}

export function secretReady(value) {
  return Boolean(value && value !== "not-configured" && value.length > 10);
}
