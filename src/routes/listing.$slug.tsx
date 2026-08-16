import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Car, Package } from "@phosphor-icons/react";
import { Tag } from "@/components/keyhold/pipeline";
import { Brand } from "@/components/keyhold/app-shell";
import { useLeasing } from "@/lib/mock-leasing";
import { cad, longDate, propertyById } from "@/lib/mock-data";

export const Route = createFileRoute("/listing/$slug")({
  head: () => ({
    meta: [
      { title: "Home for rent — Keyhold" },
      { name: "description", content: "See photos, rent and availability for this Canadian rental home, and apply online in minutes." },
      { property: "og:title", content: "Home for rent — Keyhold" },
      { property: "og:description", content: "Photos, rent, availability and a simple online application." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PublicListing,
});

function PublicListing() {
  const { slug } = Route.useParams();
  const { listings } = useLeasing();
  const listing = listings.find((l) => l.slug === slug);

  if (!listing) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold text-navy">This home is no longer listed</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may have been rented already.</p>
      </main>
    );
  }
  const property = propertyById(listing.propertyId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4">
        <Brand />
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap gap-2">
          <Tag tone="action">{listing.unitType}</Tag>
          {listing.status === "leased" && <Tag tone="navy">Rented</Tag>}
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-navy">{listing.headline}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin weight="duotone" className="h-4 w-4" aria-hidden="true" />
          {property.city}, {property.province}
        </p>

        {listing.photos.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {listing.photos.map((p) => (
              <img key={p} src={p} alt={listing.headline} loading="lazy" className="h-56 w-full rounded-2xl object-cover" />
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <p className="text-base leading-relaxed text-foreground">{listing.description || "Contact us for more details about this home."}</p>
            <ul className="mt-4 flex flex-wrap gap-4 text-sm text-navy">
              <li>{listing.bedrooms === 0 ? "Bachelor" : `${listing.bedrooms} bedroom`}</li>
              <li>{listing.bathrooms} bath</li>
              {listing.parking && <li className="flex items-center gap-1"><Car weight="duotone" className="h-4 w-4" /> Parking</li>}
              {listing.storage && <li className="flex items-center gap-1"><Package weight="duotone" className="h-4 w-4" /> Storage</li>}
            </ul>
          </div>
          <aside className="card-soft h-fit p-5">
            <p className="tnum font-display text-3xl font-extrabold text-navy">{cad(listing.rent)}</p>
            <p className="text-sm text-muted-foreground">per month</p>
            <p className="tnum mt-2 text-sm text-navy">Available {longDate(listing.availableFrom)}</p>
            <Link
              to="/apply/$slug"
              params={{ slug: listing.slug }}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              Apply for this home
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
