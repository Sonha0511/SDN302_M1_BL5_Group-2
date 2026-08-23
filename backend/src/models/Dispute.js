const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order", // Trỏ tới collection Order
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Phân loại lý do để Admin dễ thống kê
    reason: {
      type: String,
      enum: [
        "NOT_RECEIVED",
        "WRONG_ITEM",
        "DAMAGED",
        "NOT_AS_DESCRIBED",
        "FAKE_COUNTERFEIT",
        "MISSING_PARTS",
        "LATE_DELIVERY",
        "REFUND_NOT_RECEIVED",
        "OTHER"
      ],
      required: true,
    },
    
    description: {
      type: String,
      required: true,
    },
    
    // Mảng chứa các URL ảnh minh chứng
    evidenceImages: [
      {
        type: String, 
      }
    ],
    
    // Trạng thái chi tiết của luồng giải quyết
    status: {
      type: String,
      enum: [
        "OPEN",              // Mới tạo, chờ seller phản hồi
        "SELLER_RESPONDED",  // Seller đã trả lời
        "ESCALATED",         // Buyer không hài lòng -> đẩy lên admin
        "UNDER_REVIEW",      // Admin đang xử lý
        "RESOLVED_REFUND",   // Giải quyết: hoàn tiền
        "RESOLVED_REPLACE",  // Giải quyết: đổi hàng
        "RESOLVED_REJECTED", // Từ chối khiếu nại
        "CLOSED"             // Đóng (buyer tự đóng hoặc timeout)
      ],
      default: "OPEN",
    },
    
    // Kết quả giải quyết cuối cùng
    resolution: {
      type: {
        type: String,
        enum: ["REFUND_FULL", "REFUND_PARTIAL", "REPLACEMENT", "REJECTED", "NONE"],
        default: "NONE"
      },
      amount: Number, // Dùng nếu hoàn tiền 1 phần
      note: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Trỏ tới Admin hoặc Seller đã giải quyết
      },
      resolvedAt: Date
    },
    
    // Lịch sử xử lý để vẽ Stepper trên giao diện
    timeline: [
      {
        actor: {
          type: String,
          enum: ["buyer", "seller", "admin", "system"],
          required: true
        },
        action: {
          type: String,
          required: true // VD: "created", "seller_replied", "escalated"...
        },
        note: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    
    // Độ ưu tiên của khiếu nại
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW"
    }
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model("Dispute", disputeSchema);