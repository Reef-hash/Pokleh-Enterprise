export interface HelpContent {
  purpose: string;
  steps: string[];
  mistakes: string[];
  tips: string[];
}

const pageHelp: Record<string, HelpContent> = {
  dashboard: {
    purpose: "Overview of today's operations with quick access to all modules.",
    steps: [
      "View your key metrics: active customers, service areas, and outstanding debt.",
      "Use the Quick Actions cards to jump directly to any module.",
      "Navigate using the sidebar menu to access all features.",
    ],
    mistakes: [],
    tips: [
      "Check outstanding debt regularly to stay on top of collections.",
      "Use Quick Actions for faster navigation to frequent tasks.",
    ],
  },
  areas: {
    purpose: "Manage delivery coverage areas for your ice distribution.",
    steps: [
      "Click Add Area to create a new delivery area.",
      "Enter a name for the area (e.g. 'Town Centre', 'Kampung Baru').",
      "Areas are used to group customers, assign staff, and track stock distribution.",
    ],
    mistakes: [
      "Deleting an area will affect customer assignments and staff scheduling.",
    ],
    tips: [
      "Name areas by geographic location or route for clarity.",
      "You can reassign customers to a different area if needed.",
    ],
  },
  customers: {
    purpose: "Manage your ice customers and their debt balances.",
    steps: [
      "Click Add Customer to register a new customer.",
      "Fill in name, phone number, address, and select their delivery area.",
      "Toggle the Active switch to enable or disable a customer account.",
      "View each customer's debt balance updated in real time.",
    ],
    mistakes: [
      "Make sure the area is correct — it determines staff assignment.",
      "Double-check phone numbers for accuracy.",
    ],
    tips: [
      "Search customers by name using the search bar.",
      "Filter by area to quickly find customers in a specific zone.",
    ],
  },
  suppliers: {
    purpose: "Manage your ice suppliers and their contact information.",
    steps: [
      "Click Add Supplier to register a new supplier.",
      "Enter the supplier name and optional phone number.",
      "Edit or delete suppliers using the action buttons.",
    ],
    mistakes: [
      "Deleting a supplier will affect stock intake records and price history.",
    ],
    tips: [
      "Keep supplier information up to date for smooth stock intake.",
    ],
  },
  "staff-assignments": {
    purpose: "Assign staff members to delivery areas.",
    steps: [
      "Select a staff member from the dropdown.",
      "Select the area to assign them to.",
      "Click Assign to save the assignment.",
      "Use the X button to end an assignment when staff changes areas.",
    ],
    mistakes: [
      "A staff member can only have one active assignment per area.",
      "Ending an assignment does not delete it — it records the end date.",
    ],
    tips: [
      "Assign staff to their most familiar areas for better efficiency.",
    ],
  },
  "stock-intake": {
    purpose: "Record incoming ice stock from suppliers.",
    steps: [
      "Select the date of intake.",
      "Choose the supplier from the dropdown.",
      "Enter the quantity received (in pax).",
      "Enter the cost per pax.",
      "Add optional notes (e.g. delivery reference).",
      "Click Record Intake to save.",
    ],
    mistakes: [
      "Enter COST per pax, not total cost. Total cost = quantity × cost.",
      "Make sure the supplier is selected before saving.",
    ],
    tips: [
      "Record intakes promptly to keep stock levels accurate.",
      "Use notes to track delivery order numbers or invoices.",
    ],
  },
  "stock-distribution": {
    purpose: "Assign stock from an intake to delivery areas.",
    steps: [
      "Select the intake reference (recent stock arrival).",
      "Select the target delivery area.",
      "Enter the quantity to assign.",
      "The available stock remaining is shown automatically.",
      "Click Distribute to save.",
    ],
    mistakes: [
      "You cannot distribute more stock than is available.",
      "Distributions are permanent records — correct via a new distribution.",
    ],
    tips: [
      "Distribute early in the day so staff can begin deliveries.",
      "Track remaining stock to plan your next intake.",
    ],
  },
  "stock-return": {
    purpose: "Record unsold ice stock returned from delivery areas.",
    steps: [
      "Select the distribution that the stock was part of.",
      "Select the area returning the stock.",
      "Enter the quantity being returned.",
      "Set the return date.",
      "Click Record Return to save.",
    ],
    mistakes: [
      "Returns must be recorded on the same day or after the distribution.",
    ],
    tips: [
      "Returns help calculate accurate settlement amounts for suppliers.",
      "Record returns as soon as stock comes back.",
    ],
  },
  sales: {
    purpose: "Record ice sales to customers.",
    steps: [
      "Select the customer from the dropdown.",
      "Select the delivery area.",
      "Enter the quantity of ice pax sold.",
      "Enter the selling price per pax.",
      "Select payment type: Cash (immediate payment) or Debt (credit sale).",
      "Add optional notes.",
      "Click Save to record the sale.",
    ],
    mistakes: [
      "Enter PRICE PER PAX, not total price. Total = quantity × price.",
      "Select the correct payment type — debt sales increase customer balance.",
      "Verify the customer and quantity before saving.",
    ],
    tips: [
      "For cash sales, collect payment before recording.",
      "Debt sales automatically update the customer's outstanding balance.",
    ],
  },
  "debt-ledger": {
    purpose: "View the complete history of customer debt movements.",
    steps: [
      "The ledger shows all debt events: sales, payments, and adjustments.",
      "Use the customer filter to view a specific customer's ledger.",
      "Each entry shows the balance before and after the transaction.",
    ],
    mistakes: [],
    tips: [
      "The debt ledger is append-only — entries cannot be edited or deleted.",
      "Correct a wrong entry by recording an adjustment.",
    ],
  },
  "debt-collection": {
    purpose: "Record debt payments received from customers.",
    steps: [
      "Select the customer making the payment.",
      "Enter the payment amount.",
      "Select the collection date.",
      "Add optional notes (e.g. payment method).",
      "Click Save to record the collection.",
    ],
    mistakes: [
      "Only collect amounts up to the customer's outstanding balance.",
      "Double-check the customer selection — balances update immediately.",
    ],
    tips: [
      "Record collections immediately when payment is received.",
      "Use notes to track payment method (cash, bank transfer, etc.).",
    ],
  },
  expenses: {
    purpose: "Record operational expenses for your business.",
    steps: [
      "Select an expense category (Transportation, Packaging, etc.).",
      "Enter the amount spent.",
      "Select the expense date.",
      "Add optional notes describing the expense.",
      "Click Save to record.",
    ],
    mistakes: [
      "Enter the correct amount — expenses affect daily profit calculations.",
    ],
    tips: [
      "Categorise expenses consistently for better reporting.",
      "Record expenses daily to keep financial reports accurate.",
    ],
  },
  "price-history": {
    purpose: "View historical cost-per-pax records for suppliers.",
    steps: [
      "The list shows all price changes sorted by date.",
      "Filter by supplier to see their specific price history.",
    ],
    mistakes: [],
    tips: [
      "Use price history to negotiate better rates with suppliers.",
      "Price changes are recorded automatically when stock intake is entered.",
    ],
  },
  settlements: {
    purpose: "Calculate and manage supplier payments.",
    steps: [
      "View all pending intakes that need settlement.",
      "Click Calculate to compute the payable amount based on sold quantity.",
      "Review the calculated amount (payable quantity × cost per pax).",
      "Click Settle to mark the settlement as paid.",
    ],
    mistakes: [
      "Settlement amounts cannot be changed once calculated.",
      "Unsettled intakes may affect supplier relationships.",
    ],
    tips: [
      "Settle promptly to maintain good supplier relationships.",
      "The settlement report helps track your liabilities.",
    ],
  },
  "daily-closing": {
    purpose: "Perform end-of-day reconciliation for each area.",
    steps: [
      "Select the date and area to close.",
      "Review the day's totals: assigned stock, sold quantity, returns.",
      "Review financial summaries: cash sales, debt sales, collections, expenses.",
      "Click Close to lock the day's records.",
      "Click Reconcile to finalise after verification.",
    ],
    mistakes: [
      "Once closed, records for that day cannot be modified.",
      "Ensure all sales, returns, and expenses are entered before closing.",
    ],
    tips: [
      "Close each day before starting the next day's operations.",
      "Use reconciliation to verify all figures match your physical count.",
    ],
  },
  "pokleh-reports": {
    purpose: "View reports and analytics for your business.",
    steps: [
      "Browse the summary cards showing revenue, expenses, profit, and collections.",
      "Switch between tabs to view different report types.",
      "Use the charts to visualise trends over time.",
    ],
    mistakes: [],
    tips: [
      "Reports update in real time based on entered data.",
      "Use reports to identify trends and make informed decisions.",
    ],
  },
};

export function getHelpContent(pageId: string): HelpContent | null {
  return pageHelp[pageId] ?? null;
}

export function getAllHelpTopics(): { id: string; title: string; content: HelpContent }[] {
  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    areas: "Areas",
    customers: "Customers",
    suppliers: "Suppliers",
    "staff-assignments": "Staff Assignments",
    "stock-intake": "Stock Intake",
    "stock-distribution": "Stock Distribution",
    "stock-return": "Stock Returns",
    sales: "Sales Entry",
    "debt-ledger": "Debt Ledger",
    "debt-collection": "Debt Collection",
    expenses: "Expenses",
    "price-history": "Price History",
    settlements: "Supplier Settlements",
    "daily-closing": "Daily Closing",
    "pokleh-reports": "Reports",
  };
  return Object.entries(pageHelp).map(([id, content]) => ({
    id,
    title: titles[id] ?? id,
    content,
  }));
}

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: "bottom" | "top" | "left" | "right";
}

export const tourSteps: TourStep[] = [
  {
    targetId: "tour-dashboard",
    title: "Dashboard",
    description: "Welcome to Pokleh Enterprise! This is your home screen showing key metrics — active customers, service areas, outstanding debt — and quick action cards to jump into any module.",
    position: "bottom",
  },
  {
    targetId: "tour-customers",
    title: "Customers",
    description: "Add and manage your ice customers here. Each customer is assigned to a delivery area, and their debt balance is tracked automatically.",
    position: "right",
  },
  {
    targetId: "tour-stock-intake",
    title: "Stock Intake",
    description: "Record incoming ice stock from your suppliers. Enter the quantity received and cost per pax — the system calculates total cost automatically.",
    position: "right",
  },
  {
    targetId: "tour-sales",
    title: "Sales Entry",
    description: "Record ice sales to customers. Select the customer, enter quantity and price, and choose payment type: Cash (immediate) or Debt (credit). Debt sales update the customer's balance automatically.",
    position: "right",
  },
  {
    targetId: "tour-debt-collection",
    title: "Debt Collection",
    description: "Track and collect outstanding customer debts. Select a debtor, enter the payment amount, and the system updates their balance and ledger instantly.",
    position: "right",
  },
  {
    targetId: "tour-reports",
    title: "Reports",
    description: "View reports on sales, expenses, profit, and collections. Use the charts to spot trends and make informed business decisions.",
    position: "right",
  },
];
