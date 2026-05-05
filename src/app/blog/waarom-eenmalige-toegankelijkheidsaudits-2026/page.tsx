import { AuditMonitoringArticle } from '@/components/blog/AuditMonitoringArticle'
import { getAuditMonitoringMetadata } from '@/lib/audit-monitoring-static-post'

export const metadata = getAuditMonitoringMetadata('nl')

export default function AuditMonitoring2026Page() {
  return <AuditMonitoringArticle locale="nl" />
}
