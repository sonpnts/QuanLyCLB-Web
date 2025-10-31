type SearchData = {
  id: string
  name: string
  url: string
  icon: string
  section: string
  shortcut?: string
}

const data: SearchData[] = [
  // End-user functions for instructors and teaching assistants
  {
    id: '1',
    name: 'Điểm danh',
    url: '/apps/check-in',
    icon: 'ri-checkbox-circle-line',
    section: 'Chức năng'
  },
  {
    id: '2',
    name: 'Lịch dạy',
    url: '/apps/my-schedule',
    icon: 'ri-calendar-line',
    section: 'Chức năng'
  },
  {
    id: '3',
    name: 'Xin nghỉ phép',
    url: '/apps/request-leave',
    icon: 'ri-file-paper-2-line',
    section: 'Chức năng'
  },
  {
    id: '4',
    name: 'Tạo phiếu điểm danh bù',
    url: '/apps/create-ticket',
    icon: 'ri-file-add-line',
    section: 'Chức năng'
  },
  {
    id: '5',
    name: 'Lịch sử phiếu',
    url: '/apps/my-tickets',
    icon: 'ri-file-list-line',
    section: 'Chức năng'
  },
  {
    id: '6',
    name: 'Bảng lương',
    url: '/apps/my-payroll',
    icon: 'ri-money-dollar-circle-line',
    section: 'Chức năng'
  }
]

export default data
