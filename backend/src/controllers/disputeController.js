const Dispute = require("../models/Dispute");
const Order = require("../models/Order");

// [POST] Tạo khiếu nại mới
exports.createDispute = async (req, res) => {
  try {
    const { orderId, reason, description, evidenceImages } = req.body;

    // Truy vấn đơn hàng gốc để tìm chính xác chủ shop là ai
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng tham chiếu" });
    }

    const newDispute = new Dispute({
      orderId: order._id,
      sellerId: order.sellerId, // Bốc chuẩn ID của Seller từ Database Order sang
      buyerId: req.userId,
      reason,
      description,
      evidenceImages: evidenceImages || [],
      timeline: [
        {
          actor: "buyer",
          action: "created",
          note: "Người mua đã tạo khiếu nại"
        }
      ]
    });

    await newDispute.save();

    // ---------------------------------------------------------
    // MOCK NOTIFICATION CHO ADMIN
    // ---------------------------------------------------------
    console.log("\n=================================================");
    console.log(`🚨 [SYSTEM MOCK] THÔNG BÁO GỬI TỚI ADMIN`);
    console.log(`- Có khiếu nại mới từ Đơn hàng: ${order._id}`);
    console.log(`- Lý do: ${reason}`);
    console.log(`- Người mua (Buyer ID): ${req.userId}`);
    console.log("=================================================\n");

    res.status(201).json(newDispute);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi tạo khiếu nại" });
  }
};

// [GET] Lấy danh sách khiếu nại (Có phân quyền)
exports.getDisputes = async (req, res) => {
  try {
    let filter = {};
    
    // Phân luồng dữ liệu cực kỳ nghiêm ngặt
    if (req.userRole === "buyer") {
      filter.buyerId = req.userId; // Buyer chỉ thấy đơn mình đi kiện
    } else if (req.userRole === "seller") {
      filter.sellerId = req.userId; // Seller chỉ thấy đơn mình bị kiện
    } 
    // Nếu là admin thì giữ filter rỗng {} để xem toàn bộ hệ thống

    const disputes = await Dispute.find(filter)
      .populate("orderId", "listingTitle images") // Lấy thông tin cơ bản của đơn
      .sort({ createdAt: -1 });

    res.status(200).json(disputes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải danh sách khiếu nại" });
  }
};

// [PATCH] Cập nhật trạng thái và ghi nhận Timeline
exports.updateDisputeStatus = async (req, res) => {
  try {
    const { status, sellerResponse } = req.body;
    
    // Tạo bản ghi lịch sử mới dựa trên người đang thao tác
    let actorRole = req.userRole || "system";
    let actionNote = "Cập nhật trạng thái";

    if (status === "SELLER_RESPONDED") {
      actionNote = `Shop đã phản hồi: ${sellerResponse}`;
    } else if (status === "CLOSED") {
      actionNote = "Khiếu nại đã được rút lại / đóng";
    }

    const newTimelineEvent = {
      actor: actorRole,
      action: status,
      note: actionNote,
      timestamp: new Date()
    };

    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { 
        status: status, 
        sellerResponse: sellerResponse,
        $push: { timeline: newTimelineEvent } // Nhét sự kiện mới vào mảng
      },
      { new: true }
    );

    if (!dispute) {
      return res.status(404).json({ message: "Không tìm thấy khiếu nại" });
    }

    res.status(200).json(dispute);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái" });
  }
};

// [GET] Lấy chi tiết khiếu nại
exports.getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate("orderId", "listingTitle")
      .populate("sellerId", "username email");

    if (!dispute) {
      return res.status(404).json({ message: "Không tìm thấy khiếu nại" });
    }

    // Lấy ID thật (do dùng populate nên sellerId có thể bị biến thành Object)
    const actualSellerId = dispute.sellerId?._id 
      ? dispute.sellerId._id.toString() 
      : dispute.sellerId.toString();

    const actualBuyerId = dispute.buyerId.toString();

    // KIỂM TRA QUYỀN TRUY CẬP CHÉO
    if (
      req.userRole !== "admin" && 
      req.userId !== actualBuyerId && 
      req.userId !== actualSellerId
    ) {
      return res.status(403).json({ message: "Cảnh báo: Bạn không có quyền xem khiếu nại của Shop khác!" });
    }

    res.status(200).json(dispute);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết" });
  }
};