import { AdaptiveLayout } from '@/components/chat/layouts/adaptive-layout'

export default function Home() {
  // Simple heuristic: enable dropdown when many conversations. For now, show both.
  const isMobile = false
  const showSidebar = true
  const showDropdown = true
  return <AdaptiveLayout showSidebar={showSidebar} showDropdown={showDropdown} isMobile={isMobile} />
}
