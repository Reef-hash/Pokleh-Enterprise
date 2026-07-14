/**
 * One-off development payment + hosting/database info shown to the app owner
 * (admin) on the dashboard. Edit the values below with real figures/dates/
 * payment details before relying on this.
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
  paymentMethods: {
    label: string;
    value: string;
  }[];
  /** Path (under /public) to a DuitNow QR / scan-and-pay image, or null to hide it. */
  qrImage: string | null;
  contactName: string;
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
  paymentMethods: [
    { label: 'Bank', value: 'Maybank' },
    { label: 'No. Akaun', value: '153048106549' },
    { label: 'Nama Pemegang Akaun', value: 'Zarif El Mansour Bin Esidil Hamzah' },
  ],
  qrImage: '/payment-qr.jpg',
  contactName: 'Zarif',
  contactPhone: '01155598954',
};
