// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'

const verticalMenuData = (): VerticalMenuDataType[] => [
  {
    label: 'Trang chủ',
    isSection: true,
    children: [
      {
        label: 'Dashboard',
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
        label: 'Phiếu điểm danh',
        icon: 'ri-file-list-3-line',
        href: '/apps/attendance/tickets'
      },
      {
        label: 'Xin nghỉ phép',
        icon: 'ri-calendar-close-line',
        href: '/apps/leave-request/list'
      }
    ]
  },
  {
    label: 'Tài chính & Lương',
    isSection: true,
    children: [
      {
        label: 'Thu tiền',
        icon: 'ri-money-cny-circle-line',
        href: '/apps/finance/payments/collect'
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
        label: 'Hóa đơn',
        icon: 'ri-file-paper-2-line',
        href: '/apps/invoice/list'
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
      }
    ]
  },
  {
    label: 'Học viện',
    isSection: true,
    children: [
      {
        label: 'Dashboard',
        icon: 'ri-dashboard-3-line',
        href: '/apps/academy/dashboard'
      },
      {
        label: 'Khóa học',
        icon: 'ri-book-open-line',
        href: '/apps/academy/my-courses'
      },
      {
        label: 'Cấp đai',
        icon: 'ri-award-line',
        href: '/apps/belt-level/list'
      },
      {
        label: 'Thi cấp đai',
        icon: 'ri-medal-line',
        href: '/apps/belt-exam/list'
      }
    ]
  },
  {
    label: 'Tiện ích',
    isSection: true,
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
  },
  {
    label: 'Báo cáo & Thống kê',
    isSection: true,
    children: [
      {
        label: 'Phân tích',
        icon: 'ri-bar-chart-line',
        href: '/dashboards/analytics'
      },
      {
        label: 'E-commerce',
        icon: 'ri-shopping-cart-line',
        href: '/dashboards/ecommerce'
      },
      {
        label: 'Logistics',
        icon: 'ri-truck-line',
        href: '/dashboards/logistics'
      }
    ]
  }
]

export default verticalMenuData
