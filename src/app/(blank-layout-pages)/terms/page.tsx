import Link from 'next/link'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Điều khoản dịch vụ | Quản lý Tấn Đạt Taekwondo',
  description: 'Điều khoản sử dụng hệ thống chấm công và quản lý CLB võ – quy định quyền, nghĩa vụ và trách nhiệm của người dùng.'
}

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl py-10 px-6 prose prose-gray dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-center">Điều khoản dịch vụ</h1>

      <p>
        Khi sử dụng hệ thống chấm công và quản lý câu lạc bộ võ (sau đây gọi là “Hệ thống”), bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản được nêu dưới đây.
        Vui lòng đọc kỹ trước khi sử dụng.
      </p>

      <h2>1. Mục đích của Hệ thống</h2>
      <p>
        Hệ thống được thiết kế nhằm hỗ trợ công tác quản lý câu lạc bộ võ – bao gồm chấm công, quản lý học viên, huấn luyện viên, thu học phí, và tổ chức lịch tập luyện.
      </p>

      <h2>2. Quyền và nghĩa vụ của người dùng</h2>
      <ul>
        <li>Cung cấp thông tin chính xác khi đăng ký tài khoản.</li>
        <li>Giữ bí mật thông tin đăng nhập và không chia sẻ cho người khác.</li>
        <li>Không sử dụng hệ thống cho mục đích trái pháp luật hoặc xâm phạm quyền của người khác.</li>
        <li>Chịu trách nhiệm về mọi hoạt động diễn ra dưới tài khoản của mình.</li>
      </ul>

      <h2>3. Quyền và trách nhiệm của Ban quản trị</h2>
      <ul>
        <li>Đảm bảo vận hành hệ thống ổn định, bảo mật và liên tục.</li>
        <li>Có quyền tạm ngừng, giới hạn hoặc khóa tài khoản vi phạm điều khoản.</li>
        <li>Có quyền thay đổi hoặc ngừng cung cấp một phần/tính năng mà không cần báo trước trong phạm vi pháp luật cho phép.</li>
      </ul>

      <h2>4. Giới hạn trách nhiệm</h2>
      <p>
        Ban quản trị không chịu trách nhiệm cho mọi thiệt hại gián tiếp, ngẫu nhiên hoặc đặc biệt phát sinh từ việc sử dụng hoặc không thể sử dụng Hệ thống,
        trừ trường hợp do lỗi cố ý hoặc vi phạm pháp luật.
      </p>

      <h2>5. Quyền sở hữu trí tuệ</h2>
      <p>
        Toàn bộ nội dung, mã nguồn, giao diện, biểu tượng và dữ liệu trên Hệ thống thuộc quyền sở hữu của đơn vị phát triển.
        Mọi hành vi sao chép, sửa đổi, phát hành lại mà không được phép đều bị nghiêm cấm.
      </p>

      <h2>6. Chính sách dữ liệu cá nhân</h2>
      <p>
        Việc thu thập, lưu trữ và xử lý thông tin cá nhân được thực hiện theo{' '}
        <Link href="/privacy-policy" className="text-primary hover:underline">
          Chính sách bảo mật dữ liệu
        </Link>.
      </p>

      <h2>7. Sửa đổi và cập nhật điều khoản</h2>
      <p>
        Ban quản trị có quyền thay đổi các điều khoản này để phù hợp với quy định pháp luật hoặc thực tế hoạt động.
        Khi có thay đổi, thông báo sẽ được đăng tải trên trang chủ hoặc gửi đến người dùng trước khi áp dụng.
      </p>

      <h2>8. Luật điều chỉnh và giải quyết tranh chấp</h2>
      <p>
        Các điều khoản này được điều chỉnh theo pháp luật Việt Nam.
        Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết bằng thương lượng, nếu không đạt được thỏa thuận thì sẽ chuyển đến cơ quan có thẩm quyền.
      </p>

      <h2>9. Liên hệ</h2>
      <p>
        <strong>Email:</strong> ad@truongson.id.vn <br />
        <strong>Hotline:</strong> 098 888 22 53 <br />
        <strong>Địa chỉ:</strong> 264 Bưng Ông Thoàn, Tăng Nhơn Phú B, Quận 9, Thành phố Hồ Chí Minh
      </p>

      <p className="text-sm text-gray-500 mt-8 italic">
        Cập nhật lần cuối: 05/11/2025
      </p>
    </div>
  )
}
