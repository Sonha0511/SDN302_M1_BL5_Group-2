import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function SellerRegisterNotice() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();

  const [storeName, setStoreName] = useState(
    user?.name ? `${user.name}'s Store` : ""
  );
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("Individual");
  const [shippingFrom, setShippingFrom] = useState("Vietnam");
  const [returnPolicy, setReturnPolicy] = useState("30-day returns");
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleActivateSeller = async (e) => {
    e?.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    if (!agreedTerms) {
      setError("Please accept the eBay Seller Agreement to continue.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await api.post("/auth/become-seller", {
        storeName: storeName.trim() || `${user.name}'s Store`,
        phone: phone.trim(),
        businessType,
        shippingFrom,
        returnPolicy,
      });

      if (res.data?.success) {
        updateUser(res.data.user, res.data.token);
        setSuccess(true);
        setTimeout(() => {
          navigate("/sell/start");
        }, 1200);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred while activating your seller account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7] font-sans text-gray-900">
      {/* Official eBay Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-3xl font-bold italic tracking-tighter">
              <span className="text-[#e53238]">e</span>
              <span className="text-[#0064d2]">b</span>
              <span className="text-[#f5af02]">a</span>
              <span className="text-[#86b817]">y</span>
            </Link>
            <div className="h-6 w-[1px] bg-gray-300"></div>
            <span className="text-sm font-semibold text-gray-600">
              Seller Hub Onboarding
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs text-gray-600">
            {user ? (
              <span className="hidden sm:inline">
                Hi, <strong className="text-gray-900">{user.name}</strong>!
              </span>
            ) : null}
            <Link
              to="/sell"
              className="font-medium text-gray-700 hover:text-blue-600 hover:underline"
            >
              Selling Overview
            </Link>
            <Link
              to="/"
              className="rounded-full border border-gray-300 px-4 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
        {/* Progress Step Bar */}
        <div className="mb-8 hidden sm:flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <div className="flex items-center gap-2 text-green-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold">
              ✓
            </span>
            <span>1. Buyer Account</span>
          </div>
          <span className="text-gray-300">———</span>
          <div className="flex items-center gap-2 text-blue-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              2
            </span>
            <span>2. Seller Registration</span>
          </div>
          <span className="text-gray-300">———</span>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
              3
            </span>
            <span>3. List Products</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Card Banner Header */}
          <div className="bg-[#191919] px-8 py-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block rounded-md bg-blue-600/30 border border-blue-400/40 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-300">
                  Seller Account Verification Required
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-white">
                  Set Up Your eBay Seller Account
                </h1>
                <p className="mt-1.5 text-sm text-gray-300 max-w-xl leading-relaxed">
                  Only registered and verified sellers can publish listings and manage inventory. Complete the quick setup below to activate your selling privileges.
                </p>
              </div>
              <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur border border-white/10">
                🏪
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {/* Current Account Status Box */}
            <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 font-bold text-amber-900">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-gray-900">
                        {user?.name || "Guest User"}
                      </p>
                      <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                        Current Role: {user ? (user.role === "buyer" ? "Buyer" : user.role) : "Not Logged In"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {user?.email || "Please log in to your account first"}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-amber-200/80">
                  🔒 <span className="font-semibold text-gray-800">Marketplace Policy:</span> Listing items requires an active Seller profile.
                </div>
              </div>
            </div>

            {/* Success Notification */}
            {success ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-900">
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-lg font-bold">Seller Privileges Activated!</h2>
                <p className="mt-1 text-sm text-green-700">
                  Redirecting you to the listing creator in a moment...
                </p>
              </div>
            ) : (
              <div>
                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-2.5">
                    <span className="text-base">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Seller Activation Form */}
                <form onSubmit={handleActivateSeller} className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Seller & Store Information
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      These details will be displayed to buyers on your store profile and listings.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Store Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="e.g. Vintage Vault Official"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#0064d2] focus:ring-1 focus:ring-[#0064d2] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Contact Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+84 901 234 567"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#0064d2] focus:ring-1 focus:ring-[#0064d2] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Business Entity Type
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[#0064d2] focus:ring-1 focus:ring-[#0064d2] transition"
                      >
                        <option value="Individual">Individual / Casual Seller</option>
                        <option value="Business">Registered Business / Company</option>
                        <option value="Authorized reseller">Authorized Reseller</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Shipping Location
                      </label>
                      <input
                        type="text"
                        value={shippingFrom}
                        onChange={(e) => setShippingFrom(e.target.value)}
                        placeholder="e.g. Ho Chi Minh City, Vietnam"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#0064d2] focus:ring-1 focus:ring-[#0064d2] transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Default Return Policy
                      </label>
                      <select
                        value={returnPolicy}
                        onChange={(e) => setReturnPolicy(e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[#0064d2] focus:ring-1 focus:ring-[#0064d2] transition"
                      >
                        <option value="30-day returns">30-day returns (eBay Recommended - Attracts more buyers)</option>
                        <option value="14-day returns">14-day returns</option>
                        <option value="No returns">No returns accepted</option>
                      </select>
                    </div>
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600 leading-relaxed">
                        I agree to the{" "}
                        <Link to="/user-agreement" className="font-semibold text-blue-600 hover:underline">
                          eBay Seller Agreement
                        </Link>
                        ,{" "}
                        <Link to="/privacy-notice" className="font-semibold text-blue-600 hover:underline">
                          Payments Terms of Use
                        </Link>
                        , and marketplace selling standards.
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {user ? (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 rounded-full bg-[#0064d2] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#0053a0] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            <span>Activating Seller Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Activate Seller Account & Start Listing</span>
                            <span>→</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        className="flex-1 rounded-full bg-[#0064d2] px-8 py-3.5 text-center text-sm font-bold text-white hover:bg-[#0053a0] transition shadow-sm"
                      >
                        Sign in to Activate Seller Account
                      </Link>
                    )}

                    <Link
                      to="/register"
                      className="rounded-full border border-gray-300 bg-white px-6 py-3.5 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center"
                    >
                      Create New Account
                    </Link>
                  </div>
                </form>
              </div>
            )}

            {/* eBay Seller Guarantees & Features */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <div className="text-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Why Sell on eBay?
                </h3>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  Built-in protection and professional seller tools
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-600 mb-3">
                    🛡️
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">Seller Protection</h4>
                  <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                    Automated safeguards against abusive buyers, false claims, and payment disputes.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-xl text-amber-600 mb-3">
                    ⚡
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">Streamlined Listings</h4>
                  <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                    Upload photos, optimize pricing with smart recommendations, and publish in seconds.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-xl text-green-600 mb-3">
                    📊
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">Seller Hub Tools</h4>
                  <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                    Manage inventory, print packing slips, process orders, and review sales analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Official eBay Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-6 text-xs text-gray-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p>Copyright © 1995–2026 eBay Inc. All Rights Reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/user-agreement" className="hover:underline">
              User Agreement
            </Link>
            <Link to="/privacy-notice" className="hover:underline">
              Privacy Notice
            </Link>
            <Link to="/" className="hover:underline">
              Cookies
            </Link>
            <Link to="/sell" className="hover:underline">
              Seller Center
            </Link>
            <Link to="/" className="hover:underline">
              Help & Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SellerRegisterNotice;
