// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'

// This is the FALLBACK menu used only when the API is unavailable.
// Keep it minimal — the backend returns the real role-filtered menu via menuService.getMenuByRole().
const verticalMenuData = (): VerticalMenuDataType[] => [
  {
    label: 'Trang chủ',
    isSection: true,
    children: [
      {
        label: 'Trang chủ',
        icon: 'ri-dashboard-line',
        href: '/dashboards/home'
      }
    ]
  }
]

// Full menu kept here for reference only — not used at runtime.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _fullMenuData = (): VerticalMenuDataType[] => [
  {
    label: 'Trang chủ',
    isSection: true,
    children: [
      {
        label: 'Trang chủ',
        icon: 'ri-dashboard-line',
        href: '/dashboards/home'
      }
    ]
  },
  {
    label: 'Quản lý cơ bản',
    isSection: true,
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
        icon: 'ri-graduation-cap-line',
        href: '/apps/student/list'
      },
      {
        label: 'Người dùng',
        icon: 'ri-user-settings-line',
        href: '/apps/user/list'
      },
      {
        label: 'Chuyển lớp',
        icon: 'ri-arrow-left-right-line',
        href: '/apps/class-transfer/list'
      }
    ]
  },
  {
    label: 'Lịch & Điểm danh',
    isSection: true,
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
        label: 'Quản lý điểm danh',
        icon: 'ri-task-line',
        href: '/apps/attendance/history'
      },
      {
        label: 'Phiếu điểm danh',
        icon: 'ri-file-list-3-line',
        href: '/apps/attendance/tickets'
      },
      {
        label: 'Thống kê chấm công',
        icon: 'ri-bar-chart-box-line',
        href: '/apps/attendance/admin-stats'
      },

      // {
      //   label: 'Xin nghỉ phép',
      //   icon: 'ri-calendar-close-line',
      //   href: '/apps/leave-request/list'
      // }
    ]
  },
  {
    label: 'Tài chính & Lương',
    isSection: true,
    children: [
      {
        label: 'Thu tiền lớp',
        icon: 'ri-money-cny-circle-line',
        href: '/apps/payment/collect'
      },
      {
        label: 'Thanh toán',
        icon: 'ri-wallet-line',
        href: '/apps/payment/list'
      },
      {
        label: 'Sản phẩm',
        icon: 'ri-price-tag-3-line',
        href: '/apps/product/list'
      },
      {
        label: 'Bán sản phẩm',
        icon: 'ri-shopping-bag-3-line',
        href: '/apps/product-sale/list'
      },
      {
        label: 'Thống kê tài chính',
        icon: 'ri-bar-chart-grouped-line',
        href: '/apps/finance/summary'
      },
      {
        label: 'Bàn giao tiền',
        icon: 'ri-hand-coin-line',
        href: '/apps/cash-handover/list'
      },
      {
        label: 'Bảng lương',
        icon: 'ri-money-dollar-circle-line',
        href: '/apps/payroll/list'
      },
      {
        label: 'Cấu hình lương',
        icon: 'ri-money-dollar-circle-line',
        href: '/apps/payroll/salary-config'
      },
    ]
  },
  {
    label: 'Cấp đai & Thi',
    isSection: true,
    children: [
      {
        label: 'Cấp đai',
        icon: 'ri-award-line',
        href: '/apps/belt-level/list'
      },
      {
        label: 'Thi cấp đai',
        icon: 'ri-medal-line',
        href: '/apps/belt-exam/list'
      },
      {
        label: 'Đăng ký thi cấp',
        icon: 'ri-trophy-line',
        href: '/apps/belt-exam/register'
      },
      {
        label: 'DS đăng ký thi',
        icon: 'ri-list-check-3',
        href: '/apps/belt-exam/registrations'
      }
    ]
  },
  {
    label: 'Phân quyền',
    isSection: true,
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
      },
      {
        label: 'Nhật ký hệ thống',
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
    label: 'Cài đặt',
    isSection: true,
    children: [
      {
        label: 'Cài đặt hệ thống',
        icon: 'ri-settings-3-line',
        href: '/settings/system-config'
      }
    ]
  }
]

export default verticalMenuData
