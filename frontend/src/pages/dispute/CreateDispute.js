import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

// Hàm định dạng tiền tệ giống bên MyOrders
const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const CreateDispute = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [reason, setReason] = useState("NOT_AS_DESCRIBED");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State mới để lưu thông tin chi tiết đơn hàng
  const [orderDetail, setOrderDetail] = useState(null);

  useEffect(() => {
    // 1. Lấy dữ liệu nháp (nếu có)
    const draftText = localStorage.getItem(`draft_dispute_${orderId}`);
    if (draftText) setDescription(draftText);

    // 2. Gọi API lấy thông tin đơn hàng để hiển thị bên phải
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setOrderDetail(data);
        }
      } catch (error) {
        console.error("Lỗi tải thông tin đơn hàng:", error);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    setDescription(text);
    localStorage.setItem(`draft_dispute_${orderId}`, text);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 3) {
      alert("Bạn chỉ được tải lên tối đa 3 ảnh minh chứng.");
      return;
    }
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("Đang xử lý tải ảnh lên...");
    
    const token = localStorage.getItem("token");
    let uploadedImageUrls = [];

    try {
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append("images", file));

        const uploadRes = await fetch("http://localhost:5000/api/upload/images", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });

        if (!uploadRes.ok) throw new Error("Lỗi tải ảnh lên");
        
        const uploadData = await uploadRes.json();
        console.log("Kết quả từ API Upload:", uploadData);

        const rawUrls = uploadData.urls || [];
        uploadedImageUrls = rawUrls.map(item => typeof item === 'string' ? item : item.url);
      }

      setMessage("Đang gửi khiếu nại...");
      const response = await fetch("http://localhost:5000/api/disputes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: orderId,
          reason,
          description,
          evidenceImages: uploadedImageUrls
        })
      });

      if (response.ok) {
        localStorage.removeItem(`draft_dispute_${orderId}`);
        alert("Gửi khiếu nại thành công!");
        navigate("/disputes/my");
      } else {
        const errorData = await response.json();
        setMessage(`Lỗi: ${errorData.message}`);
      }
    } catch (error) {
      setMessage(`Lỗi: ${error.message || "Không thể kết nối đến server"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Container chính: Sử dụng Flexbox để chia 2 cột */}
      <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px", display: "flex", gap: "30px", flexWrap: "wrap", alignItems: "flex-start" }}>
        
        {/* ===================== CỘT TRÁI: FORM KHIẾU NẠI ===================== */}
        <div style={{ flex: "1 1 500px", padding: "25px", backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <h2 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Gửi Khiếu Nại Đơn Hàng</h2>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>Mã đơn: <strong style={{ fontFamily: "monospace" }}>{orderId}</strong></p>

          {message && <div style={{ marginBottom: "15px", padding: "10px", borderRadius: "4px", backgroundColor: message.includes("Lỗi") ? "#f8d7da" : "#cce5ff", color: message.includes("Lỗi") ? "#721c24" : "#004085", fontWeight: "bold" }}>{message}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>Lý do khiếu nại:</label>
              <select 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", outline: "none" }}
              >
                <option value="NOT_AS_DESCRIBED">Không đúng mô tả</option>
                <option value="NOT_RECEIVED">Chưa nhận được hàng</option>
                <option value="DAMAGED">Hàng bị hư hỏng</option>
                <option value="MISSING_PARTS">Thiếu phụ kiện</option>
                <option value="OTHER">Lý do khác</option>
              </select>
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>Mô tả chi tiết:</label>
              <textarea
                rows="5"
                placeholder="Mô tả chi tiết vấn đề của bạn..."
                value={description}
                onChange={handleDescriptionChange}
                required
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", border: "1px dashed #ced4da", borderRadius: "8px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Ảnh minh chứng (Tối đa 3 ảnh):</label>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={handleFileChange}
                style={{ width: "100%", fontSize: "14px" }}
              />
              
              {files.length > 0 && (
                <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
                  {files.map((file, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`preview-${idx}`} 
                        style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #ddd" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ padding: "12px 20px", backgroundColor: isSubmitting ? "#ccc" : "#d9534f", color: "white", border: "none", borderRadius: "6px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: "bold", width: "100%", fontSize: "15px", transition: "0.2s" }}
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận & Gửi khiếu nại"}
            </button>
          </form>
        </div>

        {/* ===================== CỘT PHẢI: THÔNG TIN SẢN PHẨM ===================== */}
        <div style={{ flex: "1 1 350px", maxWidth: "400px", padding: "20px", backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "10px", fontSize: "18px" }}>Thông tin đơn hàng</h3>
          
          {!orderDetail ? (
            <div style={{ padding: "20px 0", color: "#666", textAlign: "center" }}>Đang tải thông tin sản phẩm...</div>
          ) : (
            <div style={{ marginTop: "15px" }}>
              {/* Ảnh sản phẩm */}
              <div style={{ width: "100%", height: "200px", backgroundColor: "#f8f9fa", borderRadius: "8px", overflow: "hidden", marginBottom: "15px", border: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {orderDetail.listingImage ? (
                  <img 
                    src={orderDetail.listingImage} 
                    alt={orderDetail.listingTitle} 
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                  />
                ) : (
                  <span style={{ color: "#aaa", fontSize: "14px" }}>Không có ảnh</span>
                )}
              </div>
              
              {/* Chi tiết sản phẩm */}
              <h4 style={{ margin: "0 0 10px 0", color: "#333", lineHeight: "1.4" }}>
                {orderDetail.listingTitle || "Tên sản phẩm không xác định"}
              </h4>
              
              <div style={{ fontSize: "14px", color: "#555", lineHeight: "1.8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #eee", paddingBottom: "5px", marginBottom: "5px" }}>
                  <span>Phân loại/Option:</span> 
                  <strong>{orderDetail.paymentMethod || "Mặc định"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #eee", paddingBottom: "5px", marginBottom: "5px" }}>
                  <span>Số lượng:</span> 
                  <strong>x{orderDetail.quantity || 1}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #eee", paddingBottom: "5px", marginBottom: "5px" }}>
                  <span>Shop bán:</span> 
                  <strong>{orderDetail.sellerId?.username || "Ẩn danh"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px" }}>
                  <span style={{ fontWeight: "bold", color: "#333" }}>Tổng thanh toán:</span> 
                  <strong style={{ color: "#d9534f", fontSize: "18px" }}>
                    {orderDetail.pricing?.total ? formatPrice(orderDetail.pricing.total) : "N/A"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CreateDispute;