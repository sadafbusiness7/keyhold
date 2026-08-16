# Plan: Record Detail Pages Implementation

Build comprehensive detail pages for Properties, Units, Tenants, and Leases to allow deep management of the portfolio beyond simple list views.

## User Review Required

> [!IMPORTANT]
> Detail pages will use a tabbed architecture with deep-linkable URLs (e.g., `/app/properties/123?tab=financials`).

- **Layout Strategy**: Use a consistent header + tabs + content structure.
- **Navigation**: Breadcrumbs will be added to all detail pages for easy context switching.
- **Mobile UX**: Tabs will switch to a scrollable segmented control on small screens.

## Technical Details

### New Routes
- `src/routes/app.properties.$id.tsx`: Property Detail
- `src/routes/app.units.$id.tsx`: Unit Detail
- `src/routes/app.tenants.$id.tsx`: Tenant Detail
- `src/routes/app.leases.$id.tsx`: Lease Detail

### Component Architecture
- Create a shared `DetailLayout` component to handle headers, breadcrumbs, and tab navigation.
- Implement specialized tab content components for each entity (e.g., `PropertyOverview`, `UnitTenancies`, `TenantLedger`).
- Use TanStack Router's `search` params for tab state to enable deep linking.

### Data Layer
- Extend `mock-data.ts` and `mock-access.tsx` if necessary to ensure all fields (appliances, warranties, signature audit trails) are available for the demo.
- Ensure every tab has explicit Loading/Empty/Error state handling using existing `ModuleBoundary`.

### Accessibility & Resilience
- Keyboard navigation (left/right arrows) for tabs.
- ARIA landmarks for sections.
- Proper focus management when switching tabs.
