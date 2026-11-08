// Shared in-memory cache for Supply Dashboard (/orders)

interface DashboardCache {
  data: any
  expiresAt: number
}

let dashboardCache: DashboardCache | null = null
const CACHE_TTL_MS = 45 * 1000 // 45 seconds

export function getSupplyDashboardCache(): any | null {
  if (dashboardCache && Date.now() < dashboardCache.expiresAt) {
    return dashboardCache.data
  }
  return null
}

export function setSupplyDashboardCache(data: any) {
  dashboardCache = {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  }
}

export function invalidateSupplyDashboardCache() {
  dashboardCache = null
}
