export const BOOK_COLOR = "#ff9f0a";
export const STATUS = {
  lendo: { label: "Lendo", color: "#ff9f0a" },
  quero_ler: { label: "Quero ler", color: "#0a84ff" },
  lido: { label: "Lido", color: "#30d158" },
  abandonado: { label: "Abandonado", color: "#9a978f" },
} as const;
export type BookStatus = keyof typeof STATUS;
export const FORMATS = { fisico: "Físico", ebook: "E-book", audio: "Audiolivro" } as const;
export type BookFormat = keyof typeof FORMATS;
export const NOTE_KINDS = { citacao: "Citação", anotacao: "Anotação", reflexao: "Reflexão" } as const;
export type NoteKind = keyof typeof NOTE_KINDS;

export type Book = {
  id: string; created_at: string; title: string; authors: string | null; cover_url: string | null; isbn: string | null;
  publisher: string | null; year: number | null; pages: number | null; description: string | null;
  categories: string[]; tags: string[]; status: BookStatus; rating: number | null; favorite: boolean; format: BookFormat;
  current_page: number; started_at: string | null; finished_at: string | null;
  summary: string | null; lessons: string | null; application: string | null; source_id: string | null;
};
export type BookNote = { id: string; created_at: string; book_id: string; kind: NoteKind; page: number | null; text: string };
export type Session = { id: string; book_id: string; date: string; from_page: number; to_page: number; minutes: number | null };

/** Resultado normalizado das APIs de busca. */
export type SearchHit = {
  source_id: string; title: string; authors: string; cover_url: string | null; isbn: string | null;
  publisher: string | null; year: number | null; pages: number | null; description: string | null; categories: string[];
};

export const progressOf = (b: Pick<Book, "pages" | "current_page" | "status">) =>
  b.status === "lido" ? 1 : b.pages ? Math.min(1, b.current_page / b.pages) : 0;
