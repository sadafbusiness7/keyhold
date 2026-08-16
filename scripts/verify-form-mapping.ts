#!/usr/bin/env tsx
/**
 * verify-form-mapping.ts  —  run in CI. Fails the build on any mapping error.
 *
 * THIS IS THE TEST THAT CATCHES ONE MISSED FIELD OUT OF HUNDREDS.
 *
 * For every form definition it asserts:
 *   1. Every pdfFieldName in the JSON actually exists in the PDF.
 *   2. Every AcroForm field in the PDF is either mapped, listed as a signature,
 *      or explicitly declared in forms/_skipped/<formCode>-<version>.json.
 *   3. No duplicate field ids, no unresolved TODOs, required metadata present.
 *
 *   pnpm tsx scripts/verify-form-mapping.ts
 */

import { PDFDocument } from 'pdf-lib';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const FORMS_DIR = 'forms';
const SKIPPED_DIR = join(FORMS_DIR, '_skipped');

let errors = 0;
let warnings = 0;
const fail = (m: string) => { console.error(`  ❌ ${m}`); errors++; };
const warn = (m: string) => { console.warn(`  ⚠️  ${m}`); warnings++; };

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry !== '_pdfs' && entry !== '_skipped') walk(p, out);
    } else if (entry.endsWith('.json') && !entry.includes('.skeleton.')) {
      out.push(p);
    }
  }
  return out;
}

async function verify(defPath: string) {
  console.log(`\n▶ ${relative(process.cwd(), defPath)}`);
  const def = JSON.parse(readFileSync(defPath, 'utf8'));

  // --- metadata completeness -------------------------------------------------
  for (const key of ['formCode', 'province', 'version', 'effectiveDate', 'sourceUrl', 'pdfFile', 'title']) {
    const v = def[key];
    if (!v || String(v).startsWith('TODO')) fail(`metadata "${key}" is missing or still TODO`);
  }

  if (!existsSync(def.pdfFile)) { fail(`PDF not found: ${def.pdfFile}`); return; }

  // --- gather declared fields ------------------------------------------------
  const declared = new Map<string, any>();
  const ids = new Set<string>();
  for (const section of def.sections ?? []) {
    if (!section.title || String(section.title).startsWith('TODO')) warn('a section title is still TODO');
    for (const f of section.fields ?? []) {
      if (ids.has(f.id)) fail(`duplicate field id "${f.id}"`);
      ids.add(f.id);
      if (!f.label || f.label.startsWith('TODO')) fail(`field "${f.id}" has an unfinished label`);
      if (!f.helpText || f.helpText.startsWith('TODO')) warn(`field "${f.id}" has no helpText`);
      if (f.required && !f.prefillPath) warn(`required field "${f.id}" has no prefillPath (user must type it)`);
      if (!f.pdfFieldName) { fail(`field "${f.id}" has no pdfFieldName`); continue; }
      declared.set(f.pdfFieldName, f);
    }
  }
  for (const s of def.signatures ?? []) {
    if (!s.pdfFieldName) fail(`signature "${s.id}" has no pdfFieldName`);
    else declared.set(s.pdfFieldName, s);
    if (String(s.role).startsWith('TODO')) fail(`signature "${s.id}" has an unassigned role`);
  }

  // --- compare against the actual PDF ---------------------------------------
  const doc = await PDFDocument.load(readFileSync(def.pdfFile));
  const actual = new Set(doc.getForm().getFields().map((f) => f.getName()));

  // 1. every declared field must exist in the PDF
  for (const name of declared.keys()) {
    if (!actual.has(name)) fail(`mapped field "${name}" does NOT exist in the PDF (typo or the form changed)`);
  }

  // 2. every PDF field must be accounted for
  const skipPath = join(SKIPPED_DIR, `${def.formCode}-${def.version}.json`);
  const skipped: Record<string, string> = existsSync(skipPath)
    ? JSON.parse(readFileSync(skipPath, 'utf8'))
    : {};

  const unmapped: string[] = [];
  for (const name of actual) {
    if (!declared.has(name) && !(name in skipped)) unmapped.push(name);
  }
  if (unmapped.length) {
    fail(`${unmapped.length} PDF field(s) are UNMAPPED and not declared as skipped:`);
    unmapped.forEach((n) => console.error(`       · ${n}`));
    console.error(`     Map them, or add them to ${skipPath} with a reason.`);
  }

  if (!errors) {
    console.log(`  ✅ ${declared.size} mapped · ${Object.keys(skipped).length} intentionally skipped · ${actual.size} total in PDF`);
  }
}

async function main() {
  const defs = walk(FORMS_DIR);
  if (!defs.length) { console.error('No form definitions found under forms/'); process.exit(1); }
  console.log(`Verifying ${defs.length} form definition(s)…`);
  for (const d of defs) await verify(d);

  console.log(`\n${'─'.repeat(58)}`);
  if (errors) {
    console.error(`❌ ${errors} error(s), ${warnings} warning(s). Build blocked.`);
    process.exit(1);
  }
  console.log(`✅ All form mappings verified. ${warnings} warning(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
