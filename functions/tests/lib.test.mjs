import assert from "node:assert/strict";
import test from "node:test";
import { fallbackContent, parseModelJson, reviewTextDeterministic, secretReady } from "../lib.js";

const brain = {
  tone: "Técnico e claro",
  positioning: "Parceira técnica do produtor",
  bannedWords: "imperdível, garantia",
  qualityCriteria: "Clareza e rigor",
};

test("deterministic review keeps score internal and returns guidance", () => {
  const result = reviewTextDeterministic("Oferta imperdível sem contexto", brain);
  assert.equal(result.passed, false);
  assert.ok(result.guidance.some((item) => item.includes("imperdível")));
});

test("fallback content stays client and demand aware", () => {
  const result = fallbackContent({ name: "DG5", segment: "Comunicação" }, brain, { title: "Teste", channel: "Instagram", format: "Feed", objective: "Gerar autoridade" });
  assert.ok(result.text.includes("DG5"));
  assert.ok(result.artSuggestion.includes("Instagram"));
});

test("model JSON parser and secret guard fail safely", () => {
  assert.deepEqual(parseModelJson("```json\n{\"score\":82}\n```", { score: 0 }), { score: 82 });
  assert.equal(secretReady("not-configured"), false);
  assert.equal(secretReady("configured-value-long-enough"), true);
});
