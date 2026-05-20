// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'

// This is the FALLBACK menu used only when the API is unavailable.
// Keep it minimal â€” the backend returns the real role-filtered menu via menuService.getMenuByRole().
const verticalMenuData = (): VerticalMenuDataType[] => [
  {
    label: 'Trang chá»§',
    isSection: true,
    children: [
      {
        label: 'Trang chá»§',
        icon: 'ri-dashboard-line',
        href: '/dashboards/home'
      }
    ]
  }
]

// Full menu kept here for reference only â€” not used at runtime.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _fullMenuData = (): VerticalMenuDataType[] => [
  {
    label: 'Trang chá»§',
    isSection: true,
    children: [
      {
        label: 'Trang chá»§',
        icon: 'ri-dashboard-line',
        href: '/dashboards/home'
      }
    ]
  },
  {
    label: 'Quáº£n lÃ½ cÆ¡ báº£n',
    isSection: true,
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
    isSection: true,
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
        label: 'Thá»‘ng kÃª cháº¥m cÃ´ng',
        icon: 'ri-bar-chart-box-line',
        href: '/apps/attendance/admin-stats'
      },
      // {
      //   label: 'Xin nghá»‰ phÃ©p',
      //   icon: 'ri-calendar-close-line',
      //   href: '/apps/leave-request/list'
      // }
    ]
  },
  {
    label: 'TÃ i chÃ­nh & LÆ°Æ¡ng',
    isSection: true,
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
      {
        label: 'Cáº¥u hÃ¬nh lÆ°Æ¡ng',
        icon: 'ri-money-dollar-circle-line',
        href: '/apps/payroll/salary-config'
      },
    ]
  },
  {
    label: 'Cáº¥p Ä‘ai & Thi',
    isSection: true,
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
    isSection: true,
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
  },
  {
    label: 'CÃ i Ä‘áº·t',
    isSection: true,
    children: [
      {
        label: 'CÃ i Ä‘áº·t há»‡ thá»‘ng',
        icon: 'ri-settings-3-line',
        href: '/settings/system-config'
      }
    ]
  }
]

export default verticalMenuData

