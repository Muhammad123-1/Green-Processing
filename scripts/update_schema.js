const fs = require('fs')
const path = require('path')

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
let content = fs.readFileSync(schemaPath, 'utf8')

// 1. Update Product model
const productTarget = `  salesOrderItems  SalesOrderItem[]
  purchaseOrderItems PurchaseOrderItem[]
}`

const productReplacement = `  salesOrderItems  SalesOrderItem[]
  purchaseOrderItems PurchaseOrderItem[]
  cogsPerUnit      Float?   @default(0) // Standard COGS per unit in UZS
  salesReturns     SalesReturn[]
}`

if (content.includes('salesReturns     SalesReturn[]')) {
  console.log('Product already has salesReturns')
} else if (content.includes('purchaseOrderItems PurchaseOrderItem[]')) {
  content = content.replace(
    'purchaseOrderItems PurchaseOrderItem[]\n}',
    'purchaseOrderItems PurchaseOrderItem[]\n  cogsPerUnit      Float?   @default(0) // Standard COGS per unit in UZS\n  salesReturns     SalesReturn[]\n}'
  )
  if (!content.includes('salesReturns     SalesReturn[]')) {
    // Try CRLF
    content = content.replace(
      'purchaseOrderItems PurchaseOrderItem[]\r\n}',
      'purchaseOrderItems PurchaseOrderItem[]\r\n  cogsPerUnit      Float?   @default(0) // Standard COGS per unit in UZS\r\n  salesReturns     SalesReturn[]\r\n}'
    )
  }
}

// 2. Update Customer model
const customerTargetLF = `  orders      SalesOrder[]
  invoices    Invoice[]
  activities  CrmActivity[]
}`

const customerTargetCRLF = `  orders      SalesOrder[]\r\n  invoices    Invoice[]\r\n  activities  CrmActivity[]\r\n}`

const customerFields = `  // Sales Channel & Distribution Classification
  distributionType String?  @default("DIRECT") // DIRECT, INDIRECT
  channelCategory  String?  @default("UNCLASSIFIED") // RESTAURANTS_FOOD_SERVICE, CORPORATE_END_CUSTOMERS, SUPERMARKETS, RETAIL_STORES, DISTRIBUTORS, WHOLESALERS, EXPORT_PARTNERS, OTHER, UNCLASSIFIED
  businessRole     String?  // B2B End-User (Own Operations), Reseller, Distributor, etc.
  contractNumber   String?
  contractDate     DateTime?
  creditTermDays   Int?     @default(15) // Credit payment term in days
  creditLimit      Float?   @default(0) // Credit limit in UZS

  orders      SalesOrder[]
  invoices    Invoice[]
  activities  CrmActivity[]
  returns     SalesReturn[]
}`

if (!content.includes('channelCategory  String?')) {
  if (content.includes(customerTargetCRLF)) {
    content = content.replace(customerTargetCRLF, customerFields.replace(/\n/g, '\r\n'))
  } else if (content.includes(customerTargetLF)) {
    content = content.replace(customerTargetLF, customerFields)
  }
}

// 3. Update SalesOrder model
const orderTargetLF = `  customer       Customer          @relation(fields: [customerId], references: [id])
  items          SalesOrderItem[]
  invoices       Invoice[]
}`

const orderTargetCRLF = `  customer       Customer          @relation(fields: [customerId], references: [id])\r\n  items          SalesOrderItem[]\r\n  invoices       Invoice[]\r\n}`

const orderFields = `  customer       Customer          @relation(fields: [customerId], references: [id])
  items          SalesOrderItem[]
  invoices       Invoice[]
  returns        SalesReturn[]
  logisticsCost  Float?            @default(0)
  discountAmount Float?            @default(0)
}`

if (!content.includes('logisticsCost  Float?')) {
  if (content.includes(orderTargetCRLF)) {
    content = content.replace(orderTargetCRLF, orderFields.replace(/\n/g, '\r\n'))
  } else if (content.includes(orderTargetLF)) {
    content = content.replace(orderTargetLF, orderFields)
  }
}

// 4. Update SalesOrderItem model
const itemTargetLF = `  discount     Float?   @default(0)

  // Traceability`

const itemTargetCRLF = `  discount     Float?   @default(0)\r\n\r\n  // Traceability`

const itemFields = `  discount     Float?   @default(0)
  cogsPerUnit  Float?   @default(0) // Cost of Goods Sold per unit in UZS
  logisticsCost Float?  @default(0)

  // Traceability`

if (!content.includes('cogsPerUnit  Float?')) {
  if (content.includes(itemTargetCRLF)) {
    content = content.replace(itemTargetCRLF, itemFields.replace(/\n/g, '\r\n'))
  } else if (content.includes(itemTargetLF)) {
    content = content.replace(itemTargetLF, itemFields)
  }
}

// 5. Add SalesReturn model if not present
if (!content.includes('model SalesReturn {')) {
  const salesReturnModel = `

model SalesReturn {
  id           Int        @id @default(autoincrement())
  returnNumber String     @unique
  salesOrderId Int?
  customerId   Int
  productId    Int
  quantity     Float
  unitPrice    Float
  returnAmount Float
  cogsAmount   Float?     @default(0)
  reason       String?    // DEFECT, EXPIRED, WRONG_DELIVERY, CUSTOMER_CANCEL
  status       String     @default("APPROVED") // PENDING, APPROVED, REJECTED
  returnDate   DateTime   @default(now())
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  salesOrder   SalesOrder? @relation(fields: [salesOrderId], references: [id])
  customer     Customer    @relation(fields: [customerId], references: [id])
  product      Product     @relation(fields: [productId], references: [id])
}
`
  content += salesReturnModel
}

fs.writeFileSync(schemaPath, content, 'utf8')
console.log('Schema updated successfully!')
