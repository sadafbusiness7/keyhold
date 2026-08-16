#!/usr/bin/env tsx
/**
 * extract-form-fields.ts
 *
 * Reads an official government PDF and emits a skeleton form definition with
 * every AcroForm field pre-populated. You then fill in the human parts:
 * labels, helpText, prefillPath, sections, required flags.
 *
 * This replaces manually hunting field names in Adobe Acrobat — and because
 * every field is enumerated programmatically, you cannot miss one.
 *
 *   pnpm tsx scripts/extract-form-fields.ts forms/_pdfs/on/n1-2024.pdf \
 *     --code N1 --province ON --version 2024.1 \
 *     --source "https://tribunalsontario.ca/..."
 */

import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

type FieldType = 'text' | 'textarea' | 'currency' | 'date' | 'number'
               | 'checkbox' | 'radio' | 'select' | 'signature';

interface SkeletonField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  helpText: string;
  prefillPath: string | null;
  pdfFieldName: string;
  options?: string[];
  maxLength?: number;
  _note?: string;
}

function arg(flag: string, fallback = ''): string {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/** Heuristic id from the PDF field name: Text_TenantName_1 -> tenant_name_1 */
function toId(pdfName: string): string {
  return pdfName
    .replace(/^(Text|Check|Radio|Sig|Date|Dropdown)[_-]?/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase() || pdfName.toLowerCase();
}

/** Guess a sensible type so you edit fewer lines by hand. */
function guessType(pdfName: string, kind: string): FieldType {
  const n = pdfName.toLowerCase();
  if (kind === 'checkbox') return 'checkbox';
  if (kind === 'radio') return 'radio';
  if (kind === 'dropdown') return 'select';
  if (/sign|signature/.test(n)) return 'signature';
  if (/date|dated|day|month|year/.test(n)) return 'date';
  if (/rent|amount|total|fee|cost|\$|dollar|cents|payment/.test(n)) return 'currency';
  if (/phone|unit_no|number|qty|count/.test(n)) return 'number';
  if (/reason|detail|description|explain|comment/.test(n)) return 'textarea';
  return 'text';
}

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Usage: extract-form-fields.ts <pdf> [--code N1 --province ON --version 2024.1 --source URL]');
    process.exit(1);
  }

  const doc = await PDFDocument.load(readFileSync(pdfPath));
  const form = doc.getForm();
  const fields = form.getFields();

  const out: SkeletonField[] = [];
  const signatures: Array<{ id: string; role: string; pdfFieldName: string }> = [];

  for (const f of fields) {
    const pdfFieldName = f.getName();
    let kind = 'text';
    let options: string[] | undefined;
    let maxLength: number | undefined;

    if (f instanceof PDFCheckBox) kind = 'checkbox';
    else if (f instanceof PDFRadioGroup) { kind = 'radio'; options = f.getOptions(); }
    else if (f instanceof PDFDropdown) { kind = 'dropdown'; options = f.getOptions(); }
    else if (f instanceof PDFTextField) {
      const ml = f.getMaxLength();
      if (ml) maxLength = ml;
    }

    const type = guessType(pdfFieldName, kind);

    if (type === 'signature') {
      signatures.push({ id: toId(pdfFieldName), role: 'TODO_landlord_or_tenant', pdfFieldName });
      continue;
    }

    out.push({
      id: toId(pdfFieldName),
      label: 'TODO — plain-language label',
      type,
      required: false,               // TODO: set true for legally required fields
      helpText: 'TODO — what this means and why it matters',
      prefillPath: null,             // TODO e.g. "lease.primaryTenant.fullName"
      pdfFieldName,
      ...(options ? { options } : {}),
      ...(maxLength ? { maxLength } : {}),
    });
  }

  const skeleton = {
    formCode: arg('--code', 'TODO'),
    province: arg('--province', 'TODO'),
    version: arg('--version', '1.0'),
    effectiveDate: arg('--effective', 'TODO-YYYY-MM-DD'),
    supersededBy: null,
    sourceUrl: arg('--source', 'TODO — official government URL'),
    pdfFile: pdfPath,
    category: 'TODO',
    title: 'TODO',
    description: 'TODO — when a landlord uses this form, in plain language',
    noticePeriodDays: null,
    certificateOfService: false,
    sections: [
      {
        title: 'TODO — group these fields into logical sections',
        fields: out,
      },
    ],
    signatures,
    _meta: {
      extractedAt: new Date().toISOString(),
      totalPdfFields: fields.length,
      mappedFields: out.length,
      signatureFields: signatures.length,
    },
  };

  const outPath = arg('--out', join(dirname(pdfPath), '..', `${basename(pdfPath, '.pdf')}.skeleton.json`));
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(skeleton, null, 2));

  console.log(`\n✅ Extracted ${fields.length} fields from ${basename(pdfPath)}`);
  console.log(`   ${out.length} input fields · ${signatures.length} signature fields`);
  console.log(`   → ${outPath}\n`);
  console.log('Next: fill in every TODO (labels, helpText, prefillPath, required, sections),');
  console.log('then run `pnpm forms:verify` before committing.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
