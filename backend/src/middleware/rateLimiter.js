const rateLimit = require('express-rate-limit');

// Rate limiter chung cho toàn bộ API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // tối đa 100 request / 15 phút / IP
  message: {
    success: false,
    message: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút.',
  },
  standardHeaders: true, // trả về thông tin rate limit trong header `RateLimit-*`
  legacyHeaders: false, // tắt header `X-RateLimit-*` cũ
});

// Rate limiter riêng cho auth (login/register) — cần chặt hơn để chống brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // chỉ 5 lần thử trong 15 phút
  message: {
    success: false,
    message: 'Quá nhiều lần đăng nhập/đăng ký thất bại. Vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // chỉ đếm những request thất bại
});

// Rate limiter cho các API tạo dữ liệu (order, review, dispute...) — chống spam
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10,
  message: {
    success: false,
    message: 'Bạn đang thao tác quá nhanh, vui lòng chậm lại.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter, createLimiter };