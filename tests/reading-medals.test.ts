import { test } from "node:test";
import assert from "node:assert/strict";
import { MEDALS, medalState, readingStats } from "../src/lib/reading-medals.ts";
test("estatísticas e medalhas de leitura", () => {
  const books = [{ status: "lido", finished_at: "2026-03-01", pages: 450, authors: "A, B", rating: 5, lessons: "x", application: "y" }, { status: "lendo", finished_at: null, pages: 200, authors: "C", rating: null, lessons: null, application: null }];
  const ses = [{ date: "2026-11-01", from_page: 0, to_page: 40 }, { date: "2026-11-02", from_page: 40, to_page: 100 }, { date: "2026-11-03", from_page: 100, to_page: 110 }];
  const s = readingStats(books, ses, 6, 12, "2026-11-20");
  assert.equal(s.livros, 1); assert.equal(s.sequencia, 3); assert.equal(s.maratona, 60); assert.equal(s.tijolo, 450); assert.equal(s.autores, 2); assert.equal(s.aplicado, 1);
  const tij = medalState(MEDALS.find((m) => m.id === "tijolo")!, 450);
  assert.equal(tij.tier, "Prata"); assert.equal(tij.next?.n, 600);
  assert.equal(medalState(MEDALS[0], 0).tier, null);
});
