// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

const horizontalMenuData = (): HorizontalMenuDataType[] => [
  {
    label: 'Trang chá»§',
    icon: 'ri-dashboard-line',
    href: '/dashboards/home'
  },
  {
    label: 'Quáº£n lÃ½ cÆ¡ báº£n',
    icon: 'ri-settings-3-line',
    children: [
      {
        label: 'Chi nhÃ¡nh',
        icon: 'ri-building-line',
        href: '/apps/branch/list'
      },
      {
        label: 'Lá»›p há»c',
        icon: 'ri-group-line',
        href: '/apps/class/list'
      },
      {
        label: 'Huáº¥n luyá»‡n viÃªn',
        icon: 'ri-user-star-line',
        href: '/apps/instructor/list'
      },
      {
        label: 'Há»c viÃªn',
        icon: 'ri-graduation-cap-line',
        href: '/apps/student/list'
      },
      {
        label: 'NgÆ°á»i dÃ¹ng',
        icon: 'ri-user-settings-line',
        href: '/apps/user/list'
      },
      {
        label: 'Chuyá»ƒn lá»›p',
        icon: 'ri-arrow-left-right-line',
        href: '/apps/class-transfer/list'
      }
    ]
  },
  {
    label: 'Lá»‹ch & Äiá»ƒm danh',
    icon: 'ri-calendar-check-line',
    children: [
      {
        label: 'Lá»‹ch dáº¡y',
        icon: 'ri-calendar-schedule-line',
        href: '/apps/schedule/list'
      },
      {
        label: 'Lá»‹ch tá»•ng quan',
        icon: 'ri-calendar-line',
        href: '/apps/calendar'
      },
      {
        label: 'Äiá»ƒm danh',
        icon: 'ri-checkbox-circle-line',
        href: '/apps/attendance/list'
      },
      {
        label: 'Phiáº¿u Ä‘iá»ƒm danh',
        icon: 'ri-file-list-3-line',
        href: '/apps/attendance/tickets'
      },
      {
        label: 'Quáº£n lÃ½ nghá»‰ phÃ©p',
        icon: 'ri-calendar-close-line',
        href: '/apps/leave-request/list'
      }
    ]
  },
  {
    label: 'TÃ i chÃ­nh & LÆ°Æ¡ng',
    icon: 'ri-money-dollar-circle-line',
    children: [
      {
        label: 'Thu tiá»n lá»›p',
        icon: 'ri-money-cny-circle-line',
        href: '/apps/payment/collect'
      },
      {
        label: 'Thanh toÃ¡n',
        icon: 'ri-wallet-line',
        href: '/apps/payment/list'
      },
      {
        label: 'Sáº£n pháº©m',
        icon: 'ri-price-tag-3-line',
        href: '/apps/product/list'
      },
      {
        label: 'BÃ¡n sáº£n pháº©m',
        icon: 'ri-shopping-bag-3-line',
        href: '/apps/product-sale/list'
      },
      {
        label: 'Thá»‘ng kÃª tÃ i chÃ­nh',
        icon: 'ri-bar-chart-grouped-line',
        href: '/apps/finance/summary'
      },
      {
        label: 'BÃ n giao tiá»n',
        icon: 'ri-hand-coin-line',
        href: '/apps/cash-handover/list'
      },
      {
        label: 'Báº£ng lÆ°Æ¡ng',
        icon: 'ri-money-dollar-circle-line',
        href: '/apps/payroll/list'
      },
    ]
  },
  {
    label: 'Cáº¥p Ä‘ai & Thi',
    icon: 'ri-medal-line',
    children: [
      {
        label: 'Cáº¥p Ä‘ai',
        icon: 'ri-award-line',
        href: '/apps/belt-level/list'
      },
      {
        label: 'Thi cáº¥p Ä‘ai',
        icon: 'ri-medal-line',
        href: '/apps/belt-exam/list'
      },
      {
        label: 'ÄÄƒng kÃ½ thi cáº¥p',
        icon: 'ri-trophy-line',
        href: '/apps/belt-exam/register'
      },
      {
        label: 'DS Ä‘Äƒng kÃ½ thi',
        icon: 'ri-list-check-3',
        href: '/apps/belt-exam/registrations'
      }
    ]
  },
  {
    label: 'PhÃ¢n quyá»n',
    icon: 'ri-shield-line',
    children: [
      {
        label: 'Vai trÃ²',
        icon: 'ri-shield-user-line',
        href: '/apps/roles'
      },
      {
        label: 'Quyá»n háº¡n',
        icon: 'ri-lock-line',
        href: '/apps/permissions'
      },
      {
        label: 'Nháº­t kÃ½ há»‡ thá»‘ng',
        icon: 'ri-file-history-line',
        href: '/apps/audit-log/list'
      },
      {
        label: 'Nhật ký cronjob',
        icon: 'ri-time-line',
        href: '/apps/cron-job-log/list'
      }
    ]
  }
]

export default horizontalMenuData
