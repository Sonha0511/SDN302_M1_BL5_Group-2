import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import SellerHubHeader from "../components/SellerHubHeader";
import { getMyListings } from "../services/sellerService";

const formatPrice = (value = 0) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
const formatDate = (value) => new Date(value).toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" });

export default function SellerMarketing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "summary"; // summary or discounts

  const [listings, setListings] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create Voucher form states
  const [code, setCode] = useState("");
  const [selectedListingId, setSelectedListingId] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [endDate, setEndDate] = useState("");

  // UI States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    if (user.role !== "seller") { navigate("/"); return; }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeTab]);

  useEffect(() => {
    // If a pre-selected listingId is passed in the URL (e.g. from Inventory)
    const presetId = searchParams.get("listingId");
    if (presetId) {
      setSelectedListingId(presetId);
      setShowCreateForm(true);
    }
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch listings for the dropdown selector
      const listingsRes = await getMyListings();
      if (listingsRes.data.success) {
        setListings(listingsRes.data.data);
      }

      // 2. Fetch vouchers
      const vouchersRes = await api.get("/vouchers/seller");
      if (vouchersRes.data.success) {
        setVouchers(vouchersRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load marketing data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!code.trim() || !selectedListingId || !discountValue || !endDate) {
      setError("Please fill in all required fields (Voucher Code, Target Product, Discount Value, End Date).");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.toUpperCase().trim(),
        listingId: selectedListingId,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscountAmount: Number(maxDiscountAmount) || 0,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        endDate: new Date(endDate).toISOString(),
      };

      const res = await api.post("/vouchers", payload);
      if (res.data.success) {
        setSuccess(`Voucher ${payload.code} created successfully!`);
        // Reset form
        setCode("");
        setSelectedListingId("");
        setDiscountValue("");
        setMinOrderValue("");
        setMaxDiscountAmount("");
        setUsageLimit("");
        setEndDate("");
        setShowCreateForm(false);
        // Reload vouchers
        loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create voucher.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActiveVoucher = async (voucherId, currentActive) => {
    setError("");
    setSuccess("");
    try {
      const res = await api.patch(`/vouchers/${voucherId}/toggle`);
      if (res.data.success) {
        setSuccess(`Voucher is now ${!currentActive ? "Active" : "Paused"}.`);
        setVouchers(current => current.map(v => v._id === voucherId ? { ...v, isActive: !currentActive } : v));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update voucher status.");
    }
  };

  const handleDeleteVoucher = async (voucherId) => {
    if (!window.confirm("Are you sure you want to delete this voucher?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.delete(`/vouchers/${voucherId}`);
      if (res.data.success) {
        setSuccess("Voucher deleted successfully.");
        setVouchers(current => current.filter(v => v._id !== voucherId));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete voucher.");
    }
  };

  const switchTab = (tabName) => {
    setSearchParams({ tab: tabName });
    setError("");
    setSuccess("");
  };

  if (authLoading || !user || user.role !== "seller") return null;

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <SellerHubHeader active="marketing" user={user} />

      <main className="mx-auto max-w-screen-2xl px-6 py-9">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
          
          {/* Left Sidebar Navigation */}
          <aside className="flex flex-col gap-2">
            <button
              onClick={() => switchTab("summary")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "summary" ? "bg-white border-l-4 border-blue-600 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-150"
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => switchTab("discounts")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "discounts" ? "bg-white border-l-4 border-blue-600 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-150"
              }`}
            >
              Discounts
            </button>
            <div className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-400 flex items-center justify-between cursor-default">
              <span>Offers</span>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase scale-90">NEW</span>
            </div>
            <div className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-400 cursor-default">
              Buyer groups
            </div>
            <div className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-400 cursor-default">
              Social
            </div>
          </aside>

          {/* Right Main Content Area */}
          <div className="space-y-6">

            {/* TAB 1: SUMMARY */}
            {activeTab === "summary" && (
              <>
                {/* Header & Create Discount Dropdown */}
                <div className="flex justify-between items-center gap-4">
                  <h1 className="text-3xl font-bold">Summary</h1>
                  <div className="relative">
                    <button
                      onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                      className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow"
                    >
                      Create discount <span className="text-xs">▼</span>
                    </button>
                    {showCreateDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-10 font-semibold text-sm">
                        <button
                          onClick={() => {
                            setShowCreateDropdown(false);
                            switchTab("discounts");
                            setShowCreateForm(true);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700"
                        >
                          🎫 Create coupon / voucher
                        </button>
                        <div className="w-full text-left px-4 py-2.5 text-gray-300 cursor-not-allowed">
                          Volume pricing (Soon)
                        </div>
                        <div className="w-full text-left px-4 py-2.5 text-gray-300 cursor-not-allowed">
                          Sale event (Soon)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Purple growth banner */}
                <div className="bg-[#E8DAFC]/70 border border-purple-200 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                  <div className="max-w-xl space-y-4">
                    <h2 className="text-3xl font-extrabold text-purple-950">Get set to grow your business</h2>
                    <p className="text-base text-purple-900 leading-relaxed">
                      Discover more ways to connect to buyers, market your business, and create discounts.
                    </p>
                    <div className="flex gap-4 items-center">
                      <button
                        onClick={() => switchTab("discounts")}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-full text-sm shadow transition"
                      >
                        Get started
                      </button>
                      <span className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer">Learn more</span>
                    </div>
                  </div>

                  {/* Character Illustration SVG */}
                  <div className="w-48 h-32 flex-shrink-0 flex items-center justify-center relative">
                    <svg className="w-full h-full" viewBox="0 0 200 120" fill="none">
                      <rect x="25" y="30" width="45" height="70" rx="20" fill="#f472b6" />
                      <circle cx="47" cy="20" r="10" fill="#db2777" />
                      <rect x="130" y="25" width="45" height="75" rx="20" fill="#4ade80" />
                      <circle cx="152" cy="15" r="10" fill="#16a34a" />
                      <rect x="80" y="45" width="40" height="25" rx="5" fill="#3b82f6" />
                      <text x="100" y="60" fontSize="9" fill="white" fontWeight="bold" textAnchor="middle">Sold</text>
                    </svg>
                  </div>
                </div>

                {/* Marketing tools grid */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">Marketing tools</h3>
                    <p className="text-sm text-gray-500 mt-1">Use a range of tactics to connect to buyers, grow visibility and sales.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    {/* Tool 1 */}
                    <div className="bg-white border border-gray-300 rounded-xl p-5 flex flex-col justify-between h-48 hover:shadow-md transition">
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-base font-bold text-gray-900">
                          <span className="text-lg">📷</span> Social sharing
                        </div>
                        <p className="text-xs text-gray-500 leading-5">Help to drive more visits to your listings from social media.</p>
                      </div>
                      <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer mt-4">Share to social</span>
                    </div>

                    {/* Tool 2 */}
                    <div className="bg-white border border-gray-300 rounded-xl p-5 flex flex-col justify-between h-48 hover:shadow-md transition">
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-base font-bold text-gray-900">
                          <span className="text-lg">🔒</span> Volume pricing
                        </div>
                        <p className="text-xs text-gray-500 leading-5">Encourage buyers to purchase the same item in bulk.</p>
                      </div>
                      <span className="text-xs font-bold text-gray-400 mt-4 cursor-not-allowed">Create volume pricing (Soon)</span>
                    </div>

                    {/* Tool 3 */}
                    <div className="bg-white border border-gray-300 rounded-xl p-5 flex flex-col justify-between h-48 hover:shadow-md transition">
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-base font-bold text-gray-900">
                          <span className="text-lg">🔒</span> Sale event
                        </div>
                        <p className="text-xs text-gray-500 leading-5">Lower prices for a limited time to help move inventory faster.</p>
                      </div>
                      <span className="text-xs font-bold text-gray-400 mt-4 cursor-not-allowed">Create sale event (Soon)</span>
                    </div>

                    {/* Tool 4 */}
                    <div className="bg-white border border-gray-300 rounded-xl p-5 flex flex-col justify-between h-48 hover:shadow-md border-blue-400 bg-blue-50/10">
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-base font-bold text-gray-900">
                          <span className="text-lg">🎫</span> Coupon / Voucher
                        </div>
                        <p className="text-xs text-gray-600 leading-5">Give buyers a discount coupon they can apply at checkout.</p>
                      </div>
                      <button
                        onClick={() => { switchTab("discounts"); setShowCreateForm(true); }}
                        className="text-left text-xs font-bold text-blue-600 hover:underline mt-4"
                      >
                        Create coupon →
                      </button>
                    </div>

                  </div>
                </div>
              </>
            )}

            {/* TAB 2: DISCOUNTS */}
            {activeTab === "discounts" && (
              <>
                <div className="flex justify-between items-center gap-4">
                  <h1 className="text-3xl font-bold">Discounts & Vouchers</h1>
                  {!showCreateForm && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow"
                    >
                      + Create Voucher
                    </button>
                  )}
                </div>

                {success && <div className="bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-3 rounded-lg">{success}</div>}
                {error && <div className="bg-red-50 border border-red-300 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

                {/* Form to create coupon */}
                {showCreateForm && (
                  <section className="bg-white border border-gray-300 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">New Coupon</h2>
                      <button onClick={() => setShowCreateForm(false)} className="text-gray-500 hover:text-gray-800 text-sm font-semibold">
                        Cancel
                      </button>
                    </div>
                    <form onSubmit={handleCreateVoucher} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Coupon Code *</label>
                        <input
                          type="text"
                          placeholder="e.g., BLACKFRIDAY"
                          value={code}
                          onChange={e => setCode(e.target.value)}
                          maxLength={15}
                          className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm outline-none focus:border-blue-600 uppercase"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Target Product *</label>
                        <select
                          value={selectedListingId}
                          onChange={e => setSelectedListingId(e.target.value)}
                          className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm outline-none focus:border-blue-600 bg-white"
                          required
                        >
                          <option value="">-- Choose one of your listings --</option>
                          {listings.map(item => (
                            <option key={item._id} value={item._id}>
                              {item.title} ({formatPrice(item.pricing?.fixedPrice)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Discount Type *</label>
                        <select
                          value={discountType}
                          onChange={e => { setDiscountType(e.target.value); setDiscountValue(""); }}
                          className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm outline-none focus:border-blue-600 bg-white"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (VND)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          {discountType === "percentage" ? "Discount Percentage (%) *" : "Discount Amount (VND) *"}
                        </label>
                        <input
                          type="number"
                          placeholder={discountType === "percentage" ? "15" : "50000"}
                          value={discountValue}
                          onChange={e => setDiscountValue(e.target.value)}
                          min={1}
                          max={discountType === "percentage" ? 100 : undefined}
                          className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm outline-none focus:border-blue-600"
                          required
                        />
                      </div>

                      {discountType === "percentage" && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Max discount amount (VND, optional)</label>
                          <input
                            type="number"
                            placeholder="e.g., 200000"
                            value={maxDiscountAmount}
                            onChange={e => setMaxDiscountAmount(e.target.value)}
                            className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm outline-none focus:border-blue-600"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Min Order Value (VND, optional)</label>
                        <input
                          type="number"
                          placeholder="e.g., 100000"
                          value={minOrderValue}
                          onChange={e => setMinOrderValue(e.target.value)}
                          className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Usage Limit (optional)</label>
                        <input
                          type="number"
                          placeholder="Unlimited if empty"
                          value={usageLimit}
                          onChange={e => setUsageLimit(e.target.value)}
                          className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Expiration Date *</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm outline-none focus:border-blue-600"
                          required
                        />
                      </div>

                      <div className="md:col-span-2 pt-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full text-sm disabled:opacity-50 transition"
                        >
                          {submitting ? "Creating..." : "Launch Coupon"}
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {/* Vouchers Table List */}
                <section className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                  <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-bold text-gray-800">Active Promotions ({vouchers.length})</h2>
                  </div>
                  {loading ? (
                    <div className="space-y-4 p-5">{[1, 2].map(n => <div key={n} className="h-20 animate-pulse rounded bg-gray-100" />)}</div>
                  ) : vouchers.length === 0 ? (
                    <div className="px-6 py-16 text-center text-gray-500">
                      <p className="text-4xl mb-3">🏷️</p>
                      <h3 className="text-lg font-bold">No coupons found</h3>
                      <p className="text-sm mt-1 text-gray-400">Launch a coupon to increase sales conversions.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                            <th className="p-4">Coupon Code</th>
                            <th className="p-4">Target Product</th>
                            <th className="p-4">Discount</th>
                            <th className="p-4">Min. Subtotal</th>
                            <th className="p-4">Usage</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Ends On</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {vouchers.map((voucher) => (
                            <tr key={voucher._id} className="hover:bg-gray-50">
                              <td className="p-4 align-middle font-bold text-blue-700">
                                <span className="border-2 border-dashed border-blue-400 bg-blue-50 px-3 py-1.5 rounded-lg inline-block text-xs uppercase font-mono">
                                  {voucher.code}
                                </span>
                              </td>
                              <td className="p-4 align-middle max-w-xs truncate">
                                <a
                                  href={`/listing/${voucher.listingId?._id || voucher.listingId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-semibold"
                                >
                                  {voucher.listingId?.title || "Product details"}
                                </a>
                              </td>
                              <td className="p-4 align-middle font-semibold">
                                {voucher.discountType === "fixed" ? (
                                  <span>{formatPrice(voucher.discountValue)}</span>
                                ) : (
                                  <span>{voucher.discountValue}% Off</span>
                                )}
                              </td>
                              <td className="p-4 align-middle">
                                {voucher.minOrderValue > 0 ? formatPrice(voucher.minOrderValue) : "None"}
                              </td>
                              <td className="p-4 align-middle">
                                {voucher.usageLimit ? (
                                  <span>{voucher.usedCount} / {voucher.usageLimit}</span>
                                ) : (
                                  <span>{voucher.usedCount}</span>
                                )}
                              </td>
                              <td className="p-4 align-middle">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${voucher.isActive ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                                  {voucher.isActive ? "Active" : "Paused"}
                                </span>
                              </td>
                              <td className="p-4 align-middle text-xs">
                                {formatDate(voucher.endDate)}
                              </td>
                              <td className="p-4 align-middle text-right space-x-3">
                                <button
                                  onClick={() => handleToggleActiveVoucher(voucher._id, voucher.isActive)}
                                  className="text-sm font-semibold text-blue-600 hover:underline"
                                >
                                  {voucher.isActive ? "Pause" : "Resume"}
                                </button>
                                <button
                                  onClick={() => handleDeleteVoucher(voucher._id)}
                                  className="text-sm font-semibold text-red-600 hover:underline"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
