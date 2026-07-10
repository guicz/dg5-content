import assert from "node:assert/strict";
import test from "node:test";
import { isOverdue, monthGrid, requiresMetaScheduling, statusTone } from "../src/lib/domain.js";

test("Meta scheduling is limited to supported Instagram formats", () => {
  assert.equal(requiresMetaScheduling("Instagram", "Feed"), true);
  assert.equal(requiresMetaScheduling("Instagram", "Artigo"), false);
  assert.equal(requiresMetaScheduling("LinkedIn", "Feed"), false);
});

test("month grid always contains six complete weeks", () => {
  const days = monthGrid(new Date("2026-07-10T12:00:00"));
  assert.equal(days.length, 42);
  assert.equal(days.filter((day) => day.inMonth).length, 31);
});

test("overdue and status tone rules stay deterministic", () => {
  assert.equal(isOverdue({ publishDate: "2026-07-09", status: "Briefing" }, "2026-07-10"), true);
  assert.equal(isOverdue({ publishDate: "2026-07-09", status: "Publicado" }, "2026-07-10"), false);
  assert.equal(statusTone("Ajustes solicitados"), "warning");
  assert.equal(statusTone("Aprovado internamente"), "success");
});
