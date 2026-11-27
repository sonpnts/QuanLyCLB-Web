import type { Metadata } from 'next'
import GuideView from '@/views/apps/help/help'

export const metadata: Metadata = {
  title: 'Hướng dẫn sử dụng | CMIS - Tấn Đạt Taekwondo',
  description: 'Tài liệu và hướng dẫn sử dụng hệ thống CMIS'
}

export default function HelpPage() {
  return <GuideView />
}
