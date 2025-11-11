// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

const horizontalMenuData = (): HorizontalMenuDataType[] => [
  {
    label: 'Trang chủ',
    icon: 'ri-dashboard-line',
    href: '/dashboards/home'
  },
  {
    label: 'Quản lý cơ bản',
    icon: 'ri-settings-3-line',
    children: [
      {
        label: 'Chi nhánh',
        icon: 'ri-building-line',
        href: '/apps/branch/list'
      },
      {
        label: 'Lớp học',
        icon: 'ri-group-line',
        href: '/apps/class/list'
      },
      {
        label: 'Huấn luyện viên',
        icon: 'ri-user-star-line',
        href: '/apps/instructor/list'
      },
      {
        label: 'Học viên',
        icon: 'ri-user-line',
        href: '/apps/user/list'
      }
    ]
  },
  {
    label: 'Lịch & Điểm danh',
    icon: 'ri-calendar-check-line',
    children: [
      {
        label: 'Lịch dạy',
        icon: 'ri-calendar-schedule-line',
        href: '/apps/schedule/list'
      },
      {
        label: 'Lịch tổng quan',
        icon: 'ri-calendar-line',
        href: '/apps/calendar'
      },
      {
        label: 'Điểm danh',
        icon: 'ri-checkbox-circle-line',
        href: '/apps/attendance/list'
      },
      {
        label: 'Phiếu điểm danh',
        icon: 'ri-file-list-3-line',
        href: '/apps/attendance/tickets'
      }
    ]
  },
  {
    label: 'Tài chính',
    icon: 'ri-money-dollar-circle-line',
    children: [
      {
        label: 'Bảng lương',
        icon: 'ri-money-dollar-circle-line',
        href: '/apps/payroll/list'
      },
      {
        label: 'Hóa đơn',
        icon: 'ri-file-paper-2-line',
        href: '/apps/invoice/list'
      }
    ]
  },
  {
    label: 'Phân quyền',
    icon: 'ri-shield-line',
    children: [
      {
        label: 'Vai trò',
        icon: 'ri-shield-user-line',
        href: '/apps/roles'
      },
      {
        label: 'Quyền hạn',
        icon: 'ri-lock-line',
        href: '/apps/permissions'
      }
    ]
  },
  {
    label: 'Tiện ích',
    icon: 'ri-apps-line',
    children: [
      {
        label: 'Chat',
        icon: 'ri-message-3-line',
        href: '/apps/chat'
      },
      {
        label: 'Email',
        icon: 'ri-mail-line',
        href: '/apps/email'
      },
      {
        label: 'Kanban',
        icon: 'ri-layout-grid-line',
        href: '/apps/kanban'
      }
    ]
  }
]

export default horizontalMenuData
