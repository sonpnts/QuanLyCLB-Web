import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chính sách bảo mật | Tấn Đạt Taekwondo',
  description:
    'Thông tin về việc thu thập, sử dụng và bảo vệ dữ liệu cá nhân, bao gồm dữ liệu người dùng Google, trong hệ thống chấm công và quản lý CLB võ.'
}

export default function PrivacyPolicyPage() {
  return (
    <div className='container mx-auto max-w-4xl py-10 px-6 prose prose-gray dark:prose-invert'>
      <h1 className='text-3xl font-bold mb-6 text-center'>Chính sách bảo mật dữ liệu người dùng</h1>

      <p>
        Chính sách này quy định cách **thu thập, sử dụng, lưu trữ, chia sẻ và bảo vệ thông tin cá nhân** của người dùng
        (học viên, huấn luyện viên, trợ giảng, quản trị viên) khi sử dụng hệ thống chấm công và quản lý câu lạc bộ võ
        **(Ứng dụng)**. Chúng tôi cam kết tuân thủ nghiêm ngặt **Chính sách dữ liệu người dùng của Dịch vụ API Google**
        và **Điều khoản dịch vụ API Google**.
      </p>

      <h2>1. Phạm vi áp dụng</h2>
      <p>
        Áp dụng cho tất cả người dùng truy cập hoặc sử dụng hệ thống web/app của câu lạc bộ, bao gồm học viên, huấn
        luyện viên, và ban quản lý.
      </p>

      <h2>2. Dữ liệu được truy cập và thu thập</h2>
      <p>Ứng dụng thu thập hai loại dữ liệu chính:</p>

      <h3>2.1. Dữ liệu Người dùng Google (Được truy cập qua OAuth 2.0)</h3>
      <p>
        Khi người dùng chọn đăng nhập/đăng ký bằng tài khoản Google, Ứng dụng sẽ truy cập các loại dữ liệu cụ thể sau:
      </p>
      <ul>
        <li>**Họ tên (profile name):** Dùng để xác định danh tính và hiển thị trên hồ sơ người dùng trong Ứng dụng.</li>
        <li>**Địa chỉ Email (email address):** Dùng để xác thực người dùng và là thông tin liên lạc chính.</li>
      </ul>
      <p>
        **Lưu ý:** Ứng dụng **không** truy cập bất kỳ dữ liệu nhạy cảm nào khác từ tài khoản Google của bạn (ví dụ:
        Google Drive, Lịch, Danh bạ, v.v.).
      </p>

      <h3>2.2. Dữ liệu Nội bộ của Ứng dụng</h3>
      <ul>
        <li>
          **Thông tin hồ sơ:** Họ tên, ngày sinh, giới tính, ảnh chân dung (có thể được tải lên trực tiếp hoặc lấy từ
          Google).
        </li>
        <li>**Dữ liệu hoạt động CLB:** Thông tin lớp học, lịch tập, kết quả thi, dữ liệu chấm công.</li>
        <li>
          **Dữ liệu kỹ thuật:** IP, trình duyệt, thiết bị, nhật ký truy cập (log) cho mục đích bảo trì và bảo mật.
        </li>
      </ul>

      <h2>3. Mục đích sử dụng dữ liệu</h2>
      <p>Dữ liệu người dùng Google và dữ liệu nội bộ được sử dụng với mục đích rõ ràng và hợp pháp:</p>
      <ul>
        <li>
          **Xác thực và Ủy quyền:** Sử dụng Họ tên và Email từ Google để xác thực đăng nhập và tạo hồ sơ người dùng
          trong hệ thống (nhằm mục đích quản lý CLB).
        </li>
        <li>**Quản lý CLB:** Quản lý hồ sơ học viên, lịch tập, theo dõi quá trình học tập và thi đấu.</li>
        <li>**Quản lý nhân sự:** Tính công – lương cho huấn luyện viên và nhân viên.</li>
        <li>**Thông báo:** Gửi thông báo, hóa đơn, hoặc kết quả học tập liên quan trực tiếp đến hoạt động của CLB.</li>
      </ul>
      <p>**Cam kết:** Dữ liệu người dùng Google sẽ **chỉ** được sử dụng cho các mục đích đã nêu trên.</p>

      <h2>4. Chia sẻ dữ liệu với bên thứ ba</h2>
      <p>**Ứng dụng cam kết:**</p>
      <ul>
        <li>
          Dữ liệu người dùng Google (Họ tên, Email) và dữ liệu nội bộ **sẽ không bao giờ** được bán, trao đổi, cho thuê
          hoặc chia sẻ với bên thứ ba cho mục đích tiếp thị, quảng cáo, hoặc bất kỳ mục đích nào không liên quan trực
          tiếp đến việc cung cấp dịch vụ quản lý CLB.
        </li>
        <li>
          Dữ liệu chỉ có thể được chia sẻ trong các trường hợp sau:
          <ul>
            <li>Khi có sự đồng ý rõ ràng của người dùng.</li>
            <li>Khi được yêu cầu theo luật pháp hoặc lệnh của tòa án có thẩm quyền.</li>
          </ul>
        </li>
      </ul>

      <h2>5. Lưu trữ và Bảo vệ dữ liệu</h2>
      <p>Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức nghiêm ngặt để bảo vệ dữ liệu người dùng:</p>
      <ul>
        <li>
          **Mã hóa:** Mật khẩu người dùng được mã hóa bằng thuật toán an toàn (ví dụ: bcrypt hoặc SHA256). Dữ liệu
          truyền tải giữa người dùng và máy chủ được bảo vệ bằng giao thức **HTTPS/TLS**.
        </li>
        <li>
          **Kiểm soát truy cập:** Áp dụng cơ chế **Phân quyền theo vai trò (RBAC)**, đảm bảo chỉ những người có vai trò
          và quyền hạn phù hợp mới có thể truy cập các loại dữ liệu cụ thể.
        </li>
        <li>
          **Bảo trì hệ thống:** Sao lưu dữ liệu định kỳ và ghi lại nhật ký truy cập (log) để theo dõi và phát hiện các
          hoạt động bất thường.
        </li>
        <li>**Bảo mật máy chủ:** Dữ liệu được lưu trữ trên các máy chủ có cấu hình bảo mật tiêu chuẩn ngành.</li>
      </ul>

      <h2>6. Lưu giữ và Xóa dữ liệu</h2>

      <h3>6.1. Chính sách Lưu giữ</h3>
      <p>
        Dữ liệu cá nhân được lưu trữ chỉ trong khoảng thời gian cần thiết để phục vụ mục đích đã nêu hoặc theo yêu cầu
        của pháp luật. Cụ thể, dữ liệu sẽ được lưu trữ **tối đa 12 tháng** sau khi người dùng (học viên/huấn luyện viên)
        ngừng tham gia CLB, trừ khi pháp luật hoặc các quy định quản lý CLB yêu cầu thời gian lưu trữ lâu hơn.
      </p>

      <h3>6.2. Quy trình Yêu cầu Xóa dữ liệu</h3>
      <p>Người dùng có quyền yêu cầu xóa dữ liệu cá nhân của mình. Quy trình thực hiện như sau:</p>
      <ol>
        <li>Người dùng gửi yêu cầu xóa dữ liệu qua email chính thức của CLB: **ad@truongson.id.vn**.</li>
        <li>Yêu cầu phải được xác minh danh tính để đảm bảo người yêu cầu là chủ sở hữu tài khoản.</li>
        <li>
          Sau khi xác minh thành công, dữ liệu cá nhân của người dùng sẽ được xóa khỏi hệ thống trong vòng **30 ngày làm
          việc**, trừ các dữ liệu cần phải giữ lại theo quy định pháp luật (ví dụ: hồ sơ tài chính, hóa đơn).
        </li>
      </ol>

      <h2>7. Quyền của người dùng</h2>
      <p>
        Người dùng có quyền truy cập, chỉnh sửa, xóa hoặc yêu cầu cung cấp dữ liệu cá nhân của mình bằng cách liên hệ
        với chúng tôi theo thông tin bên dưới.
      </p>

      <h2>8. Liên hệ</h2>
      <p>
        Mọi thắc mắc liên quan đến Chính sách bảo mật hoặc việc xử lý dữ liệu, vui lòng liên hệ: <br />
        <strong>Email:</strong> sonpnts@gmail.com <br />
        <strong>Địa chỉ:</strong> 264 Bưng Ông Thoàn, Tăng Nhơn Phú B, Quận 9, Thành phố Hồ Chí Minh
      </p>

      <p className='text-sm text-gray-500 mt-8 italic'>Cập nhật lần cuối: 12/06/2026</p>
    </div>
  )
}
