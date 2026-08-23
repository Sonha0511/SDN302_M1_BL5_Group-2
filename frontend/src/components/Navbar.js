import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar({ hideCategories = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  // STATE MỚI: Lưu số lượng khiếu nại đang chờ xử lý
  const [pendingDisputes, setPendingDisputes] = useState(0);

  const handleLogout = () => {
    logout();
    navigate("/");
  };
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/listings");
    }
  };

  // EFFECT MỚI: Tự động gọi API đếm số khiếu nại khi user đăng nhập
  useEffect(() => {
    if (user) {
      const fetchPendingDisputes = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch("http://localhost:5000/api/disputes", {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            // Lọc ra những đơn hàng có trạng thái "OPEN" (Mới tạo/Chưa xử lý)
            const openCount = data.filter(d => d.status === "OPEN").length;
            setPendingDisputes(openCount);
          }
        } catch (error) {
          console.error("Lỗi đếm số lượng khiếu nại:", error);
        }
      };
      
      fetchPendingDisputes();
    }
  }, [user]);

  // Đã thêm cờ `isDispute: true` vào mục khiếu nại để render badge
  const myEbayItems = [
    { label: "Summary", to: null },
    { label: "Recently Viewed", to: null },
    { label: "Bids/Offers", to: null },
    { label: "Watchlist", to: null },
    { label: "Purchase History / My Orders", to: "/my-orders" },
    { label: "Buy Again", to: null },
    { label: "Selling", to: "/seller/inventory" },
    { label: "Saved Feed", to: null },
    { label: "Saved Searches", to: null },
    { label: "Saved Sellers", to: null },
    { label: "Payments", to: null },
    { label: "My Garage", to: null },
    { label: "Preferences", to: null },
    { label: "My Collection", to: null },
    { label: "Messages", to: "/messages" },
    { label: "PSA Vault", to: null },
    { label: "My Disputes", to: "/disputes/my", isDispute: true },
  ];

  return (
    <header className="w-full bg-white">
      {/* Top bar */}
      <div className="border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 py-1 flex justify-between items-center text-xs text-gray-600">
          {/* Left */}
          <div className="flex gap-3 items-center">
            {user ? (
              <span>
                Hi, <span className="font-semibold">{user.name}</span>!
              </span>
            ) : (
              <span>
                Hi!{" "}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>{" "}
                or{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  register
                </Link>
              </span>
            )}
            <span className="hover:underline cursor-pointer">Deals</span>
            <span className="hover:underline cursor-pointer">Brand Outlet</span>
            <span className="hover:underline cursor-pointer">Gift Cards</span>
            <span className="hover:underline cursor-pointer">
              Help & Contact
            </span>
          </div>

          {/* Right */}
          <div className="flex gap-4 items-center">
            <span className="hover:underline cursor-pointer">Ship to 🇻🇳</span>
            <span className="text-gray-300">|</span>
            <Link to="/sell" className="hover:underline">
              Sell
            </Link>
            <div className="flex items-center gap-1 cursor-pointer hover:underline">
              <span>Watchlist</span>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* My eBay dropdown */}
            <div className="relative group">
              <div className="flex items-center gap-1 cursor-pointer hover:underline relative">
                <span>My eBay</span>
                
                {/* HIỂN THỊ CHẤM ĐỎ (BADGE) NẾU CÓ KHIẾU NẠI CHỜ XỬ LÝ */}
                {pendingDisputes > 0 && (
                  <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-sm">
                    {pendingDisputes}
                  </span>
                )}

                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Dropdown panel */}
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 py-0.5">
                {myEbayItems.map(({ label, to, isDispute }) =>
                  to ? (
                    <Link
                      key={label}
                      to={to}
                      className="px-3 py-1.5 text-xs text-gray-800 hover:bg-gray-50 hover:text-blue-600 transition-colors flex justify-between items-center"
                    >
                      <span>{label}</span>
                      {/* HIỂN THỊ BADGE BÊN TRONG DROPDOWN */}
                      {isDispute && pendingDisputes > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {pendingDisputes} New
                        </span>
                      )}
                    </Link>
                  ) : (
                    <span
                      key={label}
                      className="block px-3 py-1.5 text-xs text-gray-800 cursor-default pointer-events-none"
                      title="Chưa phát triển"
                    >
                      {label}
                    </span>
                  ),
                )}
              </div>
            </div>

            <button>
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <Link to="/cart">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </Link>
            {user && (
              <span
                onClick={handleLogout}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Sign out
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 mr-1">
          <span
            className="text-4xl font-bold italic"
            style={{ color: "#e53238" }}
          >
            e
          </span>
          <span
            className="text-4xl font-bold italic"
            style={{ color: "#0064d2" }}
          >
            b
          </span>
          <span
            className="text-4xl font-bold italic"
            style={{ color: "#f5af02" }}
          >
            a
          </span>
          <span
            className="text-4xl font-bold italic"
            style={{ color: "#86b817" }}
          >
            y
          </span>
        </Link>

        {/* Shop by category */}
        <button className="text-sm text-gray-700 hover:underline whitespace-nowrap hidden md:flex items-center gap-1">
          Shop by category
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Search bar */}
        <div className="flex flex-1 items-center gap-2">
          <div className="flex flex-1 border-2 border-gray-800 rounded-full overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for anything"
              className="flex-1 px-4 py-2 text-sm outline-none"
            />
            <button className="px-3 text-gray-500 hover:text-gray-700 border-l border-gray-200">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <select className="border-l border-gray-300 px-2 text-xs text-gray-600 outline-none hidden md:block bg-gray-50">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Fashion</option>
              <option>Motors</option>
            </select>
          </div>

          {/* Nút Search tách riêng ra ngoài */}
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-semibold rounded-full flex-shrink-0"
          >
            Search
          </button>
        </div>

        {/* Advanced */}
        <span className="text-xs text-blue-600 hover:underline cursor-pointer hidden md:block whitespace-nowrap">
          Advanced
        </span>
      </div>

      {/* Category bar */}
      {!hideCategories && (
        <div className="border-t border-gray-200">
          <div className="max-w-screen-2xl mx-auto px-4 py-2 flex gap-6 text-sm text-gray-700 overflow-x-auto justify-center">
            {[
              "Saved",
              "Electronics",
              "Motors",
              "Fashion",
              "Collectibles and art",
              "Sports",
              "Health and beauty",
              "Industrial equipment",
              "Home and garden",
              "Deals",
              "Sell",
            ].map((item) =>
              item === "Sell" ? (
                <Link
                  key={item}
                  to="/sell"
                  className="hover:underline whitespace-nowrap text-gray-700"
                >
                  {item}
                </Link>
              ) : (
                <span
                  key={item}
                  className="hover:underline cursor-pointer whitespace-nowrap"
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
