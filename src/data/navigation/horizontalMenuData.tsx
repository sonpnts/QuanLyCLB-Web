// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

const horizontalMenuData = (): HorizontalMenuDataType[] => [
  {
    label: 'Trang chủ',
    icon: 'ri-home-smile-line',
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
        label: 'Học viên',
        icon: 'ri-graduation-cap-line',
        href: '/apps/student/list'
      },
      {
        label: 'Giảm học phí',
        icon: 'ri-percent-line',
        href: '/apps/student/tuition-discount'
      },
      {
        label: 'Liên kết Zalo',
        icon: 'ri-chat-check-line',
        href: '/apps/zalo-link/coach'
      },
      {
        label: 'Mini App Zalo',
        icon: 'ri-smartphone-line',
        href: '/apps/miniapp/links'
      },
      {
        label: 'Duyệt giảm học phí',
        icon: 'ri-file-list-3-line',
        href: '/apps/student/tuition-discount-approvals'
      },
      {
        label: 'Người dùng',
        icon: 'ri-user-settings-line',
        href: '/apps/user/list'
      },
      {
        label: 'Tài liệu',
        icon: 'ri-folder-line',
        href: '/apps/user-documents/list'
      },
      {
        label: 'Chuyển lớp',
        icon: 'ri-arrow-left-right-line',
        href: '/apps/class-transfer/list'
      },
      {
        label: 'Sản phẩm',
        icon: 'ri-box-3-line',
        href: '/apps/product/list'
      },
      {
        label: 'Combo sản phẩm',
        icon: 'ri-gift-2-line',
        href: '/apps/product/bundles'
      },
      {
        label: 'Bán sản phẩm',
        icon: 'ri-shopping-cart-line',
        href: '/apps/product-sale/list'
      },
      {
        label: 'Kho sản phẩm',
        icon: 'ri-store-2-line',
        href: '/apps/product/inventory'
      },
      {
        label: 'Báo cáo sản phẩm',
        icon: 'ri-bar-chart-box-line',
        href: '/apps/product/report'
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
        label: 'Lịch sử điểm danh',
        icon: 'ri-task-line',
        href: '/apps/attendance/history'
      },
      {
        label: 'Quản lý nghỉ phép',
        icon: 'ri-calendar-close-line',
        href: '/apps/leave-request/list'
      }
    ]
  },
  {
    label: 'Tài chính',
    icon: 'ri-money-dollar-circle-line',
    children: [
      {
        label: 'Thu tiền lớp',
        icon: 'ri-money-cny-circle-line',
        href: '/apps/invoice/collect'
      },
      {
        label: 'Biên lai',
        icon: 'ri-wallet-line',
        href: '/apps/invoice/list'
      },
      {
        label: 'Thống kê tài chính',
        icon: 'ri-bar-chart-grouped-line',
        href: '/apps/finance/summary'
      },
      {
        label: 'Biên lai giảm trừ',
        icon: 'ri-file-list-3-line',
        href: '/apps/finance/payments/discounts'
      },
      {
        label: 'Bàn giao tiền',
        icon: 'ri-hand-coin-line',
        href: '/apps/cash-handover/list'
      },
      {
        label: 'Nợ phí sinh hoạt',
        icon: 'ri-money-dollar-circle-line',
        href: '/apps/cash-handover/tuition-debt'
      }
    ]
  },
  {
    label: 'Kỳ thi',
    icon: 'ri-medal-line',
    children: [
      {
        label: 'Quản lý kỳ thi',
        icon: 'ri-calendar-event-line',
        href: '/apps/belt-exam/list'
      },
      {
        label: 'Đăng ký thi',
        icon: 'ri-file-edit-line',
        href: '/apps/belt-exam/register'
      },
      {
        label: 'Danh sách kỳ thi',
        icon: 'ri-clipboard-line',
        href: '/apps/belt-exam/registrations'
      }
    ]
  },
  {
    label: 'Cá nhân',
    icon: 'ri-user-line',
    children: [
      {
        label: 'Lịch của tôi',
        icon: 'ri-calendar-check-line',
        href: '/apps/my-schedule'
      },
      {
        label: 'Chấm công',
        icon: 'ri-map-pin-line',
        href: '/apps/check-in'
      },
      {
        label: 'Phiếu chấm công bù',
        icon: 'ri-file-list-3-line',
        href: '/apps/attendance/tickets'
      },
      {
        label: 'Lịch sử chấm công',
        icon: 'ri-history-line',
        href: '/apps/attendance/instructor-history'
      },
      {
        label: 'Phiếu của tôi',
        icon: 'ri-file-list-line',
        href: '/apps/my-tickets'
      },
      {
        label: 'Tài liệu của tôi',
        icon: 'ri-folder-user-line',
        href: '/apps/my-documents'
      },
      {
        label: 'Hướng dẫn sử dụng',
        icon: 'ri-question-line',
        href: '/apps/help'
      }
    ]
  },
  {
    label: 'Hệ thống',
    icon: 'ri-shield-user-line',
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
      },
      {
        label: 'Nhật ký ZNS',
        icon: 'ri-message-2-line',
        href: '/apps/zns-log/list'
      },
      {
        label: 'Cấu hình hệ thống',
        icon: 'ri-settings-line',
        href: '/settings/system-config'
      },
      {
        label: 'Thống kê liên kết Zalo',
        icon: 'ri-chat-check-line',
        href: '/apps/zalo-link/stats'
      },
      {
        label: 'Cấu hình phí 1 lần',
        icon: 'ri-price-tag-3-line',
        href: '/settings/one-time-fees'
      },
      {
        label: 'Tổng hợp phí 1 lần',
        icon: 'ri-bar-chart-grouped-line',
        href: '/settings/one-time-fees/statuses'
      },
      {
        label: 'Thông báo Web Push',
        icon: 'ri-notification-3-line',
        href: '/admin/web-push'
      },
      {
        label: 'Cấp đai',
        icon: 'ri-award-line',
        href: '/apps/belt-level/list'
      }
    ]
  }
]

export default horizontalMenuData
