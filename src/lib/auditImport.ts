import { prisma } from '@/lib/prisma'

export interface ImportAuditEntry {
  id: string
  timestamp: string // ISO date string
  adminId?: number | null
  adminName: string
  adminUsername?: string
  adminRole: string
  target: string // e.g., "Kirimlar (Inbound)", "Chiqimlar (Outbound)", "Tayyor mahsulot (Finished goods)", "Sex hisoboti (Shop report)", "Kiruvchi aktlar (Incoming acts)"
  fileName: string
  fileSize?: string | number | null
  reason: string
  recordsCount?: number | null
  mode?: string | null
  status: 'SUCCESS' | 'FAILED'
  details?: string | null
}

/**
 * Persists an import audit entry into the Setting table under the key 'import_audit_history'
 * and also records it into the Log table for permanent auditing.
 */
export async function recordImportAudit(
  entry: Omit<ImportAuditEntry, 'id' | 'timestamp'>
): Promise<ImportAuditEntry | null> {
  const newRecord: ImportAuditEntry = {
    id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  }

  try {
    // 1. Fetch existing audit log from Setting table
    const existing = await prisma.setting.findUnique({
      where: { key: 'import_audit_history' },
    })

    let history: ImportAuditEntry[] = []
    if (existing?.value) {
      try {
        const parsed = JSON.parse(existing.value)
        if (Array.isArray(parsed)) {
          history = parsed
        }
      } catch (parseErr) {
        console.warn('Failed to parse existing import_audit_history setting:', parseErr)
      }
    }

    // Prepend new record to history, keep up to 300 records
    history.unshift(newRecord)
    if (history.length > 300) {
      history = history.slice(0, 300)
    }

    // Upsert full history into Setting table
    await prisma.setting.upsert({
      where: { key: 'import_audit_history' },
      update: {
        value: JSON.stringify(history),
        category: 'audit',
      },
      create: {
        key: 'import_audit_history',
        value: JSON.stringify(history),
        category: 'audit',
      },
    })

    // Upsert last import audit record for quick dashboard display
    await prisma.setting.upsert({
      where: { key: 'last_import_audit' },
      update: {
        value: JSON.stringify(newRecord),
        category: 'audit',
      },
      create: {
        key: 'last_import_audit',
        value: JSON.stringify(newRecord),
        category: 'audit',
      },
    })

    // Also write to permanent system Log table
    try {
      await prisma.log.create({
        data: {
          userId: entry.adminId ?? null,
          action: 'EXCEL_IMPORT',
          entity: entry.target,
          details: JSON.stringify({
            adminName: entry.adminName,
            adminUsername: entry.adminUsername,
            fileName: entry.fileName,
            reason: entry.reason,
            recordsCount: entry.recordsCount,
            mode: entry.mode,
            status: entry.status,
          }),
        },
      })
    } catch (logErr) {
      console.warn('Non-fatal error creating Log entry for import:', logErr)
    }

    return newRecord
  } catch (err) {
    console.error('Fatal error recording import audit:', err)
    return null
  }
}
