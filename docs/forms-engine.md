# Provincial forms engine — build specification

The engine that turns official government PDFs into pre-filled, signable,
auditable documents. This is a **moat feature**: deep Canadian competence no
US-first competitor will replicate quickly.

**Core principle: definitions are data, filling is deterministic code.** No form's
fields are ever hard-coded into components. No LLM ever decides a field value in
a legal document.

---

## 1. Directory layout

```
forms/
  on/
    ontario-standard-lease-2229e-v2024.json
    n1-rent-increase-v2024.json
    n4-non-payment-v2024.json
  bc/
    rtb1-tenancy-agreement-v2023.json
  ns/  nb/  ab/            # AB has no standard lease — custom template path
  _pdfs/                   # the official source PDFs, unmodified
  _skipped/                # documented intentionally-unmapped fields
scripts/
  extract-form-fields.ts   # PDF → skeleton JSON
  verify-form-mapping.ts   # CI guard (see §5)
lib/forms/
  fill.ts                  # pdf-lib filling
  prefill.ts               # resolve prefillPath against app data
  registry.ts              # load + version-select definitions
```

## 2. Form definition schema

```jsonc
{
  "formCode": "N1",
  "province": "ON",
  "version": "2024.1",
  "effectiveDate": "2024-01-01",
  "supersededBy": null,
  "sourceUrl": "https://tribunalsontario.ca/...",
  "pdfFile": "_pdfs/on/n1-2024.pdf",
  "category": "rent_increase",
  "title": "Notice of Rent Increase",
  "description": "Used to increase a tenant's rent. Requires 90 days' notice.",
  "noticePeriodDays": 90,
  "certificateOfService": true,
  "sections": [
    {
      "title": "To (the tenant)",
      "fields": [
        {
          "id": "tenant_name",
          "label": "Tenant's full legal name",
          "type": "text",
          "required": true,
          "helpText": "Use the name exactly as it appears on the lease.",
          "prefillPath": "lease.primaryTenant.fullName",
          "pdfFieldName": "Text_TenantName_1",
          "maxLength": 60
        },
        {
          "id": "new_rent",
          "label": "New rent amount",
          "type": "currency",
          "required": true,
          "helpText": "Must not exceed the provincial guideline unless approved.",
          "prefillPath": "computed.newRentCents",
          "pdfFieldName": "Text_NewRent",
          "validation": { "min": 0 }
        }
      ]
    }
  ],
  "signatures": [
    { "id": "landlord_sig", "role": "landlord", "pdfFieldName": "Sig_Landlord",
      "dateFieldName": "Text_SigDate" }
  ]
}
```

**Field types:** `text · textarea · currency · date · number · checkbox · radio ·
select · signature`. Currency stored and filled from **integer cents**.

## 3. Prefill resolution

`prefillPath` is a dot-path resolved against a context object assembled per form:

```ts
{
  organization, property, unit, lease, primaryTenant, tenants[], owner,
  computed: { newRentCents, effectiveDate, noticeDeadline, ... }
}
```

Rules:
- A missing path resolves to empty and the field is flagged **required-but-empty**
  in the UI — it never silently blanks a required legal field.
- `computed.*` values come from deterministic functions (`lib/money/`,
  guideline calculator), **never from an LLM**.
- Prefilled values are always editable by the human, and marked as prefilled.

## 4. Filling (pdf-lib)

```ts
const pdf = await PDFDocument.load(bytes);
const form = pdf.getForm();
form.getTextField(field.pdfFieldName).setText(formatted);
form.flatten();              // no editable fields in the issued document
```
- Format at the edge: cents → `$1,234.56`; dates → the form's expected format.
- Flatten before issuing so the PDF can't be altered downstream.
- Embed signature images/typed signatures into the signature fields.
- Return bytes; store in Supabase Storage; write a `notice`/`document` row with
  `form_version` and `source_url`.

## 5. The three tests that prevent humiliation

**Run all three in CI. This is the whole point.**

1. **Field-coverage test (the critical one).** For every definition: load the PDF,
   enumerate its AcroForm fields, and assert
   - every `pdfFieldName` in the JSON exists in the PDF, **and**
   - every field in the PDF is either mapped in the JSON or explicitly listed in
     `_skipped/<form>.json` with a reason.
   *This is what catches one missed field out of hundreds — automatically, before
   a human ever sees the document.*
2. **Prefill-resolution test.** Every `prefillPath` resolves against a sample
   context fixture. Catches typos and schema drift.
3. **Golden-file test.** Fill each form with a fixed fixture, extract the text,
   compare to an approved snapshot. Any unintended change fails the build.

## 6. Versioning (non-negotiable)

- **Never edit a published definition.** A form change = a new file + new
  `version`; set `supersededBy` on the old one.
- Every generated `notice`/`document` stores the `form_version` used, so a 2026
  document remains reproducible in 2029.
- The registry selects the definition whose `effectiveDate` is the latest one
  ≤ the document's date, and warns in the UI if a newer version exists.

## 7. Workflow for adding a form (the repeatable loop)

1. Download the official PDF from the government source into `forms/_pdfs/`.
   Record the exact URL and effective date. **Always the source, never a copy.**
2. Run `pnpm forms:extract <pdf>` → emits a skeleton JSON with every
   `pdfFieldName` pre-populated and blanks for label/helpText/prefillPath.
3. Fill in the human parts: labels, plain-language help text, required flags,
   sections, prefill paths, notice period. *(This is the judgement step — the
   part that needs someone who knows what the form does.)*
4. Run `pnpm forms:verify` → the three tests must pass.
5. Commit definition + PDF + golden snapshot in one PR.

## 8. Guardrails (product-level)

- Persistent "General information, not legal advice" on every form surface.
- Show form version, effective date, and official source link.
- A human reviews and confirms before generation or sending — always.
- AI may explain a field in plain language; it never picks a legal value or
  decides that a notice should be served.
- Outdated-version warning banner when a newer definition exists.
- Provincial notice periods enforced: a rent change applies only after the
  required period, and non-compliant increases are blocked with an explanation.
- **Have Canadian counsel review the form flows before real customers use them.**
