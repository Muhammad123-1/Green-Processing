# ERP SYSTEM — PROCUREMENT & ACCOUNTING INTEGRATION

## ROLE

You are a Senior Full-Stack Engineer, ERP Systems Architect, Database Engineer, and Enterprise Financial Systems Developer.

Your task is to extend my **existing factory ERP application** by improving and connecting two modules:

1. Procurement Department (Supply Manager / Snabjenets).
2. Accounting Department (Buxgalteriya).

The factory processes vegetables and other raw materials into finished and semi-finished products.

The application already contains a Director Dashboard, Warehouse Management, Inventory, Quality Control, Production, Supplier information, and other operational modules.

**Do not build a new ERP system. Work within the existing application.**

---

# 1. MAIN BUSINESS OBJECTIVE

The Procurement Department must be able to answer:

- Which suppliers do we owe money to?
- How much do we owe each supplier?
- How much has already been paid?
- What is the remaining outstanding balance?
- Which supplier invoices are overdue?
- What products have we ordered?
- What quantities are expected to arrive?
- Which deliveries are delayed?
- What materials does production currently need?
- Which products are running low in the warehouse?
- Which supplier offers the best purchasing conditions?

The Accounting Department must be able to answer:

- Which supplier invoices have been received?
- Which invoices have been verified and approved?
- How much money has been paid to each supplier?
- When were payments made?
- Which invoices remain unpaid or partially paid?
- How much debt is currently outstanding?
- Which payments are due soon or overdue?
- Which payments are awaiting approval or confirmation?

Both departments must use connected, consistent business records.

The Procurement Department must not maintain a separate manually duplicated supplier debt database.

Accounting must remain the authoritative source for recognized supplier payables and confirmed payments.

---

# 2. STRICT EXISTING PROJECT RULES

Before implementing anything:

1. Inspect the existing codebase.
2. Inspect existing Procurement and Accounting modules.
3. Inspect supplier, product, inventory, order, and payment-related database models.
4. Identify the existing technology stack.
5. Reuse existing authentication and permissions.
6. Reuse existing components and design patterns.
7. Reuse existing business logic where it is correct.

Do not:

- Rebuild the application.
- Create an independent procurement system.
- Replace the existing database without justification.
- Remove unrelated modules.
- Break existing Warehouse, Production, or Director Dashboard functionality.
- Duplicate existing supplier or product records.
- Invent business data.
- Add unnecessary libraries.
- Make destructive database changes without approval.

Preserve existing operational data and relationships.

---

# 3. PROCUREMENT DASHBOARD — MINIMAL INTERFACE

The procurement dashboard must be simple, practical, and focused on daily operational decisions.

Remove unnecessary visual clutter from the Procurement interface.

Do not fill the dashboard with decorative charts, repetitive cards, long explanations, or unrelated statistics.

## MAIN KPI CARDS

Display only the most important operational metrics.

### KPI 1 — TOTAL SUPPLIER DEBT

Total currently outstanding recognized supplier debt.

Display:

- Outstanding amount.
- Number of suppliers with outstanding balances.
- Overdue amount, if any.

Do not combine currencies into a misleading total. Use separate currency totals or properly documented reporting-currency conversions.

### KPI 2 — ACTIVE PURCHASE ORDERS

Display:

- Number of active purchase orders.
- Total ordered quantity, grouped by compatible units where applicable.
- Number of overdue deliveries.

### KPI 3 — MATERIALS TO PURCHASE

Display:

- Number of materials requiring procurement.
- Required quantities.
- Urgent shortages.

These values must be calculated using real production requests, available inventory, open purchase orders, and approved inventory thresholds.

### KPI 4 — UPCOMING PAYMENTS

Display:

- Amount due within the selected period.
- Number of invoices approaching their payment deadlines.
- Amount already overdue.

Payment information must come from Accounting.

---

# 4. MAIN PROCUREMENT TABLE

The main table should focus on supplier purchasing and financial visibility.

Recommended fields:

- Supplier name.
- Active orders.
- Ordered quantity.
- Delivered quantity.
- Pending quantity.
- Recognized debt.
- Confirmed payments.
- Overdue amount.
- Order or payment status.

Avoid trying to display every detail in one table.

Use a compact row structure.

When a supplier is selected, open a detailed supplier view.

### SUPPLIER DRILL-DOWN

Level 1 — Supplier overview.

Level 2 — Purchase orders, deliveries, invoices, or payment history.

Level 3 — Individual order, invoice, or payment record.

Level 4 — Supporting documents, responsible users, and audit history.

Example:

Supplier → Outstanding Debt → Invoice → Payments → Remaining Balance

Another example:

Supplier → Purchase Orders → Product → Delivery → Warehouse Receipt

Preserve filters and navigation context.

---

# 5. PROCUREMENT REQUIREMENT — MATERIAL REQUESTS

The Procurement Department receives material requests from:

- Production.
- Warehouse.
- Other authorized departments.

Requests may be created for daily, weekly, monthly, or specific operational needs.

Each request should record:

- Request number.
- Requesting department.
- Product or material.
- Requested quantity.
- Unit of measurement.
- Required delivery date.
- Requesting employee.
- Priority.
- Status.
- Optional supporting notes.

Recommended request lifecycle:

DRAFT → SUBMITTED → APPROVED → ORDERED → FULFILLED

Support rejection and cancellation with recorded reasons where required.

Do not allow duplicate purchasing decisions to be created accidentally from the same request.

Connect requests to purchase orders when applicable.

---

# 6. PROCUREMENT REQUIREMENT — INVENTORY PLANNING

The procurement manager needs accurate warehouse information.

Reuse the existing inventory system and product-specific storage standards.

For each material, calculate:

- Current usable stock.
- Average daily consumption.
- Estimated days of stock remaining.
- Approved minimum or reorder threshold.
- Maximum safe inventory.
- Pending deliveries.
- Required procurement quantity.

Do not treat all physical stock as usable.

Exclude rejected, quarantined, or otherwise unavailable quantities when calculating usable stock.

## RECOMMENDED REPLENISHMENT CALCULATION

Estimated Net Requirement:

Required Quantity = Expected Consumption During Planning Horizon + Approved Safety Stock - Usable Available Stock - Eligible Confirmed Incoming Quantity

Ensure that quantities already reserved for other requirements are handled correctly.

The planning horizon, safety stock, and incoming delivery eligibility must follow approved business rules.

Do not automatically purchase the calculated quantity.

Require appropriate approval.

## MAXIMUM STOCK CONSTRAINT

Procurement must respect approved maximum safe inventory levels.

Avoid ordering more perishable raw material than can reasonably be consumed or safely stored.

The system should warn about excessive orders, not silently override business decisions.

---

# 7. PROCUREMENT REQUIREMENT — SUPPLIER COMPARISON

The Procurement Department must be able to compare supplier offers.

Support recording commercial offers with:

- Supplier.
- Product.
- Offered quantity.
- Unit price.
- Currency.
- Tax treatment.
- Delivery cost.
- Delivery lead time.
- Payment terms.
- Quality requirements.
- Offer validity.
- Supporting document.

Comparison must consider more than price alone.

A cheaper supplier may have poor quality, delayed deliveries, or unfavorable payment conditions.

Use real purchasing history and approved supplier evaluations where available.

Do not invent supplier ratings or scores.

If there is insufficient data, display that limitation.

---

# 8. PROCUREMENT REQUIREMENT — PURCHASE ORDERS

The procurement manager must create and track official purchase orders.

Each order must contain:

- Purchase order number.
- Supplier.
- Product or material line items.
- Quantity.
- Unit price.
- Currency.
- Tax details where applicable.
- Expected delivery date.
- Payment terms.
- Order total.
- Related material request.
- Created by.
- Approval status.
- Delivery status.

Support partial deliveries.

Recommended order lifecycle:

DRAFT → PENDING_APPROVAL → APPROVED → SENT → PARTIALLY_RECEIVED → RECEIVED → CLOSED

Also support CANCELLED and appropriate exception states.

Do not assume that an approved purchase order has already been delivered.

Do not create supplier debt merely because a purchase order was created.

The order represents a purchasing commitment, while recognized accounts payable must follow accounting policies and approved supporting documents.

---

# 9. PROCUREMENT REQUIREMENT — DELIVERY TRACKING

Track the actual delivery process.

Relevant information:

- Supplier.
- Purchase order.
- Expected delivery date.
- Actual delivery date.
- Transport information.
- Transport expenses, if recorded.
- Received quantities.
- Rejected quantities.
- Delivery documents.
- Responsible employees.

If a delivery is delayed, show the delay clearly.

If materials are rejected, connect the rejection act to the supplier and relevant order.

Reuse the existing Warehouse and Quality Control workflows.

Do not create duplicate inventory batches from procurement records.

Accepted goods must enter inventory through the approved warehouse receiving workflow.

---

# 10. PROCUREMENT REQUIREMENT — EMERGENCY PURCHASING

Support urgent material or spare-part requests when necessary.

Examples:

- Critical raw material shortage.
- Production equipment breakdown.
- Unexpected supply interruption.
- Supplier delivery failure.

An urgent request should include:

- Requested material.
- Required quantity.
- Reason for urgency.
- Requesting department.
- Required date.
- Responsible employee.
- Approval status.

Urgent purchasing must still follow authorization rules.

Do not bypass accounting, warehouse, or audit records.

---

# 11. ACCOUNTING MODULE — SUPPLIER FINANCIAL CONTROL

The Accounting Department is responsible for official financial records.

Build or extend supplier accounts payable functionality.

The module should provide:

- Supplier invoices.
- Recognized payable balances.
- Payment requests.
- Payment records.
- Payment allocations.
- Partial payments.
- Advance payments.
- Overdue liabilities.
- Credit notes or approved adjustments.
- Payment due dates.
- Supporting accounting documents.

Use existing accounting data and workflows wherever possible.

Do not duplicate a full general ledger if the existing ERP already has one.

If a general ledger is present, maintain consistency between supplier balances and accounting entries.

---

# 12. SUPPLIER INVOICES

Supplier invoices should be linked to their underlying business transactions.

Where applicable, link:

Purchase Order → Goods Receipt → Supplier Invoice

Check the consistency of:

- Ordered quantity.
- Accepted quantity.
- Invoiced quantity.
- Agreed price.
- Taxes.
- Delivery terms.
- Supplier identity.

Differences must be visible.

Do not automatically approve an invoice that differs from accepted receiving records or agreed purchasing terms.

Support partial invoices, credit notes, and approved exceptions.

The exact invoice approval and payable recognition rules must follow company accounting policy.

---

# 13. PAYMENT MANAGEMENT

Accounting should manage the official payment process.

Each payment record should contain:

- Payment ID.
- Supplier.
- Payment date.
- Payment amount.
- Currency.
- Payment method.
- Bank or cash reference.
- Related invoice or payment allocations.
- Recorded by.
- Confirmed by, where required.
- Payment status.
- Supporting documents.

Recommended payment states:

DRAFT → PENDING_APPROVAL → APPROVED → PROCESSING → CONFIRMED

Also support FAILED, CANCELLED, or REVERSED where appropriate.

**Important:** A payment request or approval is not the same as a completed payment.

A supplier balance must be reduced only according to the approved accounting treatment of confirmed or posted transactions.

---

# 14. SUPPLIER DEBT CALCULATIONS

Supplier debt must be calculated from actual accounting records.

For standard recognized payables:

Outstanding Payable = Recognized Invoice Amounts - Applied Payments - Applied Credit Notes ± Approved Accounting Adjustments

Apply payments and credits only once.

Handle:

- Partially paid invoices.
- Multiple payments against one invoice.
- One payment allocated across multiple invoices.
- Supplier advances.
- Refunds.
- Reversals.
- Multiple currencies.
- Overdue invoices.
- Payment disputes.

Do not subtract unrelated supplier advances from a specific invoice unless they have been formally allocated or offset under approved accounting rules.

Do not treat purchase orders as recognized debt.

Do not confuse physical delivery quantity with invoice amount.

Use decimal-safe financial calculations.

### Required debt statuses

- UNPAID
- PARTIALLY_PAID
- PAID
- OVERDUE
- DISPUTED, if the company uses a dispute process

An overdue invoice is an unpaid invoice whose contractual due date has passed, subject to the company's approved payment terms and applicable accounting rules.

---

# 15. PROCUREMENT ↔ ACCOUNTING INTEGRATION

This is one of the most important requirements.

The Procurement Department must be able to see relevant supplier financial information without manually duplicating it.

### Procurement permissions

The Procurement Manager can view:

- Supplier outstanding balance.
- Invoice status.
- Amount paid.
- Remaining debt.
- Overdue amount.
- Payment due date.
- Relevant payment history.
- Procurement-related invoice references.

By default, Procurement should have read-only access to posted accounting transactions.

Procurement must not directly change confirmed payment amounts or posted financial balances.

### Accounting permissions

Accounting can:

- Review supplier invoices.
- Record and validate payment documents.
- Manage payment approvals according to authorization.
- Confirm or post payments through the approved workflow.
- Allocate payments to invoices.
- Apply authorized adjustments.
- View corresponding purchasing and warehouse documents.

### Director permissions

The Director should be able to see:

- Total supplier debt.
- Total overdue supplier debt.
- Supplier debt breakdown.
- Active purchasing commitments.
- Upcoming payments.
- Critical procurement shortages.
- Important payment or delivery discrepancies.

The Director should be able to drill down into the underlying invoices, purchasing records, and payment documents.

Approval permissions must be configured explicitly, rather than assumed from the Director role.

---

# 16. END-TO-END BUSINESS WORKFLOW

Implement the following connected workflow using real records.

**STEP 1 — MATERIAL REQUEST**

Production submits a requirement.

**STEP 2 — STOCK CHECK**

Procurement checks available usable inventory and pending deliveries.

**STEP 3 — SUPPLIER SELECTION**

Procurement reviews supplier offers, terms, and approved quality information.

**STEP 4 — PURCHASE ORDER**

Procurement creates an order and obtains required approval.

**STEP 5 — DELIVERY**

Supplier delivers materials.

**STEP 6 — WAREHOUSE & QUALITY CONTROL**

Warehouse and Quality Control inspect the delivery.

Accepted and rejected quantities are recorded separately.

**STEP 7 — DOCUMENT MATCHING**

Accounting reviews purchase order, goods receipt, and supplier invoice.

**STEP 8 — PAYABLE RECOGNITION**

The payable is recognized under the company's approved accounting rules.

**STEP 9 — PAYMENT**

Accounting processes, confirms, and allocates payments.

**STEP 10 — UPDATED SUPPLIER BALANCE**

The supplier balance updates from posted financial records.

Procurement and the Director can view the new balance without manually entering it again.

Every step must remain traceable to the relevant source documents.

---

# 17. PROCUREMENT UI — REMOVE UNNECESSARY ELEMENTS

The existing Procurement Dashboard should be simplified.

### Keep the following primary sections

1. Overview
2. Material Requests
3. Purchase Orders
4. Suppliers
5. Supplier Debts & Payments
6. Deliveries

Supplier comparisons, contracts, emergency purchasing, and supporting documents should be accessible contextually within the relevant sections instead of becoming unnecessary top-level dashboard cards.

### Compact dashboard layout

**Top KPI cards:**

- Supplier Debt
- Active Orders
- Materials Needed
- Upcoming Payments

**Main content:**

- Supplier summary table.
- Purchase orders requiring attention.
- Critical material shortages.
- Overdue deliveries or payments.

### Design requirements

- Preserve the existing dark theme.
- Preserve the overall ERP design system.
- Avoid excessive text.
- Avoid large decorative sections.
- Avoid redundant charts.
- Use real metrics.
- Use compact tables.
- Make rows clickable.
- Use drill-down drawers or detail views.
- Keep Uzbek labels short and correct.
- Preserve Russian and English localization where already available.

Remove redundant Procurement UI elements only after checking that they are not needed for existing workflows.

Do not delete useful functionality or underlying records merely to simplify the interface.

---

# 18. ACCOUNTING UI — MINIMAL AND FUNCTIONAL

The Accounting Dashboard should focus on financial control.

### Primary KPIs

- Outstanding Supplier Payables.
- Overdue Payables.
- Payments Due.
- Confirmed Payments.

### Primary views

- Supplier Balances.
- Invoices.
- Payments.
- Payment Requests.
- Reconciliation and Exceptions, where supported.

Use a compact, professional accounting interface.

Avoid unnecessary graphics.

Financial values, dates, statuses, documents, and discrepancies must be immediately understandable.

---

# 19. AUDIT AND SECURITY

All important procurement and financial activities must be traceable.

Track:

- Who created an order.
- Who approved it.
- Who changed supplier terms.
- Who accepted a delivery.
- Who rejected materials.
- Who recorded an invoice.
- Who approved a payment.
- Who confirmed a payment.
- Who modified or reversed a financial record.

Do not silently alter posted financial records.

Use approved corrections, reversals, and audit trails.

Protect financial information with server-side authorization.

Prevent duplicate invoice posting, duplicate payments, and inconsistent payment allocations.

Use database transactions and appropriate concurrency controls.

---

# 20. IMPLEMENTATION PHASES

Do not implement the entire Procurement and Accounting system at once.

### PHASE 1 — EXISTING PROJECT ANALYSIS

Inspect the repository.

Identify:

- Existing Procurement features.
- Existing Accounting features.
- Existing Suppliers models.
- Existing Purchase Orders.
- Existing Warehouse Receiving.
- Existing payment-related database tables.
- Existing financial calculations.
- Existing API endpoints.
- Existing UI components.
- Missing relationships.
- Duplicated or unnecessary Procurement interface elements.

Provide a concise analysis.

Do not modify any code in this phase.

### PHASE 2 — SUPPLIER DEBT & ACCOUNTING CONNECTION

After approval:

- Establish the source of truth for supplier payables.
- Connect procurement supplier records to accounting balances.
- Implement the supplier debt summary.
- Implement confirmed payment visibility.
- Implement remaining debt and overdue calculations.
- Add supplier financial drill-down.

### PHASE 3 — PURCHASE ORDER MANAGEMENT

After approval:

- Connect material requests.
- Implement or extend purchase orders.
- Track ordered, received, and outstanding quantities.
- Integrate with warehouse receiving.

### PHASE 4 — PROCUREMENT PLANNING

After approval:

- Connect available warehouse inventory.
- Use approved product storage limits.
- Calculate stock coverage.
- Identify actual material requirements.
- Introduce shortage and excess inventory warnings.

### PHASE 5 — SUPPLIER COMPARISON & DELIVERY TRACKING

After approval:

- Supplier offer comparison.
- Supplier terms and contract references.
- Delivery tracking.
- Late delivery alerts.
- Supplier quality history.
- Emergency procurement workflow.

### PHASE 6 — UI SIMPLIFICATION & VERIFICATION

After approval:

- Remove redundant interface elements.
- Simplify Procurement and Accounting layouts.
- Verify all calculations.
- Test role permissions.
- Test invoice/payment reconciliation.
- Verify links to existing warehouse and director modules.
- Test loading, empty, and error states.
- Check Uzbek localization.

Complete and verify one phase before starting the next.

---

# 21. REQUIRED ACCEPTANCE CRITERIA

The implementation is successful only when:

1. Procurement can see exactly which suppliers have outstanding balances.
2. Supplier debt values match the authoritative accounting records.
3. Confirmed supplier payments are reflected correctly.
4. Partial payments produce accurate outstanding balances.
5. Purchase orders are not incorrectly counted as recognized debt.
6. Active orders and pending deliveries are visible.
7. Procurement can see relevant warehouse shortages.
8. Product-specific inventory limits are respected.
9. Accepted deliveries connect correctly to warehouse records.
10. Rejected deliveries remain traceable through rejection acts.
11. Supplier invoice and payment records remain auditable.
12. The Director can drill down into relevant purchasing and payment details.
13. No fake data is used.
14. Procurement and Accounting do not maintain conflicting duplicate financial balances.
15. Existing ERP functionality remains intact.
16. The interface is simple and free from unnecessary clutter.

---

# 22. WHAT YOU MUST DO RIGHT NOW

**DO NOT START CODING YET.**

First, inspect the existing project.

Then provide:

1. Current Procurement Module assessment.
2. Current Accounting Module assessment.
3. Existing database entities and reusable relationships.
4. Missing functionality.
5. Proposed Procurement ↔ Accounting integration.
6. Supplier debt calculation architecture.
7. Proposed simplified Procurement Dashboard structure.
8. Necessary backend/API changes.
9. Required database migrations.
10. Step-by-step implementation plan.

Classify findings as:

- ALREADY IMPLEMENTED
- NEEDS IMPROVEMENT
- MISSING
- REQUIRES BUSINESS CONFIRMATION

Clearly distinguish verified code findings from assumptions.

Do not claim to have inspected anything you cannot actually access.

Wait for my approval before making implementation changes.

## FINAL PRODUCT PRINCIPLE

**Procurement manages purchasing and supplier relationships.**

**Warehouse controls physical material movements.**

**Quality Control determines material acceptance and quality status.**

**Accounting manages official payables and payments.**

**The Director monitors overall performance and accountability.**

All departments must operate on connected, consistent, real business records.

The final system must remain simple, reliable, auditable, and easy to navigate.