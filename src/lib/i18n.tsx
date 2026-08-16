/**
 * I18N — English and Canadian French only, translated properly.
 *
 * Two layers:
 *  1. `en` — keyed interface strings (navigation, shell chrome) with a French
 *     dictionary of the same keys.
 *  2. `frPhrases` — an English-sentence → French map used by `tx()` so page
 *     headers and empty states translate without re-plumbing every route.
 *
 * Money, dates and counts stay untouched: translation never changes the maths.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "fr";

export type LocaleMeta = {
  code: Locale;
  native: string;
  english: string;
  dir: "ltr" | "rtl";
};

export const LOCALES: LocaleMeta[] = [
  { code: "en", native: "English", english: "English", dir: "ltr" },
  { code: "fr", native: "Français", english: "French", dir: "ltr" },
];

export const localeMeta = (code: Locale): LocaleMeta =>
  LOCALES.find((l) => l.code === code) ?? LOCALES[0]!;

/** English is the source of truth: every key lives here first. */
const en = {
  "nav.dashboard": "Dashboard",
  "nav.properties": "Properties & units",
  "nav.listings": "Listings",
  "nav.prospects": "Prospects",
  "nav.rent": "Rent",
  "nav.tenants": "Tenants",
  "nav.maintenance": "Maintenance",
  "nav.leases": "Leases & notices",
  "nav.renewals": "Renewals",
  "nav.notices": "Provincial notices",
  "nav.forms": "Forms",
  "nav.bulk": "Bulk actions",
  "nav.inspections": "Inspections",
  "nav.assets": "Assets",
  "nav.announcements": "Announcements",
  "nav.calendar": "Calendar",
  "nav.documents": "Documents",
  "nav.messages": "Messages",
  "nav.notifications": "Notifications",
  "nav.disbursements": "Owner payouts",
  "nav.tax": "Tax package",
  "nav.creditReporting": "Rent reporting",
  "nav.rentIncreases": "Rent increases",
  "nav.reports": "Reports",
  "nav.insights": "Insights",
  "nav.team": "Team & access",
  "nav.import": "Import data",
  "nav.settings": "Settings",
  "nav.legal": "Legal & privacy",
  "nav.support": "Support centre",
  "ui.account": "Account menu",
  "ui.signOut": "Sign out",
  "ui.settings": "Settings",
  "ui.collapse": "Collapse menu",
  "ui.expand": "Expand menu",
  "ui.openMenu": "Open menu",
  "ui.closeMenu": "Close menu",
  "ui.search": "Search",
  "ui.shortcuts": "Keyboard shortcuts",
  "ui.unread": "unread",
  "ui.appearance": "Appearance",
  "ui.light": "Light",
  "ui.dark": "Dark",
  "ui.system": "System",
  "ui.language": "Language",
  "ui.moreLanguages": "English and French are fully supported.",
  "ui.beta": "Beta",
  "ui.signedIn": "Signed in",
  "ui.yourAccount": "Your account",
};

export type StringKey = keyof typeof en;
type Dict = Partial<Record<StringKey, string>>;

const fr: Dict = {
  "nav.dashboard": "Tableau de bord",
  "nav.properties": "Immeubles et logements",
  "nav.listings": "Annonces",
  "nav.prospects": "Candidats",
  "nav.rent": "Loyers",
  "nav.tenants": "Locataires",
  "nav.maintenance": "Entretien",
  "nav.leases": "Baux et avis",
  "nav.renewals": "Renouvellements",
  "nav.notices": "Avis provinciaux",
  "nav.forms": "Formulaires",
  "nav.bulk": "Actions groupées",
  "nav.inspections": "Inspections",
  "nav.assets": "Équipements",
  "nav.announcements": "Communications",
  "nav.calendar": "Calendrier",
  "nav.documents": "Documents",
  "nav.messages": "Messages",
  "nav.notifications": "Notifications",
  "nav.disbursements": "Versements aux propriétaires",
  "nav.tax": "Dossier fiscal",
  "nav.creditReporting": "Déclaration des loyers",
  "nav.rentIncreases": "Augmentations de loyer",
  "nav.reports": "Rapports",
  "nav.insights": "Analyses",
  "nav.team": "Équipe et accès",
  "nav.import": "Importer des données",
  "nav.settings": "Paramètres",
  "nav.legal": "Mentions légales et vie privée",
  "nav.support": "Centre d'aide",
  "ui.account": "Menu du compte",
  "ui.signOut": "Se déconnecter",
  "ui.settings": "Paramètres",
  "ui.collapse": "Réduire le menu",
  "ui.expand": "Agrandir le menu",
  "ui.openMenu": "Ouvrir le menu",
  "ui.closeMenu": "Fermer le menu",
  "ui.search": "Rechercher",
  "ui.shortcuts": "Raccourcis clavier",
  "ui.unread": "non lus",
  "ui.appearance": "Apparence",
  "ui.light": "Clair",
  "ui.dark": "Sombre",
  "ui.system": "Système",
  "ui.language": "Langue",
  "ui.moreLanguages": "L'anglais et le français sont entièrement pris en charge.",
  "ui.beta": "Bêta",
  "ui.signedIn": "Connecté",
  "ui.yourAccount": "Votre compte",
};

/**
 * Sentence-level French for page headers and empty states. Keys are the exact
 * English strings used in the interface.
 */
const frPhrases: Record<string, string> = {
  "A T776 package appears once you have a property with income or expenses.":
    "Un dossier T776 apparaît dès qu'un immeuble a des revenus ou des dépenses.",
  "About 10 minutes. You can stop any time — we save where you got to.":
    "Environ 10 minutes. Vous pouvez arrêter à tout moment — nous gardons votre progression.",
  "Add an existing tenant": "Ajouter un locataire existant",
  "An empty home costs money every day. See what's open, what it's costing, and get it listed.":
    "Un logement vide coûte de l'argent chaque jour. Voyez ce qui est libre, ce que cela coûte, et publiez l'annonce.",
  Announcements: "Communications",
  "Answer a few plain questions — Keyhold fills in the paperwork.":
    "Répondez à quelques questions simples — Keyhold remplit les documents.",
  "Anything your landlord shares for your building will appear here.":
    "Tout ce que votre propriétaire partage pour votre immeuble apparaîtra ici.",
  "Applications move left to right. Nothing is ever re-typed — each step fills the next.":
    "Les candidatures avancent de gauche à droite. Rien n'est ressaisi — chaque étape alimente la suivante.",
  "Approve a prospect first — the lease then fills itself in.":
    "Approuvez d'abord un candidat — le bail se remplit ensuite tout seul.",
  "Approved bills appear here grouped by the kind of work.":
    "Les factures approuvées apparaissent ici, regroupées par type de travaux.",
  "Ask the owner of this account to bring the data over.":
    "Demandez au propriétaire du compte d'importer les données.",
  "Ask the property owner to change who can work on which properties.":
    "Demandez au propriétaire de modifier qui peut travailler sur quels immeubles.",
  Assets: "Équipements",
  "Bring your spreadsheet over. We'll check every row before anything is created — and you can undo it.":
    "Importez votre feuille de calcul. Nous vérifions chaque ligne avant toute création — et vous pouvez annuler.",
  "Bulk actions": "Actions groupées",
  Calendar: "Calendrier",
  "Conversations stay attached to the home.": "Les conversations restent rattachées au logement.",
  "Create a lease": "Créer un bail",
  "Create lease": "Créer le bail",
  "Creation, signature, renewal and move-out — the whole lifecycle in one list.":
    "Création, signature, renouvellement et départ — tout le cycle de vie dans une seule liste.",
  "Do one thing for many tenants at once — personalised, never generic.":
    "Faites une même action pour plusieurs locataires — personnalisée, jamais générique.",
  Documents: "Documents",
  "Eleven reports, every figure computed from your own records. All amounts in Canadian dollars.":
    "Onze rapports, chaque chiffre calculé à partir de vos propres données. Tous les montants en dollars canadiens.",
  "Every home is paid up and no repairs are open. We'll surface anything urgent here.":
    "Tous les loyers sont payés et aucune réparation n'est en cours. Toute urgence apparaîtra ici.",
  "Every lease ending in the next 90 days, in one pipeline.":
    "Tous les baux qui se terminent dans les 90 prochains jours, dans un seul suivi.",
  "Everything with a date attached, colour-coded by what it is.":
    "Tout ce qui a une date, avec un code couleur par type d'événement.",
  "Filed by property, tagged by tenant, with expiry dates you won't miss.":
    "Classés par immeuble, associés au locataire, avec des dates d'expiration que vous ne manquerez pas.",
  "For properties you manage on someone else's behalf. Rent in, costs out, your fee, and what you owe the owner.":
    "Pour les immeubles que vous gérez pour autrui. Loyers encaissés, dépenses, vos honoraires et le solde dû au propriétaire.",
  "For tenancies that started before Keyhold — no application needed.":
    "Pour les locations commencées avant Keyhold — aucune candidature requise.",
  "From a tenant's request to an approved bill — one chain, one history.":
    "De la demande du locataire à la facture approuvée — une seule chaîne, un seul historique.",
  "Guideline maths, the earliest legal date, and the N1 — for one tenant or the whole portfolio.":
    "Le calcul selon le taux directeur, la première date légale et le formulaire N1 — pour un locataire ou tout le portefeuille.",
  "Import data": "Importer des données",
  "Import your data": "Importez vos données",
  "Importing is owner-only": "L'importation est réservée au propriétaire",
  Insights: "Analyses",
  Inspections: "Inspections",
  "Invite a property manager, then give them access to only the properties they look after.":
    "Invitez un gestionnaire, puis donnez-lui accès uniquement aux immeubles dont il s'occupe.",
  "Invoices generate on their own each month. All amounts in Canadian dollars.":
    "Les factures se génèrent automatiquement chaque mois. Tous les montants en dollars canadiens.",
  "It may have been declined and removed from the pipeline.":
    "Elle a peut-être été refusée et retirée du suivi.",
  "It may have been deleted. Head back to the lease list to pick another.":
    "Il a peut-être été supprimé. Retournez à la liste des baux pour en choisir un autre.",
  "Lease detail": "Détail du bail",
  "Lease not found": "Bail introuvable",
  "Lease wizard": "Assistant de bail",
  Leases: "Baux",
  "Leases move into this pipeline automatically 90 days before the end of the term.":
    "Les baux entrent automatiquement dans ce suivi 90 jours avant la fin du terme.",
  "Legal & privacy": "Mentions légales et vie privée",
  Maintenance: "Entretien",
  Messages: "Messages",
  "Missing inspection": "Inspection manquante",
  "New lease or notice": "Nouveau bail ou avis",
  "No announcements yet": "Aucune communication pour l'instant",
  "No applications yet": "Aucune candidature pour l'instant",
  "No approved repair spend yet": "Aucune dépense de réparation approuvée",
  "No conversations yet — message a tenant": "Aucune conversation — écrivez à un locataire",
  "No home has needed more than one visit in the last year.":
    "Aucun logement n'a nécessité plus d'une visite au cours de la dernière année.",
  "No leases in your view": "Aucun bail dans votre vue",
  "No listings yet": "Aucune annonce pour l'instant",
  "No notices": "Aucun avis",
  "No properties in view": "Aucun immeuble dans votre vue",
  "No properties in your view": "Aucun immeuble dans votre vue",
  "No properties shared with you yet": "Aucun immeuble ne vous a encore été partagé",
  "No repeat callouts": "Aucune intervention répétée",
  "No tenants in your view": "Aucun locataire dans votre vue",
  "Not enough history": "Historique insuffisant",
  "Not managed for an owner": "Non géré pour un propriétaire",
  "Not part of your access": "Hors de votre périmètre d'accès",
  "Nothing expiring in the next 90 days": "Rien n'expire dans les 90 prochains jours",
  "Nothing here": "Rien ici",
  "Nothing here yet": "Rien ici pour l'instant",
  "Nothing needs you right now": "Rien ne requiert votre attention pour le moment",
  "Nothing reported yet": "Rien n'a encore été signalé",
  "Nothing scheduled": "Rien de prévu",
  "Nothing shared yet": "Rien n'a encore été partagé",
  "Nothing to chart yet": "Aucune donnée à représenter",
  "Nothing to compare yet": "Rien à comparer pour l'instant",
  "Nothing to draft": "Aucun document à préparer",
  Notifications: "Notifications",
  "Offer, response, new term — or a clean move-out. Ontario increases run through the guideline calculator.":
    "Offre, réponse, nouveau terme — ou un départ en bonne et due forme. En Ontario, les augmentations passent par le calculateur du taux directeur.",
  "Official forms, filled in from your own records and kept as evidence.":
    "Formulaires officiels, remplis à partir de vos propres données et conservés comme preuve.",
  "Once a property is assigned to you, its money and occupancy charts appear here.":
    "Dès qu'un immeuble vous est assigné, ses graphiques financiers et d'occupation apparaissent ici.",
  "Once a unit has both a move-in and a move-out inspection, they line up here item by item.":
    "Dès qu'un logement a une inspection d'entrée et une de sortie, elles se comparent ici point par point.",
  "One message to a whole building — and proof it landed.":
    "Un message à tout un immeuble — avec la preuve qu'il a bien été reçu.",
  "Only the owner can manage the team": "Seul le propriétaire peut gérer l'équipe",
  "Owner disbursements": "Versements aux propriétaires",
  "Owner statements appear once you manage a property.":
    "Les relevés du propriétaire apparaissent dès que vous gérez un immeuble.",
  "Patterns appear once there are payments in both halves of the window.":
    "Les tendances apparaissent lorsqu'il y a des paiements dans les deux moitiés de la période.",
  "Plain answers, and a person to call if you'd rather talk.":
    "Des réponses claires, et quelqu'un à appeler si vous préférez parler.",
  "Properties & units": "Immeubles et logements",
  "Property managers work on their assigned properties; account settings stay with the owner.":
    "Les gestionnaires travaillent sur les immeubles qui leur sont assignés; les paramètres du compte restent au propriétaire.",
  Prospect: "Candidat",
  Prospects: "Candidats",
  "Provincial notices": "Avis provinciaux",
  "Publish a listing and share its public link — applications land here automatically.":
    "Publiez une annonce et partagez son lien public — les candidatures arrivent ici automatiquement.",
  "Publish a vacant home to start collecting applications.":
    "Publiez un logement vacant pour commencer à recevoir des candidatures.",
  Renewals: "Renouvellements",
  Rent: "Loyers",
  "Rent dates, repairs and lease endings will show here.":
    "Les échéances de loyer, les réparations et les fins de bail apparaîtront ici.",
  "Rent increases": "Augmentations de loyer",
  "Rent increases appear once you have an active lease.":
    "Les augmentations de loyer apparaissent dès que vous avez un bail actif.",
  "Rent reporting": "Déclaration des loyers",
  "Rent reporting appears once a tenant is on a lease you manage.":
    "La déclaration des loyers apparaît dès qu'un locataire est lié à un bail que vous gérez.",
  "Rent reporting to credit bureaus": "Déclaration des loyers aux bureaux de crédit",
  "Report library": "Bibliothèque de rapports",
  "Room by room, with photos — the evidence you need at move-out.":
    "Pièce par pièce, avec photos — la preuve dont vous avez besoin au départ du locataire.",
  "Set up your portfolio": "Configurez votre portefeuille",
  Settings: "Paramètres",
  "Settings and billing are owner-only":
    "Les paramètres et la facturation sont réservés au propriétaire",
  "Seven short steps. Every field explains itself, and you can save as a draft at any point.":
    "Sept étapes courtes. Chaque champ s'explique, et vous pouvez enregistrer un brouillon à tout moment.",
  "Sign a lease or notice": "Signer un bail ou un avis",
  "Six calm steps. Nothing is sent or final until you say so.":
    "Six étapes tranquilles. Rien n'est envoyé ni définitif avant votre accord.",
  "Start a thread and it stays attached to the tenant, the unit and the property, so nothing gets lost in email.":
    "Ouvrez un fil de discussion : il reste rattaché au locataire, au logement et à l'immeuble, pour que rien ne se perde dans les courriels.",
  "Support centre": "Centre d'aide",
  "Switch to an owner account with the demo switcher, or head back to the management app.":
    "Passez à un compte propriétaire avec le sélecteur de démo, ou revenez à l'application de gestion.",
  "T776 tax package": "Dossier fiscal T776",
  "Tax package": "Dossier fiscal",
  "Team & access": "Équipe et accès",
  "Tell every tenant at a property something once — snow removal, a water shut-off, a rent reminder.":
    "Informez tous les locataires d'un immeuble en une fois — déneigement, coupure d'eau, rappel de loyer.",
  "Template missing": "Modèle introuvable",
  Tenants: "Locataires",
  "Tenants who opt in have their monthly rent payments reported through our partner bureau service.":
    "Les locataires qui y consentent voient leurs paiements de loyer mensuels déclarés par notre service partenaire.",
  "That application is gone": "Cette candidature n'existe plus",
  "The people living in your homes.": "Les personnes qui habitent vos logements.",
  "The properties the owner has assigned to you.":
    "Les immeubles que le propriétaire vous a assignés.",
  "This appears as soon as there's data in range.":
    "Ceci apparaît dès qu'il y a des données dans la période.",
  "This area is for managers": "Cette section est réservée aux gestionnaires",
  "This area is for owners and managers":
    "Cette section est réservée aux propriétaires et aux gestionnaires",
  "This area is for property owners": "Cette section est réservée aux propriétaires",
  "This inspection points at a template that no longer exists.":
    "Cette inspection renvoie à un modèle qui n'existe plus.",
  "This unit is short one of the two inspections.":
    "Il manque l'une des deux inspections pour ce logement.",
  "Turn on “managed for an owner” above to produce disbursement statements for this property.":
    "Activez « géré pour un propriétaire » ci-dessus pour produire les relevés de versement de cet immeuble.",
  "Vacancies & listings": "Logements vacants et annonces",
  "What happened, when, and where to go about it.":
    "Ce qui s'est passé, quand, et où intervenir.",
  "What's in each unit, when the warranty ends, and who gets the door code.":
    "Ce que contient chaque logement, quand la garantie se termine, et qui reçoit le code de porte.",
  "When rent arrives, a repair comes in or a lease nears its end, it shows up here — with a link straight to the record.":
    "Quand un loyer arrive, qu'une réparation est signalée ou qu'un bail approche de sa fin, cela apparaît ici — avec un lien direct vers la fiche.",
  "When you report something, you'll be able to follow it here step by step.":
    "Quand vous signalez quelque chose, vous pourrez en suivre chaque étape ici.",
  "Your access": "Votre accès",
  "Your access level covers day-to-day work only. Ask the owner if you need rent, reports or tenant details.":
    "Votre niveau d'accès couvre uniquement le travail quotidien. Demandez au propriétaire s'il vous faut les loyers, les rapports ou les données des locataires.",
  "Your business, your rules, and what Keyhold costs you.":
    "Votre entreprise, vos règles, et ce que Keyhold vous coûte.",
  "Your manager decides which properties and sections appear in your portal. You'll see them here as soon as access is granted.":
    "Votre gestionnaire décide quels immeubles et quelles sections apparaissent dans votre portail. Ils s'afficheront ici dès l'accès accordé.",
  "Your rent invoices and receipts will show up here.":
    "Vos factures de loyer et vos reçus apparaîtront ici.",
  "Your rent, lease, receipts and repair requests all live in your tenant portal.":
    "Votre loyer, votre bail, vos reçus et vos demandes de réparation se trouvent tous dans votre portail locataire.",
  "Your statements, properties and shared documents live in your owner portal.":
    "Vos relevés, vos immeubles et vos documents partagés se trouvent dans votre portail propriétaire.",
  "Your year's rental income and expenses, mapped to the CRA's T776 lines — per property and all together.":
    "Vos revenus et dépenses de location de l'année, associés aux lignes du T776 de l'ARC — par immeuble et pour l'ensemble.",
  Dashboard: "Tableau de bord",
  "Money this month": "L'argent ce mois-ci",
};

const DICTS: Record<Locale, Dict> = { en, fr };

const STORAGE_KEY = "keyhold.locale";

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "fr") return saved;
  } catch {
    /* ignore */
  }
  const langs = typeof navigator !== "undefined" ? (navigator.languages ?? [navigator.language]) : [];
  for (const raw of langs) {
    if (raw?.toLowerCase().startsWith("fr")) return "fr";
  }
  return "en";
}

type Ctx = {
  locale: Locale;
  meta: LocaleMeta;
  setLocale: (l: Locale) => void;
  t: (key: StringKey) => string;
  /** Translate a plain English sentence used in the interface. */
  tx: (text?: string) => string | undefined;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — the choice just won't persist */
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const dict = DICTS[locale] ?? {};
    const french = locale === "fr";
    return {
      locale,
      meta: localeMeta(locale),
      setLocale,
      t: (key: StringKey) => dict[key] ?? en[key] ?? String(key),
      tx: (text?: string) => (french && text ? (frPhrases[text] ?? text) : text),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Marketing pages render outside the provider; English is the safe default.
    return {
      locale: "en",
      meta: localeMeta("en"),
      setLocale: () => {},
      t: (key: StringKey) => en[key] ?? String(key),
      tx: (text?: string) => text,
    };
  }
  return ctx;
}

/** Convenience for components that only need the translate function. */
export function useT() {
  return useI18n().t;
}

/** Convenience for translating English sentences already in the markup. */
export function useTx() {
  return useI18n().tx;
}
