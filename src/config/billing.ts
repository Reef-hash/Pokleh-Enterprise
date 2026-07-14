/**
 * One-off development payment + hosting/database info shown to the app owner
 * (admin) on the dashboard. Edit the values below with real figures/dates/
 * payment details before relying on this.
 */
export interface BillingConfig {
  providerName: string;
  hostingProvider: string;
  databaseProvider: string;
  /** Monthly infra cost Catalysm Inc currently absorbs while payment is pending. */
  monthlyHostingCost: number;
  monthlyDatabaseCost: number;
  /** One-off development fee for building the app — not a subscription. */
  projectFee: number;
  amountPaid: number;
  dueDate: string; // ISO date, e.g. "2026-07-28"
  status: 'paid' | 'unpaid' | 'overdue';
  paymentMethods: {
    label: string;
    value: string;
  }[];
  contactName: string;
  contactPhone: string;
}

export const billingConfig: BillingConfig = {
  providerName: 'Catalysm Inc',
  hostingProvider: 'Vercel',
  databaseProvider: 'Supabase',
  monthlyHostingCost: 0,
  monthlyDatabaseCost: 0,
  projectFee: 0,
  amountPaid: 0,
  dueDate: '2026-07-28',
  status: 'unpaid',
  paymentMethods: [
    { label: 'Bank', value: 'TODO: bank name + account no.' },
    { label: 'DuitNow / E-wallet', value: 'TODO: phone number' },
  ],
  contactName: 'Zarif',
  contactPhone: 'TODO: phone number',
};
