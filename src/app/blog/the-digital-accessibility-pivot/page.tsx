import { DigitalAccessibilityPivotArticle } from '@/components/blog/DigitalAccessibilityPivotArticle'
import { DIGITAL_ACCESSIBILITY_PIVOT_SLUG, getStaticBlogMetadata } from '@/lib/static-blog-posts'

export const metadata = getStaticBlogMetadata(DIGITAL_ACCESSIBILITY_PIVOT_SLUG, 'nl')

export default function DigitalAccessibilityPivotPage() {
  return <DigitalAccessibilityPivotArticle locale="nl" />
}
