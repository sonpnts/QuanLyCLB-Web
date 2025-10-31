// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

const verticalMenuData = (dictionary: Awaited<ReturnType<typeof getDictionary>>): VerticalMenuDataType[] => [
  // End-user menu for instructors and teaching assistants
  {
    label: 'Chức năng',
    isSection: true,
    children: [
      {
        label: 'Điểm danh',
        icon: 'ri-checkbox-circle-line',
        href: '/apps/check-in'
      },
      {
        label: 'Lịch dạy',
        icon: 'ri-calendar-line',
        href: '/apps/my-schedule'
      },
      {
        label: 'Xin nghỉ phép',
        icon: 'ri-file-paper-2-line',
        href: '/apps/request-leave'
      },
      {
        label: 'Tạo phiếu điểm danh bù',
        icon: 'ri-file-add-line',
        href: '/apps/create-ticket'
      },
      {
        label: 'Lịch sử phiếu',
        icon: 'ri-file-list-line',
        href: '/apps/my-tickets'
      },
      {
        label: 'Bảng lương',
        icon: 'ri-money-dollar-circle-line',
        href: '/apps/my-payroll'
      }
    ]
  }
]

export default verticalMenuData
