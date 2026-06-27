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
      "View your key metrics: active customers, fleet size, and outstanding debt.",
      "Use the Quick Actions cards to jump directly to any module.",
      "Navigate using the sidebar menu to access all features.",
    ],
    mistakes: [],
    tips: [
      "Check outstanding debt regularly to stay on top of collections.",
      "Use Quick Actions for faster navigation to frequent tasks.",
    ],
  },
  trucks: {
    purpose: "Manage the lorries (trucks) used for your ice distribution fleet.",
    steps: [
      "Click Add Truck to register a new lorry.",
      "Enter a name for the truck (e.g. 'Lori A', 'Lori B').",
      "Trucks are used to group customers, assign staff, and track stock intake, distribution, and sales.",
    ],
    mistakes: [
      "Deleting a truck will affect customer assignments and staff scheduling.",
    ],
    tips: [
      "Name trucks by route or driver for clarity.",
      "You can reassign customers to a different truck if needed.",
    ],
  },
  customers: {
    purpose: "Manage your ice customers and their debt balances.",
    steps: [
      "Click Add Customer to register a new customer.",
      "Fill in name, phone number, address, and select their delivery truck.",
      "Toggle the Active switch to enable or disable a customer account.",
      "View each customer's debt balance updated in real time.",
    ],
    mistakes: [
      "Make sure the truck is correct — it determines staff assignment.",
      "Double-check phone numbers for accuracy.",
    ],
    tips: [
      "Search customers by name using the search bar.",
      "Filter by truck to quickly find customers on a specific route.",
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
    purpose: "Assign staff members to trucks.",
    steps: [
      "Select a staff member from the dropdown.",
      "Select the truck to assign them to.",
      "Click Assign to save the assignment.",
      "Use the X button to end an assignment when staff changes trucks.",
    ],
    mistakes: [
      "A staff member can only have one active assignment per truck.",
      "Ending an assignment does not delete it — it records the end date.",
    ],
    tips: [
      "Assign staff to their most familiar trucks/routes for better efficiency.",
    ],
  },
  "stock-intake": {
    purpose: "Record incoming ice stock from suppliers, collected by a specific truck.",
    steps: [
      "Select the date of intake.",
      "Choose the supplier and the truck that collected the stock.",
      "Enter the quantity received (in pax) and cost per pax for each product type — leave a product blank to skip it.",
      "Add optional notes (e.g. delivery reference).",
      "Click Record Intake to save. Multiple product types can be saved in one trip.",
    ],
    mistakes: [
      "Enter COST per pax, not total cost. Total cost = quantity × cost.",
      "Make sure the supplier and truck are selected before saving.",
    ],
    tips: [
      "Record intakes promptly to keep stock levels accurate.",
      "Use notes to track delivery order numbers or invoices.",
    ],
  },
  "stock-distribution": {
    purpose: "Transfer stock from one truck to another (e.g. a hub truck redistributing to other trucks).",
    steps: [
      "Select the source truck (from) and the destination truck (to).",
      "Select the product type.",
      "Enter the quantity to transfer — the available stock on the source truck is shown automatically.",
      "Optionally tag the transfer to a specific intake batch for traceability.",
      "Click Distribute to save.",
    ],
    mistakes: [
      "You cannot transfer more stock than is available on the source truck.",
      "Distributions are permanent records — correct via a new distribution.",
    ],
    tips: [
      "Distribute early in the day so staff can begin deliveries.",
      "Use truck-to-truck transfers to sweep unsold stock between trucks at end of day (e.g. D to E).",
    ],
  },
  "stock-return": {
    purpose: "Record unsold ice stock returned from a truck (e.g. back to the supplier/warehouse).",
    steps: [
      "Select the truck returning the stock.",
      "Optionally tag the return to a specific distribution or intake batch.",
      "Enter the quantity being returned.",
      "Set the return date.",
      "Click Record Return to save.",
    ],
    mistakes: [
      "Returns must be recorded on the same day or after the related distribution/intake.",
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
      "Select the truck.",
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
    purpose: "Perform end-of-day reconciliation for each truck and product type.",
    steps: [
      "Select the date, truck, and product type to close.",
      "Review the day's totals: intake, transfer in/out, sold quantity, returns, and carry-forward balance.",
      "Review financial summaries: cash sales, debt sales, collections, expenses.",
      "Click Close to lock the day's records.",
      "Click Reconcile to finalise after verification.",
    ],
    mistakes: [
      "Once closed, records for that day cannot be modified.",
      "Ensure all sales, transfers, returns, and expenses are entered before closing.",
    ],
    tips: [
      "Close each day before starting the next day's operations.",
      "A nonzero carry-forward balance is allowed — a truck can carry unsold stock overnight.",
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
    trucks: "Trucks",
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
    description: "Welcome to Pokleh Enterprise! This is your home screen showing key metrics — active customers, fleet size, outstanding debt — and quick action cards to jump into any module.",
    position: "bottom",
  },
  {
    targetId: "tour-customers",
    title: "Customers",
    description: "Add and manage your ice customers here. Each customer is assigned to a delivery truck, and their debt balance is tracked automatically.",
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
