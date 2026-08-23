import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

const DisputeList = () => {
  const [disputes, setDisputes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDisputes = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("http://localhost:5000/api/disputes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setDisputes(data);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách khiếu nại", error);
      }
    };
    fetchDisputes();
  }, []);

  // Helper function để đồng bộ màu sắc status
  const getBadgeStyle = (status) => {
    if (status === "OPEN") return { bg: "#fff3cd", text: "#856404", label: "MỚI TẠO" };
    if (status === "SELLER_RESPONDED") return { bg: "#cce5ff", text: "#004085", label: "ĐÃ PHẢN HỒI" };
    if (status === "CLOSED") return { bg: "#e2e3e5", text: "#383d41", label: "ĐÃ ĐÓNG" };
    if (status.includes("REJECTED")) return { bg: "#f8d7da", text: "#721c24", label: "TỪ CHỐI" };
    return { bg: "#d4edda", text: "#155724", label: status }; // Mặc định cho Resolved
  };

  return (
    <>
      <Navbar />
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
      <h2>Danh Sách Khiếu Nại</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f4f4f4", textAlign: "left" }}>
            <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Đơn hàng</th>
            <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Lý do</th>
            <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Trạng thái</th>
            <th style={{ padding: "12px", borderBottom: "1px solid #ddd", textAlign: "center" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {disputes.map((d) => {
            const badge = getBadgeStyle(d.status);
            return (
              <tr key={d._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}>
                  <strong>{d.orderId?.listingTitle || "Đơn hàng không xác định"}</strong> <br />
                  <span style={{ fontSize: "12px", color: "gray" }}>ID: {d.orderId?._id || d.orderId}</span>
                </td>
                <td style={{ padding: "12px" }}>{d.reason}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    padding: "5px 10px", borderRadius: "15px", fontSize: "12px", fontWeight: "bold",
                    backgroundColor: badge.bg, color: badge.text
                  }}>
                    {badge.label}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <button
                    onClick={() => navigate(`/disputes/${d._id}`)}
                    style={{ padding: "6px 15px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {disputes.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          Chưa có khiếu nại nào.
        </div>
      )}
    </div>
    </>
  );
};

export default DisputeList;