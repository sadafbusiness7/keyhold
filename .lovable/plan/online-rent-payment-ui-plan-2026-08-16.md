# Online Rent Payment UI Plan

Add integrated rent payment UI for tenants and management tools for landlords, focusing on Canadian payment methods (PAD/Bank, Card), autopay, and clear fee disclosure.

## Proposed Changes

### 1. Data Models & State (`src/lib/rent-engine.ts`, `src/lib/mock-rent.tsx`)
- Add `PaymentMethodConfig` type: `{ id: string; type: 'bank' | 'card'; last4: string; label: string; isDefault: boolean }`.
- Add `AutopayStatus` type: `{ leaseId: string; enabled: boolean; methodId: string }`.
- Extend `RentProvider` with methods to:
  - Manage payment methods (add/remove/set default).
  - Toggle autopay per lease.
  - Process "live" payments (simulated).
  - Track payout status for landlords.

### 2. Tenant Portal: Payment UI (`src/components/keyhold/portal-screens.tsx`, `src/routes/portal.tsx`)
- **Payment Sheet**: A new flow when clicking "Pay rent":
  - **Step 1: Invoice Review**: Detailed breakdown of amount due, credits applied, and **Processing Fees** (e.g., $0 for Bank/PAD, 2.75% for Credit Card).
  - **Step 2: Method Selection**: Choose between saved methods or add new.
  - **Step 3: Confirmation**: Final total disclosure before processing.
- **Autopay Management**: Clear UI in the Rent tab to toggle autopay, with "Pre-charge notice" info and "Cancel anytime" clarity.
- **Enhanced History**: Update history rows with "Succeeded", "Pending", "Failed" states and receipt download.

### 3. Landlord Dashboard: Rent & Tenant Management (`src/routes/app.rent.tsx`, `src/routes/app.tenants.tsx`)
- **Rent Ledger (Failed Queue)**: Add a filtered view or highlighted rows for "Failed payments" with quick "Retry" or "Contact tenant" actions.
- **Tenant Details**: Show payment method status (Connected/Not connected) and autopay enrollment in the tenant list and quick view.
- **Payouts View**: A new tab in `app.rent.tsx` for "Payouts/Reconciliation" showing money cleared to the landlord's bank account.

### 4. UI/UX Refinement
- **Demo vs Live**: Add "Demo mode" watermarks to payment screens to ensure the user knows no real money is moving.
- **Fee Disclosure**: Standardize fee labels (e.g., "Bank transfer: CA$0.00", "Credit card: 2.9% + 30¢").

## Technical Details
- **Tone & Icons**: Use `@phosphor-icons/react` (Bank, CreditCard, CheckCircle, Warning, Clock).
- **Simulated Latency**: Use `optimistic` utility for payment transitions.
- **Locked Tokens**: Ensure all money formatting uses `money()` from `rent-engine.ts`.
