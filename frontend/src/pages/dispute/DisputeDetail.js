import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";

const DisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Lấy thông tin user đang đăng nhập từ Context
  const { user, loading: authLoading } = useAuth();
  
  const [responseMessage, setResponseMessage] = useState("");

  useEffect(() => {
    // Chờ AuthContext load xong user thì mới gọi API
    if (!authLoading) {
      fetchDetail();
    }
  }, [id, authLoading]);

  const fetchDetail = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/disputes/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        // DEBUG: In data ra console để kiểm tra xem mảng evidenceImages có dữ liệu không
        console.log("Dữ liệu khiếu nại từ API:", data);
        
        setDispute(data);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    if (newStatus === "SELLER_RESPONDED" && !responseMessage.trim()) {
      alert("Vui lòng nhập nội dung phản hồi trước khi xác nhận!");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/disputes/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          status: newStatus,
          sellerResponse: newStatus === "SELLER_RESPONDED" ? responseMessage : dispute.sellerResponse 
        })
      });
      if (response.ok) {
        alert("Cập nhật trạng thái thành công!");
        setResponseMessage("");
        fetchDetail();
      }
    } catch (error) {
      alert("Lỗi cập nhật!");
    }
  };

  if (loading || authLoading) return <div style={{ textAlign: "center", marginTop: "50px" }}>Đang tải...</div>;
  if (!dispute) return <div style={{ textAlign: "center", marginTop: "50px" }}>Không tìm thấy dữ liệu!</div>;

  // =================================================================
  // LOGIC PHÂN QUYỀN CHÍNH XÁC DỰA VÀO ID USER
  // =================================================================
  let currentRole = "guest";
  if (user) {
    const sellerId = dispute.sellerId?._id || dispute.sellerId;
    const buyerId = dispute.buyerId?._id || dispute.buyerId;

    if (user._id === sellerId) {
      currentRole = "seller"; // Chủ shop của đơn này
    } else if (user._id === buyerId) {
      currentRole = "buyer"; // Người mua của đơn này
    } else if (user.role === "admin") {
      currentRole = "admin"; // Quản trị viên
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case "OPEN": return { bg: "#fff3cd", text: "#856404", label: "Mới tạo (Chờ xử lý)" };
      case "SELLER_RESPONDED": return { bg: "#cce5ff", text: "#004085", label: "Shop đã phản hồi" };
      case "CLOSED": return { bg: "#e2e3e5", text: "#383d41", label: "Đã đóng/Hủy" };
      case "RESOLVED_REJECTED": return { bg: "#f8d7da", text: "#721c24", label: "Bị từ chối" };
      default: return { bg: "#d4edda", text: "#155724", label: status };
    }
  };
  const statusStyle = getStatusStyle(dispute.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px", backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "8px" }}>
        <button 
          onClick={() => navigate("/disputes/my")}
          style={{ marginBottom: "20px", padding: "5px 15px", cursor: "pointer", background: "#f4f4f4", border: "1px solid #ddd", borderRadius: "4px" }}
        >
          ← Quay lại danh sách
        </button>

        <h2 style={{ borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Chi Tiết Khiếu Nại</h2>
        
        {/* THÔNG TIN TỪ NGƯỜI MUA */}
        <div style={{ marginTop: "20px", lineHeight: "1.8" }}>
          <p><strong>Trạng thái: </strong> 
            <span style={{ 
              padding: "4px 10px", borderRadius: "12px", fontSize: "14px", fontWeight: "bold",
              backgroundColor: statusStyle.bg, color: statusStyle.text
            }}>
              {statusStyle.label}
            </span>
          </p>
          <p><strong>Lý do:</strong> {dispute.reason}</p>
          
          <div style={{ padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "5px", border: "1px solid #eee" }}>
            <strong>Mô tả của người mua:</strong>
            <p style={{ margin: "5px 0 0", whiteSpace: "pre-wrap" }}>{dispute.description}</p>
          </div>

          {/* ẢNH MINH CHỨNG */}
          {dispute.evidenceImages && dispute.evidenceImages.length > 0 ? (
            <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "5px", border: "1px solid #eee" }}>
              <strong>Ảnh minh chứng đính kèm:</strong>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                {dispute.evidenceImages.map((imgUrl, idx) => (
                  <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" title="Click để xem ảnh lớn">
                    <img 
                      src={imgUrl} 
                      alt={`evidence-${idx}`} 
                      onError={(e) => {
                        // Nếu URL ảnh hỏng, thay bằng ảnh báo lỗi
                        e.target.src = "https://via.placeholder.com/100?text=L%E1%BB%97i+%E1%BA%A3nh";
                      }}
                      style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ccc", cursor: "zoom-in" }}
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "5px", fontSize: "14px" }}>
              <em>* Người mua không đính kèm ảnh minh chứng nào cho khiếu nại này.</em>
            </div>
          )}
        </div>

        {/* PHẢN HỒI CỦA SELLER */}
        {dispute.sellerResponse && (
          <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#e9f7ef", borderRadius: "5px", border: "1px solid #c3e6cb", color: "#155724" }}>
            <strong>Phản hồi từ Người bán:</strong>
            <p style={{ margin: "5px 0 0", whiteSpace: "pre-wrap" }}>{dispute.sellerResponse}</p>
          </div>
        )}

        {/* HIỂN THỊ LỊCH SỬ TIMELINE */}
        <div style={{ marginTop: "30px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
          <h4 style={{ margin: "0 0 15px 0" }}>Lịch sử tiến trình</h4>
          <ul style={{ listStyleType: "none", paddingLeft: 0, margin: 0 }}>
            {dispute.timeline && dispute.timeline.map((event, index) => (
              <li key={index} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: index !== dispute.timeline.length - 1 ? "1px dashed #eee" : "none" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>{new Date(event.timestamp).toLocaleString("vi-VN")}</span>
                <br />
                <strong style={{ color: event.actor === "buyer" ? "#dc3545" : event.actor === "seller" ? "#28a745" : "#007bff" }}>
                  [{event.actor.toUpperCase()}]
                </strong>: {event.note}
              </li>
            ))}
          </ul>
        </div>

        {/* KHU VỰC THAO TÁC THEO ROLE */}
        <div style={{ marginTop: "30px" }}>
          
          {/* NẾU LÀ SELLER CHÍNH CHỦ */}
          {currentRole === "seller" && dispute.status === "OPEN" && (
            <div style={{ padding: "15px", border: "1px dashed #28a745", borderRadius: "5px", backgroundColor: "#f8fff9" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#28a745" }}>Xử lý khiếu nại (Dành cho Người bán)</h4>
              <textarea
                rows="3"
                placeholder="Nhập nội dung giải trình hoặc phương án hỗ trợ người mua..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
              />
              <button 
                onClick={() => updateStatus("SELLER_RESPONDED")} 
                style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
              >
                Xác nhận & Gửi phản hồi
              </button>
            </div>
          )}

          {/* NẾU LÀ BUYER CHÍNH CHỦ */}
          {currentRole === "buyer" && dispute.status !== "CLOSED" && !dispute.status.includes("RESOLVED") && (
            <div style={{ textAlign: "right" }}>
              <button 
                onClick={() => { if(window.confirm("Bạn chắc chắn muốn hủy khiếu nại này?")) updateStatus("CLOSED"); }}
                style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Hủy / Rút lại khiếu nại
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DisputeDetail;