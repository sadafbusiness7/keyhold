# Implementation Plan - Keyhold Project Integration and Signup Fix

This plan covers extracting the uploaded GitHub project, merging it into the current workspace, and fixing the "Start free" button journey to ensure it leads to a working signup process rather than a demo.

## User Review Required

> [!IMPORTANT]
> The "Start free" button currently redirects to the demo account (`/portal`). I will update it to point to `/signup` and ensure the signup flow is fully functional as requested.

- The project uses TanStack Start, which is the preferred stack.
- I will preserve the distinctive visual style (Canadian landlord focused, calm aesthetic).

## Proposed Changes

### Project Integration
- Extract the uploaded zip file to a temporary directory.
- Use `rsync` to merge the files into the workspace, excluding `.git` to prevent corruption.
- Install any missing dependencies identified in `package.json`.

### Frontend Fixes
- **Homepage (`src/routes/index.tsx`)**:
    - Update all "Start free" buttons (hero and footer sections) to link to `/signup` instead of `/portal` or demo placeholders.
    - Remove the comment block containing the raw instruction text from the top of the file as requested (executing the command within it, then deleting it).

### Signup Journey (`src/routes/signup.tsx`)
- Verify the multi-step signup flow works correctly.
- Ensure the final step redirects to the actual app dashboard (`/app`) and shows a success toast.
- If backend persistence is required later, I will recommend enabling Lovable Cloud, but for now, I will ensure the frontend state transitions are smooth.

## Technical Details

- **File Merging**: `rsync -av --exclude='.git' /tmp/extracted/ /dev-server/`
- **Dependency Management**: `bun install`
- **Routing**: TanStack Router `@tanstack/react-router` for navigation updates.
- **State Management**: React `useState` for multi-step form handling in `signup.tsx`.

## Validation Plan

- **Visual Check**: Open the preview and verify the "Start free" button leads to the signup page.
- **Interaction Check**: Complete the 3-step signup flow (Account -> Portfolio -> Managers) and verify it reaches the final "Finish and open Keyhold" button.
- **Console Audit**: Check for any missing assets or failed imports after the merge.
