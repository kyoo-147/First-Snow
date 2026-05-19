# Glossary

## ParentProfile
Hồ sơ phụ huynh gắn 1:1 với subject từ auth provider qua `users.auth_subject_id`, dùng để lưu thông tin hiển thị và kênh nhận cảnh báo.

## Child
Hồ sơ trẻ thuộc quyền quản lý của một `ParentProfile`.

## Session
Một buổi tương tác giữa trẻ và Mia. Trạng thái hợp lệ: `active`, `completed`, `interrupted`.

## Message
Một đơn vị transcript trong session, với `role` là `user` hoặc `assistant`.

## Memory
Thông tin dài hạn đã được rút trích từ các buổi trước, dùng để cá nhân hóa các buổi sau.

## Lesson
Bài học động do AI gợi ý hoặc đã được phụ huynh duyệt để dùng trong session.

## Approved Lesson
Lesson có `status = approved`, đủ điều kiện tham gia luồng học chính thức.

## Alert
Sự kiện an toàn được ghi lại khi có keyword hoặc emotion pattern đáng lo ngại.

## Consent
Sự đồng ý rõ ràng của phụ huynh cho mic, camera, và dữ liệu suy luận.

## Pilot
Giai đoạn thử nghiệm thực tế sau khi MVP đạt mức sẵn sàng chức năng và an toàn tối thiểu.
