/**
 * Service & hosting billing info shown to the app owner (admin) on the dashboard.
 * Edit the values below with real figures/dates/payment details before relying on this.
 */
export interface BillingConfig {
  providerName: string;
  hostingProvider: string;
  databaseProvider: string;
  monthlyHostingCost: number;
  monthlyDatabaseCost: number;
  monthlyMaintenanceCost: number;
  billingCycleStart: string; // ISO date, e.g. "2026-06-14"
  dueDate: string; // ISO date, e.g. "2026-07-14"
  status: 'paid' | 'due' | 'overdue';
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
  monthlyMaintenanceCost: 0,
  billingCycleStart: '2026-06-14',
  dueDate: '2026-07-14',
  status: 'due',
  paymentMethods: [
    { label: 'Bank', value: 'TODO: bank name + account no.' },
    { label: 'DuitNow / E-wallet', value: 'TODO: phone number' },
  ],
  contactName: 'Zarif',
  contactPhone: 'TODO: phone number',
};
