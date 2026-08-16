# Marketing Site Expansion Plan

Expand the Keyhold marketing site beyond the homepage with a premium, warm-canvas aesthetic and comprehensive feature/resource pages.

## User Review Required

> [!IMPORTANT]
> The marketing site now includes 15+ new pages. Please verify the "soft-premium" aesthetic and the specific Canadian-first messaging across the new sections.

## Proposed Changes

### Core Infrastructure
- Create `MarketingShell` component with consistent navigation, breadcrumbs, and footer.
- Implement responsive, SEO-optimized layouts with OpenGraph metadata for every route.
- Use a "warm canvas" background and navy/action color palette.

### New Marketing Pages
- **Pricing**: Interactive calculator + FAQ + fee disclosure.
- **Features Overview**: Hub for all major platform capabilities.
- **Feature Deep Dives**: Dedicated pages for Rent Tracking, Maintenance, Leases/Forms, Tenant Portal, and Reporting.
- **Comparisons**: Honest "vs" pages for Buildium, DoorLoop, and Spreadsheets.
- **Resources**: Blog index, Help Centre index, and Roadmap/Changelog.
- **Local Landing**: Ontario-specific compliance page highlighting RTA/LTB support.
- **Narrative**: About Us and Contact pages.

### Navigation Integration
- Update homepage navigation and footer to link to all new sections.
- Ensure all "Start free" CTAs point to `/signup`.

## Technical Details

- **Framework**: TanStack Start v1 with file-based routing.
- **Styling**: Tailwind CSS v4 with semantic tokens (`bg-surface`, `text-navy`, `bg-action`).
- **Icons**: Phosphor Icons (Duotone style).
- **SEO**: Unique `head()` configurations per route with meta/OG tags.
- **Components**: Reusable `MarketingShell` to wrap all public-facing content.
