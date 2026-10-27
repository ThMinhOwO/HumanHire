// Supabase's auth errors are in English; translate the common ones.
const authErrors = {
  invalid_credentials: 'Email hoặc mật khẩu không đúng.',
  user_already_exists: 'Email này đã được đăng ký. Hãy đăng nhập.',
  email_exists: 'Email này đã được đăng ký. Hãy đăng nhập.',
  email_not_confirmed: 'Email chưa được xác nhận. Kiểm tra hộp thư của bạn.',
  weak_password: 'Mật khẩu quá yếu. Hãy dùng ít nhất 6 ký tự.',
  over_email_send_rate_limit: 'Bạn thử quá nhiều lần. Vui lòng đợi một lát.',
  over_request_rate_limit: 'Bạn thử quá nhiều lần. Vui lòng đợi một lát.',
  // Supabase uses this for both wrong and expired codes.
  otp_expired: 'Mã không đúng hoặc đã hết hạn. Hãy kiểm tra lại hoặc gửi mã mới.',
}

export function authErrorMessage(error) {
  return authErrors[error.code] ?? error.message
}
