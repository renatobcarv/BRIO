/** Markdown seguro para as respostas da IA: títulos, negrito, itálico, código inline, blocos de código e listas. Nunca injeta HTML. */
function inline(s: string, k: string): React.ReactNode[] {
  return s.split(/(`[^`]+`|\*\*[^*]+\*\*|\+\+[^+]+\+\+|==[^=]+==|\*[^*\s][^*]*\*)/g).filter(Boolean).map((p, i) =>
    p.startsWith("`") ? <code key={k + i} className="font-mono text-[.88em] px-1.5 py-0.5 bg-white/[.07] text-[#ffb21e]">{p.slice(1, -1)}</code>
      : p.startsWith("++") && p.endsWith("++") ? <u key={k + i} className="decoration-[var(--accent,#ffb21e)] underline-offset-4 decoration-2">{p.slice(2, -2)}</u>
      : p.startsWith("==") && p.endsWith("==") ? <mark key={k + i} className="px-0.5 bg-[var(--accent,#ffb21e)]/25 text-white rounded-[2px]">{p.slice(2, -2)}</mark>
      : p.startsWith("**") ? <strong key={k + i} className="font-semibold text-white">{p.slice(2, -2)}</strong>
      : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? <em key={k + i}>{p.slice(1, -1)}</em>
      : <span key={k + i}>{p}</span>);
}

export function Md({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      const lang = l.slice(3).trim(), body: string[] = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i++;
      out.push(<pre key={"c" + i} className="my-1 overflow-x-auto border border-white/[.08] bg-[#060606] p-3 text-[12.5px] leading-relaxed font-mono text-white/85">{lang && <span className="block label !text-[9px] mb-2">{lang}</span>}<code>{body.join("\n")}</code></pre>);
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.*)/);
    if (h) { out.push(<p key={"h" + i} className={`font-semibold text-white ${h[1].length <= 2 ? "text-[17px] mt-2" : "text-[15px] mt-1"}`}>{inline(h[2], "h" + i)}</p>); i++; continue; }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(l)) {
      const ordered = /^\s*\d/.test(l), items: string[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*•]|\d+[.)])\s+/, ""));
      out.push(ordered
        ? <ol key={"o" + i} className="grid gap-1 pl-1">{items.map((t, k) => <li key={k} className="flex gap-2.5"><span className="font-mono text-[12px] pt-[3px] text-[var(--color-gold,#ffb21e)]">{k + 1}.</span><span>{inline(t, "o" + i + k)}</span></li>)}</ol>
        : <ul key={"u" + i} className="grid gap-1 pl-1">{items.map((t, k) => <li key={k} className="flex gap-2.5"><span className="pt-[1px] text-[var(--accent,#ff2800)]">▪</span><span>{inline(t, "u" + i + k)}</span></li>)}</ul>);
      continue;
    }
    if (/^>\s?/.test(l)) { out.push(<blockquote key={"q" + i} className="border-l-2 border-[#ffb21e] pl-3 text-white/75">{inline(l.replace(/^>\s?/, ""), "q" + i)}</blockquote>); i++; continue; }
    if (l.trim()) out.push(<p key={"p" + i}>{inline(l, "p" + i)}</p>);
    i++;
  }
  return <div className="grid gap-2 text-[15px] leading-relaxed text-white/88 break-words">{out}</div>;
}
