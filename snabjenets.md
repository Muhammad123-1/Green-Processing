# ERP PROCUREMENT & ACCOUNTING — RELIABLE 4-WAY MATCHING AND SUPPLIER PAYABLES

## 1. ROLE AND OBJECTIVE

You are a Senior ERP Architect, Full-Stack Engineer, Database Engineer, and Financial Systems Specialist.

Your task is to improve the existing factory ERP system by connecting:

- Procurement (`/orders`)
- Warehouse Management
- Quality Control
- Accounting (`/accounting`)
- Executive Director Dashboard

The application already exists. Inspect the current repository, database, APIs, authentication, and frontend before implementing anything.

**Do not rebuild the application or introduce a separate ERP system.**

The main goal is to ensure that purchasing, goods receipt, quality acceptance, supplier invoicing, payments, and supplier debt are calculated consistently using real business transactions.

## 2. NON-NEGOTIABLE RULES

- Never use fake business data or hardcoded financial balances.
- Never duplicate supplier financial balances across modules.
- Never treat purchase orders as confirmed supplier debt.
- Never treat a payment request as a completed bank transfer.
- Never pay automatically for rejected quantities.
- Never permit a quantity to be invoiced twice through duplicate receipt allocations.
- Never silently modify posted accounting records.
- Never assign an accepted inventory batch number to a fully rejected delivery.
- Never break existing Procurement, Warehouse, QC, Accounting, or Director functionality.
- Preserve the current UI design and multilingual architecture.
- Reuse existing models and APIs wherever possible.

All critical calculations must be implemented in backend services or database queries.

## 3. MAIN BUSINESS WORKFLOW

Implement the following connected process:

```text
PROCUREMENT
   |
   v
Purchase Request
   |
   v
Approved Purchase Order
   |
   v
WAREHOUSE
   |
   v
Goods Receipt
   |
   v
QUALITY CONTROL
   |
   +---- Rejected Quantity
   |         |
   |         v
   |    Rejection Act
   |
   v
Accepted Quantity
   |
   v
ACCOUNTING
   |
   v
Supplier Invoice
   |
   v
4-Way Matching Validation
   |
   +---- MISMATCH --> ON HOLD
   |
   v
Approved / Posted Invoice
   |
   v
Recognized Supplier Payable
   |
   v
Payment Approval
   |
   v
Bank / Cash Confirmation
   |
   v
Posted Payment Allocation
   |
   v
Updated Supplier Balance
   |
   +---- Procurement Dashboard
   +---- Accounting Dashboard
   +---- Director Dashboard
```

Each step must reference the previous business records using real identifiers.

Do not create disconnected records that cannot be traced back to their source documents.

## 4. PURCHASE ORDER CONTROL

The Procurement Department creates purchasing orders based on approved material requirements and existing inventory.

Each purchase order must contain:

- Unique purchase order number.
- Supplier ID.
- Product line items.
- Ordered quantities.
- Units of measurement.
- Agreed unit prices.
- Currency.
- Tax treatment.
- Expected delivery date.
- Payment terms.
- Created by.
- Approval status.
- Supporting documents.

### Purchase Order Statuses

- DRAFT
- PENDING_APPROVAL
- APPROVED
- SENT
- PARTIALLY_RECEIVED
- RECEIVED
- CLOSED
- CANCELLED

Purchase order quantities and prices must be preserved as agreed contractual values.

Changes after approval require an authorized amendment and audit history.

A purchase order must not automatically create a posted supplier payable.

## 5. GOODS RECEIPT AND QC VALIDATION

When a delivery arrives, the Warehouse and Quality Control departments must record the actual results.

Track three separate quantities:

1. Delivered Quantity
2. Accepted Quantity
3. Rejected Quantity

Also support temporarily held or quarantined quantities if the existing QC process requires them.

### Validation

Delivered Quantity = Accepted Quantity + Rejected Quantity + Pending Inspection Quantity

Apply this equality after accounting for any documented measurement adjustments or shortages.

Accepted quantities must not exceed the actual verified delivered quantity.

### Example

Ordered: 1,000 kg

Delivered: 1,000 kg

Accepted: 950 kg

Rejected: 50 kg

Only the accepted 950 kg enters usable inventory.

Rejected materials must be linked to a rejection act.

The rejection act must contain:

- Act number.
- Supplier.
- Product.
- Rejected quantity.
- Rejection reason.
- Inspection date.
- QC inspector.
- Evidence.

Use existing Warehouse and QC data models where available.

Support multiple and partial deliveries against one purchase order.

## 6. STRICT 4-WAY MATCHING ENGINE

Implement a matching service that validates four sources:

1. Approved Purchase Order
2. Verified Goods Receipt
3. QC Accepted Quantity
4. Supplier Invoice

Validation must happen at the purchase order line and invoice line level, not only at the document total level.

### Matching Checks

**A. Supplier Match**

The invoice supplier must match the relevant approved purchase order supplier.

**B. Product Match**

The invoiced product or material must match the approved order and receipt lines.

**C. Quantity Match**

The cumulative invoice quantity must not exceed the QC-accepted quantity available for invoicing, subject to explicitly authorized and configured exceptions.

Prevent the same accepted quantity from being matched to multiple invoices.

**D. Price Match**

Compare invoice unit price against the approved purchase order price.

Differences must follow an approved tolerance policy.

Do not invent tolerance percentages.

**E. Amount Match**

Validate line totals, taxes, discounts, and authorized additional charges according to the actual contract and accounting rules.

**F. Duplicate Invoice Check**

Detect duplicate invoice references for the same supplier according to the configured uniqueness rules.

**G. QC Status Check**

Goods awaiting mandatory quality inspection must not pass matching as accepted inventory.

### Matching Results

- MATCHED
- PARTIAL_MATCH
- MISMATCH
- ON_HOLD
- REQUIRES_APPROVAL

For the initial implementation, default to blocking unexplained mismatches until the company approves a documented exception policy.

Every exception must record the approving user, reason, timestamp, and affected records.

Do not silently accept mismatched invoices.

## 7. SUPPLIER INVOICE MANAGEMENT

Supplier invoices must reference real purchase orders and relevant goods receipts.

Required information:

- Invoice ID.
- Supplier invoice number.
- Supplier ID.
- Purchase order reference.
- Matched goods receipt lines.
- Invoice date.
- Due date.
- Line quantities and amounts.
- Tax and approved additional charges.
- Currency.
- Matching result.
- Approval status.
- Posting status.
- Supporting document.

### Suggested Invoice Workflow

DRAFT → RECEIVED → MATCHING → VERIFIED → APPROVED → POSTED

If matching fails, move the invoice into ON_HOLD or another appropriate exception status.

Invoices must not become payable merely because a supplier uploaded a document.

Use the approved accounting policy to determine recognition and posting.

Support partial invoices, multiple invoices against a purchase order, and supplier credit notes.

Do not invoice the same accepted receipt quantity more than once.

## 8. SUPPLIER DEBT — SINGLE SOURCE OF TRUTH

Accounting must be the source of truth for recognized supplier payables.

Procurement and the Director Dashboard must read the same authoritative accounting results.

Do not create a separate, independently editable debt balance for each department.

### Standard Invoice Balance

Outstanding Invoice Balance =
Posted Invoice Amount
- Applied Posted Payments
- Applied Credit Notes
± Approved Accounting Adjustments

### Supplier Outstanding Balance

Supplier Outstanding Payables =
Sum of Outstanding Posted Supplier Invoices

Calculate the balance separately for each currency unless an approved reporting exchange-rate policy exists.

### Important Cases

Support:

- Unpaid invoices.
- Partially paid invoices.
- Fully paid invoices.
- Overdue invoices.
- Supplier advances.
- Refunds.
- Credit notes.
- Payment reversals.
- Multiple invoices.
- Multiple payment allocations.
- Uninvoiced accepted receipts.

Supplier advances must remain distinguishable from payable balances until formally allocated or offset.

Uninvoiced accepted receipts must be visible as a separate reconciliation category and treated according to the approved accounting policy.

Never calculate recognized payable simply as total purchase orders minus payments.

## 9. PAYMENT WORKFLOW

The Accounting Department can initiate payment processing.

Clicking "Make Payment" must not automatically mark a bank transfer as successful.

### Payment Workflow

```text
Payment Draft
    |
    v
Approval Required
    |
    v
Approved
    |
    v
Submitted / Processing
    |
    v
Bank or Cash Confirmation
    |
    v
Posted Payment
    |
    v
Payment Allocation
    |
    v
Updated Outstanding Payable
```

Support FAILED, CANCELLED, and REVERSED states.

### Payment Fields

- Payment ID.
- Supplier ID.
- Amount.
- Currency.
- Payment method.
- Source bank or cash account.
- External transaction reference.
- Payment date.
- Created by.
- Approved by.
- Confirmation status.
- Posting status.
- Supporting documents.

### Critical Rule

If a payment is manually recorded without a bank integration, do not claim that the actual transfer has occurred until it has been verified through the configured accounting confirmation process.

Bank balances must come from reliable bank statements, integrations, or reconciled accounting records.

### Payment Allocation

One payment may pay multiple invoices.

One invoice may be settled through multiple payments.

Implement an explicit Payment Allocation relationship.

Prevent allocation of more than the eligible confirmed payment amount.

Prevent over-allocation of invoices unless an approved advance or credit workflow applies.

## 10. SUPPLIER RECONCILIATION STATEMENT

Implement a read-only supplier reconciliation view accessible from Procurement and Accounting according to user permissions.

Uzbek UI label:

**Solishtirma dalolatnoma**

It must display:

- Supplier name.
- Opening balance.
- Posted invoice transactions.
- Applied payments.
- Credit notes and adjustments.
- Closing balance.
- Date range.
- Invoice references.
- Payment references.
- Transaction status.

Use a single chronological source of transactions.

Do not maintain a manually duplicated reconciliation balance.

### Calculation

Closing Balance =
Opening Balance
+ Recognized Payables During Period
- Applied Payments During Period
- Applied Credits During Period
± Approved Adjustments

Opening and closing balances must be calculated consistently as of the selected dates.

Allow drill-down into the underlying source documents.

If the existing system supports signed reconciliation documents, preserve the signed version as a historical document without making it the live balance source.

## 11. PROCUREMENT DASHBOARD (/orders)

Simplify the existing Procurement interface.

The most important information must be immediately visible.

### Primary KPI Cards

1. Supplier Outstanding Debt.
2. Active Purchase Orders.
3. Materials Requiring Procurement.
4. Upcoming Supplier Payments.

### Main Supplier Table

Show:

- Supplier.
- Active orders.
- Ordered and pending quantities in appropriate units.
- Outstanding debt.
- Overdue amount.
- Payment status.

Do not display unrelated financial statistics.

### Supplier Drill-Down

Supplier → Orders / Debt → Invoice or Delivery → Payment / Receipt → Source Document

Procurement users should have read-only access to posted accounting balances and transactions.

They must not directly modify confirmed financial records.

### Inventory Signals

Use the existing warehouse stock and product-specific norms.

Show:

- Critical shortages.
- Low inventory.
- Sufficient inventory.
- Excess inventory.
- Confirmed pending deliveries.

Calculate material requirements using actual demand, stock, reservations, and eligible incoming quantities.

Respect maximum safe storage limits.

## 12. ACCOUNTING DASHBOARD (/accounting)

Preserve the current Accounting module.

Make the supplier-payable workflow clear and minimal.

### Main KPI Cards

- Total Supplier Payables.
- Overdue Payables.
- Payments Awaiting Processing.
- Confirmed Payments for the selected period.

### Main Views

- Supplier Balances.
- Supplier Invoices.
- Payment Requests.
- Payments.
- Reconciliation.
- Matching Exceptions.

### Supplier Table

Each supplier row should show:

- Supplier name.
- Recognized outstanding balance.
- Overdue balance.
- Next payment due date.
- Payment status.

### Make Payment Action

When an accountant selects a supplier or invoice, open a payment form.

Automatically populate relevant, verified information:

- Supplier.
- Currency.
- Outstanding eligible invoices.
- Suggested payment amount.

Allow authorized partial payments.

Never permit unverified invoice amounts to be silently paid.

The action must create a payment request or execute the existing approved accounting workflow.

Do not simulate a successful bank payment.

## 13. DIRECTOR DASHBOARD INTEGRATION

The Director must be able to monitor the same real financial information.

Display only critical executive metrics:

- Total outstanding supplier debt.
- Overdue supplier debt.
- Active purchasing commitments.
- Critical material shortages.
- Unresolved invoice matching exceptions.

Avoid adding redundant cards if equivalent metrics already exist.

### Drill-Down

Supplier Debt → Supplier → Invoice → Payment History → Remaining Balance

Matching Exceptions → Supplier → Purchase Order → Receipt → QC → Invoice Mismatch

The Director must be able to identify the source of a problem without switching between disconnected modules.

## 14. DATABASE RELATIONSHIPS

Inspect the existing database before proposing new tables.

Ensure the data model supports the following logical entities:

- Suppliers
- Products
- PurchaseRequests
- PurchaseOrders
- PurchaseOrderLines
- GoodsReceipts
- GoodsReceiptLines
- QualityInspections
- RejectionActs
- SupplierInvoices
- SupplierInvoiceLines
- InvoiceMatches
- PaymentRequests
- Payments
- PaymentAllocations
- SupplierCreditNotes
- SupplierAdvances, if applicable
- AuditLogs

Do not create duplicate tables when suitable entities already exist.

Use proper foreign keys and unique constraints.

### Required Relationships

- One supplier → many purchase orders.
- One purchase order → many order lines.
- One order line → multiple receipts.
- One receipt → QC inspection records.
- One supplier invoice → multiple invoice lines.
- Invoice lines → matched receipt/order quantities.
- One supplier → many invoices.
- One invoice → multiple payment allocations.
- One payment → multiple invoice allocations.

Use immutable financial posting references where appropriate.

Use decimal-safe numeric types for financial amounts and weights.

Enforce critical invariants with database transactions and constraints.

## 15. DATA CONSISTENCY AND REAL-TIME UPDATES

When Accounting posts a valid payment allocation, all relevant views must reflect the updated balance:

- Accounting
- Procurement
- Director Dashboard

Use the existing data-fetching, cache invalidation, and state-management architecture.

Do not maintain separate local calculations of supplier debt across frontend modules.

Important:

A changed payment form is not a completed financial transaction.

Update recognized financial balances only after the authorized backend transaction has been successfully committed.

Use idempotency keys and transaction-level protections for payment posting to prevent accidental duplicates.

Handle concurrent invoice matching and payment allocation safely.

Provide Loading, Success, Empty, Error, and Unauthorized states.

## 16. SECURITY AND PERMISSIONS

Enforce authorization on the backend.

### Procurement

Can:

- Create purchasing requests and orders according to permissions.
- Track supplier deliveries.
- View relevant supplier balances.
- View payment and invoice statuses.

Cannot:

- Directly post bank payments.
- Modify posted invoice balances.
- Manually overwrite supplier debt.

### Warehouse and QC

Can:

- Record verified received quantities.
- Approve or reject materials under assigned permissions.
- Create rejection acts.

Cannot:

- Change supplier payment balances.

### Accounting

Can:

- Review invoices.
- Perform matching.
- Process payment approvals.
- Post authorized transactions.
- Maintain reconciliation records.

### Director

Can:

- View consolidated information.
- Investigate source documents.
- Approve specific transactions only when explicitly authorized.

Every important financial and operational action must be auditable.

## 17. IMPORTANT EDGE CASES TO TEST

Ensure the system correctly handles:

1. Purchase order for 1,000 kg, but only 950 kg accepted.
2. Supplier invoices 1,000 kg despite 950 kg being accepted.
3. Purchase order delivered in multiple shipments.
4. A single receipt matched to multiple partial invoices without double-counting.
5. One supplier invoice paid in several installments.
6. One payment allocated to several invoices.
7. Supplier advance paid before delivery.
8. Supplier credit note issued after rejection or return.
9. Duplicate supplier invoice number.
10. Duplicate payment submission.
11. Payment approved but not confirmed by the bank.
12. Payment failure or reversal.
13. Different purchase and payment currencies.
14. Invoice with additional taxes or approved delivery charges.
15. Supplier delivers materials before a matching invoice exists.
16. Goods remain under QC inspection.
17. Invoice and accepted quantity are different.
18. Invoice has an unauthorized price increase.
19. Two accountants attempt to pay the same invoice simultaneously.
20. Supplier balance viewed for a historical date.

For each case, define expected backend behavior and required validation.

## 18. IMPLEMENTATION PHASES

### PHASE 1 — EXISTING CODE AUDIT

Inspect Procurement, Accounting, Warehouse, QC, and the Director Dashboard.

Identify:

- Existing models.
- Existing payment workflows.
- Existing APIs.
- Existing supplier balances.
- Existing receiving logic.
- Missing relationships.
- Calculation errors.
- Duplicate business logic.

Do not modify code during this phase.

### PHASE 2 — RECEIPT AND QC CONNECTION

After approval:

Connect Purchase Orders to verified goods receipts and QC acceptance.

Support partial delivery and rejection acts.

### PHASE 3 — MATCHING ENGINE

After approval:

Implement invoice matching and mismatch handling.

Prevent unauthorized over-invoicing and duplicate quantity matching.

### PHASE 4 — ACCOUNTING AND PAYMENTS

After approval:

Implement or correct supplier invoices, recognized payables, payment posting, and payment allocations.

### PHASE 5 — SHARED SUPPLIER BALANCES

After approval:

Connect the authoritative accounting balances to Procurement and the Director Dashboard.

### PHASE 6 — RECONCILIATION AND UI SIMPLIFICATION

After approval:

Implement the supplier reconciliation view.

Remove redundant UI elements.

Verify all drill-down navigation.

### PHASE 7 — INTEGRATION TESTING

After approval:

Test calculations, partial deliveries, duplicate prevention, financial posting, permissions, concurrency, and regression risks.

Do not proceed to a new phase before the approved phase has been tested.

## 19. YOUR TASK RIGHT NOW

DO NOT START IMPLEMENTING YET.

First inspect the existing repository.

Return:

1. Current architecture assessment.
2. Existing Procurement and Accounting capabilities.
3. Missing controls in the purchasing-to-payment workflow.
4. Proposed 4-way matching architecture.
5. Supplier payable and payment calculation rules.
6. Required database model changes.
7. Required API changes.
8. Proposed minimal UI improvements.
9. Implementation order.
10. Any essential accounting policy decisions that require confirmation.

Classify each finding as:

- ALREADY IMPLEMENTED
- NEEDS CORRECTION
- MISSING
- REQUIRES BUSINESS CONFIRMATION

Do not claim any feature is missing without inspecting the relevant code.

Do not change production data or existing application files without explicit implementation approval.

## FINAL OBJECTIVE

Build one connected purchasing and accounting workflow.

**Procurement orders.**

**Warehouse records delivery.**

**Quality Control verifies accepted quantities.**

**Accounting matches invoices and confirms payments.**

**The Director monitors the entire process.**

Every payable must have a valid financial source.

Every accepted quantity must be traceable.

Every confirmed payment must have a verifiable transaction.

Every supplier balance must be consistent across the ERP.

Keep the implementation accurate, minimal, auditable, and integrated with the existing application.


---

## 20. TASDIQLANGAN BIZNES QOIDALARI VA TA'MINOTCHI PORTALI (CONFIRMED POLICIES)

*Ushbu qoidalar korxona ma'muriyati tomonidan 2026-yil 4-noyabrda rasman tasdiqlandi va tizimga to'liq joriy etildi:*

1. **Brak (yaroqsiz) xomashyo va ta'minotchi oldidagi qarz hisobi:**
   - **Qoida:** Korxona ta'minotchi keltirgan umumiy hajm (masalan, 1000 kg) uchun to'liq to'lov qiladi. Ichki sifat nazorati (QC) tomonidan aniqlangan brak (masalan, 50 kg) korxonaning o'z texnologik yo'qotishi / sarf-xarajati sifatida hisobga olinadi. Ta'minotchining fakturasi to'liq qabul qilingan/kelgan og'irlik (1000 kg) bo'yicha to'lanadi.

2. **Narx tafovuti (Price Tolerance):**
   - **Qoida:** Qat'iy 0% tolerance! Narxlar shartnoma va buyurtmadagi kelishilgan summaga 1 so'mgacha mos kelishi shart. Har qanday narx tafovuti darhol qat'iy `ON_HOLD` / `MISMATCH` istisnosini keltirib chiqaradi va to'lovga ruxsat berilmaydi.

3. **Yetkazib Beruvchi Portali va Maxfiylik Izolyatsiyasi (Supplier Portal & Strict Isolation):**
   - **Qoida:** Admin ta'minotchi uchun tizimga kirish akkaunti (Login va Parol) ochib beradi (`/admin/suppliers` yoki `/suppliers?tab=accounts`).
   - Ta'minotchi roli: `SUPPLIER`.
   - **Xavfsizlik:** Ta'minotchi tizimga kirganida **FAQAT va FAQAT** unga korxonadan yuborilgan buyurtmalar (`/supplier-portal`) ko'rinadi. Korxonaning boshqa barcha bo'limlari (ombor, ishlab chiqarish, sifat, buxgalteriya, xodimlar, sozlamalar) undan butunlay yashirilgan va bloklangan (`middleware.ts`).
   - **Ko'p tillilik:** Portal to'liq 3 ta tilda: **O'zbekcha / Русский / English** ishlaydi.
   - Ta'minotchi o'ziga kelgan buyurtmalarni ko'radi, ularni chop eta oladi va zavodga yuborishda mashina raqami hamda haydovchi telefonini kiritib **"🚚 Yo'lga chiqdik (В пути)"** yoki **"✅ Yetkazildi"** holatiga o'tkaza oladi. Bu xabar zavod ichki chatiga avtomatik yuboriladi.
