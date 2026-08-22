import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import SellerReputation from "../../components/SellerReputation";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price,
  );

function Checkout() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [address, setAddress] = useState({
    fullName: user?.name || "",
    phone: "",
    street: "",
    city: "",
    country: "Vietnam",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchListing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await api.get(`/listings/${id}`);
      // Seller không được vào checkout hàng của mình
      if (res.data.sellerId?._id === user?._id) {
        navigate(`/listing/${id}`);
        return;
      }
      setListing(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  const shippingCost = 30000;
  const subtotal = listing ? listing.pricing.fixedPrice * quantity : 0;
  const total = subtotal + shippingCost - discountAmount;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherError("");
    setDiscountAmount(0);
    setAppliedVoucher(null);
    setValidatingVoucher(true);
    try {
      const res = await api.post("/vouchers/validate", {
        code: voucherCode.trim(),
        listingId: id,
        subtotal
      });
      if (res.data.success) {
        setDiscountAmount(res.data.data.discountAmount);
        setAppliedVoucher(res.data.data);
      }
    } catch (err) {
      setVoucherError(err.response?.data?.message || "Mã giảm giá không hợp lệ.");
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode("");
    setDiscountAmount(0);
    setAppliedVoucher(null);
    setVoucherError("");
  };

  const handleSubmit = async () => {
    if (
      !address.fullName ||
      !address.phone ||
      !address.street ||
      !address.city
    ) {
      setError("Vui lòng điền đầy đủ địa chỉ giao hàng");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/orders", {
        listingId: id,
        quantity,
        paymentMethod,
        shippingAddress: address,
        voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
      });
      navigate(`/orders/${res.data._id}?success=true`);
    } catch (err) {
      setError(err.response?.data?.message || "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-10 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 h-96 bg-gray-200 rounded-xl" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );

  if (!listing) return null;

  const paymentOptions = [
    {
      value: "COD",
      label: "Cash on Delivery",
      icon: (
        <span className="border border-gray-300 rounded px-2 py-0.5 text-xs font-bold text-gray-700 bg-white">
          COD
        </span>
      ),
    },
    {
      value: "bank_transfer",
      label: "Bank Transfer",
      icon: (
        <span className="border border-gray-300 rounded px-2 py-0.5 text-xs font-bold text-gray-700 bg-white">
          🏦
        </span>
      ),
    },
    {
      value: "paypal",
      label: "PayPal",
      icon: (
        <span className="border border-gray-300 rounded px-2 py-0.5 text-xs font-bold text-blue-700 bg-white">
          PayPal
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* eBay-style checkout header */}
      <div className="w-full max-w-screen-xl mx-auto px-12 py-5 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-semibold leading-none">
            <span className="text-blue-600">e</span>
            <span className="text-red-500">b</span>
            <span className="text-yellow-400">a</span>
            <span className="text-green-500">y</span>
          </span>
          <span className="text-2xl font-medium text-gray-900">Checkout</span>
        </div>
        <button className="text-sm text-gray-500 hover:underline">
          How do you like our checkout?{" "}
          <span className="text-blue-600">Give us feedback</span>
        </button>
      </div>

      <main className="w-full px-12 py-8 max-w-screen-xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-5 gap-12">
          {/* ── LEFT COLUMN ── */}
          <div className="col-span-3 flex flex-col divide-y divide-gray-200">
            {/* 1. Pay with */}
            <section className="pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Pay with
              </h2>
              <div className="flex flex-col gap-3">
                {paymentOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-4 cursor-pointer py-1"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.value}
                      checked={paymentMethod === opt.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    {opt.icon}
                    <span className="text-base text-gray-800">{opt.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* 2. Ship to */}
            <section className="py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">Ship to</h2>
              <div className="flex flex-col gap-3 max-w-md">
                <input
                  type="text"
                  placeholder="Full name *"
                  value={address.fullName}
                  onChange={(e) =>
                    setAddress({ ...address, fullName: e.target.value })
                  }
                  className="border-b border-gray-300 focus:border-blue-500 outline-none py-2 text-base text-gray-800 bg-transparent transition"
                />
                <input
                  type="text"
                  placeholder="Phone number *"
                  value={address.phone}
                  onChange={(e) =>
                    setAddress({ ...address, phone: e.target.value })
                  }
                  className="border-b border-gray-300 focus:border-blue-500 outline-none py-2 text-base text-gray-800 bg-transparent transition"
                />
                <input
                  type="text"
                  placeholder="Street address *"
                  value={address.street}
                  onChange={(e) =>
                    setAddress({ ...address, street: e.target.value })
                  }
                  className="border-b border-gray-300 focus:border-blue-500 outline-none py-2 text-base text-gray-800 bg-transparent transition"
                />
                <input
                  type="text"
                  placeholder="City *"
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                  className="border-b border-gray-300 focus:border-blue-500 outline-none py-2 text-base text-gray-800 bg-transparent transition"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={address.country}
                  onChange={(e) =>
                    setAddress({ ...address, country: e.target.value })
                  }
                  className="border-b border-gray-300 focus:border-blue-500 outline-none py-2 text-base text-gray-800 bg-transparent transition"
                />
              </div>

              {address.fullName && address.street && address.city && (
                <div className="mt-4 text-base text-gray-700 leading-relaxed">
                  <p className="font-medium">{address.fullName}</p>
                  <p>{address.street}</p>
                  <p>
                    {address.city}, {address.country}
                  </p>
                  {address.phone && <p>{address.phone}</p>}
                  <button className="text-blue-600 hover:underline text-sm mt-1">
                    Change
                  </button>
                </div>
              )}
            </section>

            {/* 3. Review order */}
            <section className="py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Review order
              </h2>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {listing.sellerId?.username?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div>
                  <span className="text-base font-semibold text-gray-800 mr-2">
                    {listing.sellerId?.username || "seller"}
                  </span>
                  <span className="text-blue-600 text-sm hover:underline cursor-pointer">
                    Add note for seller
                  </span>
                </div>
              </div>
              <div className="mb-5 ml-12">
                <SellerReputation
                  reputation={listing.sellerReputation}
                  compact
                />
              </div>

              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-800 leading-snug line-clamp-2">
                    {listing.title}
                  </p>
                  <p className="text-base font-bold text-gray-900 mt-1">
                    {formatPrice(listing.pricing.fixedPrice)}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-gray-500">Quantity</span>
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-600"
                      >
                        −
                      </button>
                      <span className="px-3 py-0.5 font-semibold">
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          setQuantity((q) =>
                            Math.min(listing.totalQuantity, q + 1),
                          )
                        }
                        className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-600"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-2">Returns accepted</p>

                  <div className="mt-3">
                    <p className="text-sm font-semibold text-gray-800">
                      Delivery
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Estimated 3–7 business days
                    </p>
                    <p className="text-sm text-gray-600">Standard Shipping</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {formatPrice(shippingCost)}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── RIGHT COLUMN — Order Summary ── */}
          <div className="col-span-2">
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="flex flex-col gap-4 text-base text-gray-700">
                <div className="flex justify-between">
                  <span>Item ({quantity})</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(shippingCost)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Coupon savings ({appliedVoucher?.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-xl border-t border-gray-200 pt-4 mt-1">
                  <span>Order total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Voucher promo input block */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Voucher / Coupon Code</p>
                {appliedVoucher ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-800">
                    <span>Code <strong>{appliedVoucher.code}</strong> applied!</span>
                    <button onClick={handleRemoveVoucher} className="text-xs font-bold text-red-600 hover:underline">Remove</button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        disabled={validatingVoucher}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none uppercase focus:border-blue-600 bg-white"
                      />
                      <button
                        onClick={handleApplyVoucher}
                        disabled={validatingVoucher || !voucherCode.trim()}
                        className="bg-blue-600 text-white font-bold text-xs rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {validatingVoucher ? "..." : "Apply"}
                      </button>
                    </div>
                    {voucherError && (
                      <p className="text-xs text-red-600 mt-1.5">{voucherError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Policy note */}
              <p className="text-sm text-gray-500 mt-5 leading-relaxed">
                By clicking Pay, you agree to our{" "}
                <span className="text-blue-600 cursor-pointer hover:underline">
                  User Agreement
                </span>{" "}
                and acknowledge our{" "}
                <span className="text-blue-600 cursor-pointer hover:underline">
                  Privacy Notice
                </span>
                .
              </p>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-4 rounded-full font-bold text-base mt-6 transition"
              >
                {submitting ? "Placing order..." : "Confirm and pay"}
              </button>

              {/* Money back guarantee */}
              <div className="flex items-center gap-2 mt-5 text-sm text-gray-500">
                <svg
                  className="w-6 h-6 text-blue-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                </svg>
                <span>
                  Purchase protected by{" "}
                  <span className="text-blue-600 cursor-pointer hover:underline font-medium">
                    Money Back Guarantee
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Checkout;
