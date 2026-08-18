# Plan - Fix Dashboard Layout and Revamp Features Page

## Goals
1. Fix the overlapping Demo Banner and Dashboard Sidebar/Header.
2. Completely revamp the `/features` page with scroll-driven animations, proper screenshots, and Lottie integrations.

## Technical Details

### 1. Dashboard Layout Fix
- The `DemoBanner` is currently positioned `relative` but the `AppShell` layout doesn't account for its height in fixed elements like the sidebar and header.
- Use a CSS custom property `--demo-banner-height` set by the `DemoBanner` component to offset the `aside` and `header`.
- Wrap `DemoGate` in a `sticky top-0` container to ensure it stays visible but pushes content down.

### 2. Features Page Revamp
- **Component**: Update `src/routes/features.tsx`.
- **Animations**: Use `framer-motion` for `useScroll` and `useTransform` effects.
- **Content**: 
  - Add high-quality descriptions for Rent Tracking, Maintenance, Leases/Forms, Tenant Portal, and Reporting.
  - Implement "scroll-sticky" feature sections where screenshots transition as the user scrolls.
  - Add Lottie animations for each feature category (using placeholders from LottieFiles).
- **Navigation**: Fix dead links by ensuring they route to the specific feature deep-dive pages (e.g., `/features/rent`).

### 3. Verification
- Use `playwright` to confirm the banner no longer overlaps the logo at multiple viewports.
- Manual verification of scroll animations in the preview.

## Implementation Steps

1. **Layout Fix (AppShell & DemoBanner)**:
   - [x] Modify `src/components/keyhold/demo-banner.tsx` to set `--demo-banner-height`.
   - [x] Update `src/components/keyhold/app-shell.tsx` to use this variable for `aside` top offset and header `top`.

2. **Features Page**:
   - [ ] Create a new structure in `src/routes/features.tsx` using a "pinned" screenshot side and a scrolling text side.
   - [ ] Integrate `lottie-react` for dynamic icons.
   - [ ] Add real descriptions and better visual hierarchy.

3. **Assets**:
   - [ ] Use generic high-quality dashboard screenshot URLs or generated mock UI screenshots.
