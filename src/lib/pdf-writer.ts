/**
 * Minimal, dependency-free PDF writer.
 * -----------------------------------
 * Enough to lay out an official-looking one/two page form: headings, labelled
 * fields, rules, checkboxes and wrapped paragraphs in Helvetica. Deterministic
 * output — the same input always produces the same bytes (except the doc date
 * you pass in). A real backend would render the LTB's own fillable PDF instead.
 */

export type PdfLine =
  | { t: "title"; text: string }
  | { t: "h"; text: string }
  | { t: "p"; text: string }
  | { t: "small"; text: string }
  | { t: "field"; label: string; value: string }
  | { t: "check"; checked: boolean; text: string }
  | { t: "rule" }
  | { t: "space"; size?: number }
  | { t: "pagebreak" };

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const WIDTH = PAGE_W - MARGIN * 2;

/** Helvetica's built-in encoding has no typographic punctuation — fold it down. */
const fold = (s: string) =>
  s
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u00B7\u2022]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u2009\u202F]/g, " ")
    .replace(/\u00E9/g, "e")
    .replace(/\u00E8/g, "e")
    .replace(/\u00E0/g, "a")
    .replace(/\u00E7/g, "c");

const esc = (s: string) =>
  fold(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, "?");

/** Helvetica is ~0.5em average; good enough for wrapping at these sizes. */
function wrap(text: string, size: number, width = WIDTH): string[] {
  const max = Math.max(8, Math.floor(width / (size * 0.5)));
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    if (!line.length) line = w;
    else if ((line + " " + w).length <= max) line += " " + w;
    else {
      out.push(line);
      line = w;
    }
  }
  if (line) out.push(line);
  return out.length ? out : [""];
}

export function buildPdf(lines: PdfLine[]): Blob {
  const pages: string[] = [];
  let ops: string[] = [];
  let y = PAGE_H - MARGIN;

  const newPage = () => {
    pages.push(ops.join("\n"));
    ops = [];
    y = PAGE_H - MARGIN;
  };
  const need = (h: number) => {
    if (y - h < MARGIN) newPage();
  };
  const text = (s: string, size: number, font: "F1" | "F2", x = MARGIN) => {
    ops.push(`BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${esc(s)}) Tj ET`);
  };

  for (const l of lines) {
    switch (l.t) {
      case "title": {
        for (const row of wrap(l.text, 17)) {
          need(24);
          text(row, 17, "F2");
          y -= 22;
        }
        y -= 6;
        break;
      }
      case "h": {
        need(22);
        y -= 6;
        text(l.text.toUpperCase(), 10, "F2");
        y -= 14;
        break;
      }
      case "p": {
        for (const row of wrap(l.text, 10)) {
          need(15);
          text(row, 10, "F1");
          y -= 14;
        }
        y -= 2;
        break;
      }
      case "small": {
        for (const row of wrap(l.text, 8)) {
          need(12);
          text(row, 8, "F1");
          y -= 11;
        }
        y -= 2;
        break;
      }
      case "field": {
        need(18);
        text(l.label, 9, "F1");
        text(l.value, 11, "F2", MARGIN + 180);
        y -= 8;
        ops.push(`0.75 w 0.6 0.6 0.6 RG ${MARGIN + 176} ${y} m ${PAGE_W - MARGIN} ${y} l S`);
        y -= 12;
        break;
      }
      case "check": {
        need(18);
        ops.push(`0.9 w 0 0 0 RG ${MARGIN} ${y - 1} 10 10 re S`);
        if (l.checked) {
          ops.push(`1.4 w ${MARGIN + 2} ${y + 4} m ${MARGIN + 4.5} ${y + 1} l ${MARGIN + 8} ${y + 8} l S`);
        }
        for (const [i, row] of wrap(l.text, 10, WIDTH - 20).entries()) {
          if (i > 0) y -= 13;
          text(row, 10, "F1", MARGIN + 18);
        }
        y -= 18;
        break;
      }
      case "rule": {
        need(14);
        y -= 4;
        ops.push(`0.75 w 0.15 0.2 0.29 RG ${MARGIN} ${y} m ${PAGE_W - MARGIN} ${y} l S`);
        y -= 12;
        break;
      }
      case "pagebreak": {
        newPage();
        break;
      }
      case "space": {
        y -= l.size ?? 10;
        break;
      }
    }
  }
  pages.push(ops.join("\n"));

  // —— assemble the file ——
  const objects: string[] = [];
  const pageCount = pages.length;
  const kids = pages.map((_, i) => `${4 + i * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  objects.push(`<< /Type /Pages /Count ${pageCount} /Kids [${kids}] >>`);
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  pages.forEach((content, i) => {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 ${3 + pageCount * 2 + 1} 0 R >> >> /Contents ${5 + i * 2} 0 R >>`,
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${off.toString().padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: "application/pdf" });
}

export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
