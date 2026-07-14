/**
 * One-off development payment + hosting/database info shown app-wide while
 * payment is outstanding. Edit the values below with real figures/dates
 * before relying on this.
 */
export interface BillingConfig {
  providerName: string;
  hostingProvider: string;
  databaseProvider: string;
  /**
   * Monthly infra cost Catalysm Inc currently absorbs while payment is pending.
   * Priced at each provider's entry-level paid plan (Vercel Pro / Supabase Pro),
   * converted from USD at ~RM4.08/USD.
   */
  monthlyHostingCost: number;
  monthlyDatabaseCost: number;
  /** One-off development fee for building the app — not a subscription. */
  projectFee: number;
  amountPaid: number;
  dueDate: string; // ISO date, e.g. "2026-07-28"
  status: 'paid' | 'unpaid' | 'overdue';
  contactName: string;
  /** Local Malaysian format, e.g. "01155598954" — used to build the WhatsApp deep link. */
  contactPhone: string;
}

export const billingConfig: BillingConfig = {
  providerName: 'Catalysm Inc',
  hostingProvider: 'Vercel',
  databaseProvider: 'Supabase',
  monthlyHostingCost: 82, // Vercel Pro — USD 20/mo
  monthlyDatabaseCost: 102, // Supabase Pro — USD 25/mo
  projectFee: 770,
  amountPaid: 0,
  dueDate: '2026-07-28',
  status: 'unpaid',
  contactName: 'Zarif',
  contactPhone: '01155598954',
};
