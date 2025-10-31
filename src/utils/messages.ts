/**
 * Tất cả các thông báo cho người dùng
 * Tập trung tại đây để dễ chỉnh sửa và quản lý
 */

export const Messages = {
  // ========== Schedule Messages (Lịch học) ==========
  schedule: {
    // Success messages
    success: {
      create: 'Tạo lịch học thành công.',
      update: 'Cập nhật lịch học thành công',
      delete: 'Xóa lịch học thành công.',
      restore: 'Khôi phục lịch học thành công.',
      load: 'Tải lịch học thành công.'
    },

    // Error messages
    error: {
      create: 'Không thể tạo lịch học.',
      update: 'Không thể cập nhật lịch học',
      delete: 'Không thể xóa lịch học.',
      restore: 'Không thể khôi phục lịch học.',
      load: 'Không thể tải danh sách lịch học.',
      loadGeneric: 'Đã có lỗi khi tải lịch học.',
      createGeneric: 'Đã có lỗi khi tạo lịch học.',
      deleteGeneric: 'Đã có lỗi khi xóa lịch học.',
      restoreGeneric: 'Đã có lỗi khi khôi phục lịch học.',
      updateGeneric: 'Lỗi khi cập nhật lịch học'
    },

    // Validation messages
    validation: {
      selectDay: 'Vui lòng chọn ít nhất một ngày trong tuần.'
    }
  },

  // ========== Class Messages (Lớp học) ==========
  class: {
    // Success messages
    success: {
      create: 'Tạo lớp học thành công!',
      update: 'Cập nhật lớp học thành công!',
      delete: 'Xóa lớp học thành công!',
      restore: 'Khôi phục lớp học thành công!',
      load: 'Tải lớp học thành công.',
      addSchedule: 'Thêm lịch học thành công.'
    },

    // Error messages
    error: {
      create: 'Không thể tạo lớp học. Vui lòng thử lại.',
      update: 'Không thể cập nhật lớp học.',
      delete: 'Không thể xóa lớp học.',
      restore: 'Không thể khôi phục lớp học.',
      load: 'Không thể tải danh sách lớp học.',
      loadGeneric: 'Đã có lỗi khi tải lớp học.',
      deleteGeneric: 'Đã có lỗi khi xóa lớp học.',
      restoreGeneric: 'Đã có lỗi khi khôi phục lớp học.',
      addSchedule: 'Không thể thêm lịch học.',
      addScheduleGeneric: 'Đã có lỗi khi thêm lịch học.',
      generic: 'Đã có lỗi xảy ra. Vui lòng thử lại.'
    },

    // Warning messages
    warning: {
      loadInstructor: 'Không thể tải danh sách huấn luyện viên.',
      loadInstructorGeneric: 'Đã có lỗi khi tải huấn luyện viên.'
    },

    // Info messages
    info: {
      noSchedule: 'Chưa có lịch học nào cho lớp này'
    }
  },

  // ========== User Messages (Người dùng) ==========
  user: {
    // Success messages
    success: {
      create: 'Tạo người dùng thành công.',
      update: 'Cập nhật người dùng thành công.',
      delete: 'Xóa người dùng thành công.',
      restore: 'Khôi phục người dùng thành công.',
      load: 'Tải người dùng thành công.'
    },

    // Error messages
    error: {
      create: 'Không thể tạo người dùng.',
      update: 'Không thể cập nhật người dùng.',
      delete: 'Không thể xóa người dùng.',
      restore: 'Không thể khôi phục người dùng.',
      load: 'Không thể tải danh sách người dùng.',
      loadGeneric: 'Đã có lỗi khi tải người dùng.',
      createGeneric: 'Đã có lỗi khi tạo người dùng.',
      updateGeneric: 'Đã có lỗi khi cập nhật người dùng.',
      deleteGeneric: 'Đã có lỗi khi xóa người dùng.',
      restoreGeneric: 'Đã có lỗi khi khôi phục người dùng.'
    },

    // Validation messages
    validation: {
      selectRole: 'Vui lòng chọn vai trò.'
    }
  },

  // ========== Role Messages (Vai trò) ==========
  role: {
    // Success messages
    success: {
      create: 'Tạo vai trò thành công.',
      update: 'Cập nhật vai trò thành công.',
      delete: 'Xóa vai trò thành công.',
      restore: 'Khôi phục vai trò thành công.',
      load: 'Tải vai trò thành công.'
    },

    // Error messages
    error: {
      create: 'Không thể tạo vai trò.',
      update: 'Không thể cập nhật vai trò.',
      delete: 'Không thể xóa vai trò.',
      restore: 'Không thể khôi phục vai trò.',
      load: 'Không thể tải danh sách vai trò.',
      loadGeneric: 'Đã có lỗi khi tải vai trò.',
      createGeneric: 'Đã có lỗi khi tạo vai trò.',
      updateGeneric: 'Đã có lỗi khi cập nhật vai trò.',
      deleteGeneric: 'Đã có lỗi khi xóa vai trò.',
      restoreGeneric: 'Đã có lỗi khi khôi phục vai trò.'
    }
  },

  // ========== Branch Messages (Chi nhánh) ==========
  branch: {
    // Success messages
    success: {
      create: 'Tạo chi nhánh thành công.',
      update: 'Cập nhật chi nhánh thành công.',
      delete: 'Xóa chi nhánh thành công.',
      restore: 'Khôi phục chi nhánh thành công.',
      load: 'Tải chi nhánh thành công.'
    },

    // Error messages
    error: {
      create: 'Không thể tạo chi nhánh.',
      update: 'Không thể cập nhật chi nhánh.',
      delete: 'Không thể xóa chi nhánh.',
      restore: 'Không thể khôi phục chi nhánh.',
      load: 'Không thể tải danh sách chi nhánh.',
      loadGeneric: 'Đã có lỗi khi tải chi nhánh.',
      createGeneric: 'Đã có lỗi khi tạo chi nhánh.',
      deleteGeneric: 'Đã có lỗi khi xóa chi nhánh.',
      restoreGeneric: 'Đã có lỗi khi khôi phục chi nhánh.'
    }
  },

  // ========== Instructor Messages (Huấn luyện viên) ==========
  instructor: {
    // Success messages
    success: {
      create: 'Tạo huấn luyện viên thành công.',
      update: 'Cập nhật huấn luyện viên thành công.',
      delete: 'Xóa huấn luyện viên thành công.',
      restore: 'Khôi phục huấn luyện viên thành công.',
      load: 'Tải huấn luyện viên thành công.'
    },

    // Error messages
    error: {
      create: 'Không thể tạo huấn luyện viên.',
      update: 'Không thể cập nhật huấn luyện viên.',
      delete: 'Không thể xóa huấn luyện viên.',
      restore: 'Không thể khôi phục huấn luyện viên.',
      load: 'Không thể tải danh sách huấn luyện viên.',
      loadGeneric: 'Đã có lỗi khi tải huấn luyện viên.',
      createGeneric: 'Đã có lỗi khi tạo huấn luyện viên.',
      deleteGeneric: 'Đã có lỗi khi xóa huấn luyện viên.',
      restoreGeneric: 'Đã có lỗi khi khôi phục huấn luyện viên.'
    }
  },

  // ========== Attendance Messages (Điểm danh) ==========
  attendance: {
    // Success messages
    success: {
      create: 'Tạo điểm danh thành công.',
      update: 'Cập nhật điểm danh thành công.',
      load: 'Tải điểm danh thành công.'
    },

    // Error messages
    error: {
      create: 'Không thể tạo điểm danh.',
      update: 'Không thể cập nhật điểm danh.',
      load: 'Không thể tải dữ liệu điểm danh.',
      loadGeneric: 'Đã có lỗi khi tải dữ liệu điểm danh.'
    }
  },

  // ========== Attendance Ticket Messages (Phiếu xin nghỉ) ==========
  attendanceTicket: {
    // Success messages
    success: {
      create: 'Tạo phiếu xin nghỉ thành công.',
      approve: 'Duyệt phiếu xin nghỉ thành công.',
      reject: 'Từ chối phiếu xin nghỉ thành công.',
      load: 'Tải phiếu xin nghỉ thành công.'
    },

    // Error messages
    error: {
      create: 'Không thể tạo phiếu xin nghỉ.',
      process: 'Không thể xử lý phiếu xin nghỉ.',
      createGeneric: 'Đã có lỗi khi tạo phiếu xin nghỉ.',
      processGeneric: 'Đã có lỗi khi xử lý phiếu xin nghỉ.',
      loadGeneric: 'Đã có lỗi khi tải phiếu xin nghỉ.'
    }
  },

  // ========== Payroll Messages (Bảng lương) ==========
  payroll: {
    // Success messages
    success: {
      create: 'Tạo bảng lương thành công.',
      update: 'Cập nhật bảng lương thành công.',
      load: 'Tải bảng lương thành công.'
    },

    // Error messages
    error: {
      create: 'Không thể tạo bảng lương.',
      update: 'Không thể cập nhật bảng lương.',
      load: 'Không thể tải danh sách bảng lương.',
      loadGeneric: 'Đã có lỗi khi tải bảng lương.',
      createGeneric: 'Đã có lỗi khi tạo bảng lương.'
    }
  },

  // ========== Common Messages (Chung) ==========
  common: {
    // Success messages
    success: {
      save: 'Lưu thành công!',
      submit: 'Gửi thành công!',
      upload: 'Tải lên thành công!'
    },

    // Error messages
    error: {
      generic: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      network: 'Lỗi kết nối mạng. Vui lòng kiểm tra lại.',
      unauthorized: 'Bạn không có quyền thực hiện thao tác này.',
      notFound: 'Không tìm thấy dữ liệu.'
    },

    // Warning messages
    warning: {
      unsavedChanges: 'Bạn có thay đổi chưa lưu.',
      confirmAction: 'Vui lòng xác nhận hành động này.',
      validationFailed: 'Vui lòng kiểm tra lại thông tin nhập vào.'
    },

    // Info messages
    info: {
      loading: 'Đang tải dữ liệu...',
      processing: 'Đang xử lý...',
      saving: 'Đang lưu...'
    }
  }
} as const
