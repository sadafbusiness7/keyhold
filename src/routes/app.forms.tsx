import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/keyhold/app-shell";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import {
  DraftsTable,
  FormFiller,
  FormsPicker,
  HistoryPanel,
  NotLegalAdvice,
  prefillFor,
  type Subject,
} from "@/components/keyhold/forms-panels";
import { formDefinitions, type FormDefinition } from "@/lib/form-schemas";
import { useForms, type FormDraft } from "@/lib/mock-forms";

export const Route = createFileRoute("/app/forms")({
  head: () => ({
    meta: [
      { title: "Provincial forms — Keyhold" },
      { name: "description", content: "Pick an official provincial form, fill it with a live preview, sign it and record service." },
      { property: "og:title", content: "Provincial forms — Keyhold" },
      { property: "og:description", content: "Province-aware official forms with live preview, signing and full history." },
    ],
  }),
  component: () => (
    <RequireFinancials title="Forms">
      <FormsPage />
    </RequireFinancials>
  ),
});

function FormsPage() {
  const { createDraft } = useForms();
  const [active, setActive] = useState<{ def: FormDefinition; subject: Subject; draft: FormDraft } | null>(null);
  const [viewing, setViewing] = useState<FormDraft | null>(null);

  return (
    <>
      <PageHeader
        title="Forms"
        subtitle="Official provincial forms, filled from your records with a live preview of the document."
      />

      {active ? (
        <FormFiller
          def={active.def}
          subject={active.subject}
          draft={active.draft}
          onClose={() => setActive(null)}
        />
      ) : (
        <div className="grid gap-4">
          <NotLegalAdvice />
          <FormsPicker
            onOpen={(def, subject) => {
              const { values, prefilled } = prefillFor(def, subject);
              const draft = createDraft({ def, subjectLabel: subject.label, values, prefilled, who: "You" });
              setViewing(null);
              setActive({ def, subject, draft });
            }}
          />
          <DraftsTable
            onResume={(d) => {
              const def = formDefinitions.find((f) => f.formCode === d.formCode && f.province === d.province);
              if (!def || d.status === "completed") {
                setViewing(d);
                return;
              }
              setViewing(null);
              setActive({
                def,
                subject: { kind: "tenant", id: d.id, label: d.subjectLabel, province: d.province, prefill: {} },
                draft: d,
              });
            }}
          />
          {viewing ? <HistoryPanel draft={viewing} /> : null}
        </div>
      )}
    </>
  );
}
