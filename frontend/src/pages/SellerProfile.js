import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import SellerReputation from "../components/SellerReputation";
import StarRating from "../components/StarRating";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const MAX_LENGTHS = { name: 60, username: 30, storeName: 60, bio: 500, phone: 20, location: 80, shippingFrom: 80 };
const initialForm = {
  name: "", username: "", storeName: "", bio: "", phone: "", location: "",
  businessType: "Individual", responseTime: "Within 24 hours", returnPolicy: "30-day returns", shippingFrom: "",
};

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price || 0,
  );

const formatJoinDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

function FieldError({ message }) {
  return message ? <p className="mt-1 text-xs font-normal text-red-600" role="alert">{message}</p> : null;
}

const fieldClass = (hasError) => `mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:ring-1 ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`;

function SellerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    storeName: "",
    bio: "",
    phone: "",
    location: "",
    businessType: "Individual",
    responseTime: "Within 24 hours",
    returnPolicy: "30-day returns",
    shippingFrom: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const setProfileForm = (sellerData) => {
    const sellerProfile = sellerData.sellerProfile || {};
    setFormData({
      ...initialForm,
      name: sellerData.name || "", username: sellerData.username || "",
      storeName: sellerProfile.storeName || "", bio: sellerProfile.bio || "",
      phone: sellerProfile.phone || "", location: sellerProfile.location || "",
      businessType: sellerProfile.businessType || "Individual",
      responseTime: sellerProfile.responseTime || "Within 24 hours",
      returnPolicy: sellerProfile.returnPolicy || "30-day returns",
      shippingFrom: sellerProfile.shippingFrom || "",
    });
    setAvatarFile(null);
    setAvatarPreview(sellerData.avatar || "");
    setFieldErrors({});
  };

  const loadProfile = () =>
    api
      .get(`/seller/${id}/profile`)
      .then((res) => {
        setProfile(res.data.data);
        setProfileForm(res.data.data.seller);
      })
      .catch((err) => console.error("Error loading seller profile:", err))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    const trimmed = Object.fromEntries(Object.entries(formData).map(([key, value]) => [key, value.trim()]));
    if (!trimmed.name) errors.name = "Your name is required.";
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(trimmed.username)) errors.username = "Use 3-30 letters, numbers, dots, underscores or hyphens.";
    if (!trimmed.storeName) errors.storeName = "Add a store name so buyers can recognize you.";
    if (trimmed.phone && !/^\+?[0-9 ()-]{8,20}$/.test(trimmed.phone)) errors.phone = "Enter a valid phone number.";
    Object.entries(MAX_LENGTHS).forEach(([field, max]) => { if (trimmed[field].length > max) errors[field] = `Keep this under ${max} characters.`; });
    setFieldErrors(errors);
    return { valid: Object.keys(errors).length === 0, trimmed };
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, avatar: "Choose an image up to 5 MB." }));
      e.target.value = "";
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setFieldErrors((prev) => ({ ...prev, avatar: "" }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError("");
    const validation = validateForm();
    if (!validation.valid) return;
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(validation.trimmed).forEach(([key, value]) => data.append(key, value));
      if (avatarFile) data.append("avatar", avatarFile);
      await api.patch("/seller/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadProfile();
      setEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || "Update profile failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleEditing = () => {
    if (editing) {
      setProfileForm(profile.seller);
      setEditError("");
    }
    setEditing((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="h-48 rounded-xl border border-gray-200 bg-white animate-pulse" />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-16 text-center text-gray-400">
          Seller not found
        </main>
      </div>
    );
  }

  const { seller, reputation, listings, reviews } = profile;
  const sellerInfo = seller.sellerProfile || {};
  const displayName = sellerInfo.storeName || seller.username;
  const isOwnProfile = user?._id === seller._id;
  const averageRating = reputation.averageRating
    ? reputation.averageRating.toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white mb-6">
          <div className="h-2 bg-blue-600" />
          <div className="px-6 pb-6">
            <div className="flex flex-col gap-6 pt-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-end gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-blue-700 flex items-center justify-center text-2xl font-bold text-white shadow-sm">
                  {seller.avatar ? (
                    <img
                      src={seller.avatar}
                      alt={seller.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    seller.username?.charAt(0)?.toUpperCase() || "S"
                  )}
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {displayName}
                    </h1>
                    {reputation.badge && (
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {reputation.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    @{seller.username} · {seller.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Seller since {formatJoinDate(seller.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pb-1 sm:items-end">
                <SellerReputation reputation={reputation} />
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={toggleEditing}
                    className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
                  >
                    {editing ? "Cancel editing" : "Edit profile"}
                  </button>
                )}
              </div>
            </div>

            {editing && (
              <form
                onSubmit={handleSaveProfile}
                className="mt-6 rounded-xl border border-blue-100 bg-blue-50/40 p-4"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700 md:col-span-2">
                    Store avatar
                    {avatarPreview && (
                      <img src={avatarPreview} alt="Store avatar preview" className="mb-2 h-16 w-16 rounded-full object-cover ring-2 ring-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600"
                    />
                    <span className="mt-1 block text-xs font-normal text-gray-500">JPG, PNG or WebP, up to 5 MB.</span>
                    {fieldErrors.avatar && <span className="mt-1 block text-xs font-normal text-red-600">{fieldErrors.avatar}</span>}
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Display name
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={MAX_LENGTHS.name}
                      aria-invalid={Boolean(fieldErrors.name)}
                      className={fieldClass(fieldErrors.name)}
                    />
                    <FieldError message={fieldErrors.name} />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Username
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      maxLength={MAX_LENGTHS.username}
                      aria-invalid={Boolean(fieldErrors.username)}
                      className={fieldClass(fieldErrors.username)}
                    />
                    <FieldError message={fieldErrors.username} />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Store name
                    <input
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      maxLength={MAX_LENGTHS.storeName}
                      aria-invalid={Boolean(fieldErrors.storeName)}
                      className={fieldClass(fieldErrors.storeName)}
                    />
                    <FieldError message={fieldErrors.storeName} />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Phone
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={MAX_LENGTHS.phone}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      className={fieldClass(fieldErrors.phone)}
                    />
                    <FieldError message={fieldErrors.phone} />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Location
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      maxLength={MAX_LENGTHS.location}
                      className={fieldClass(fieldErrors.location)}
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Business type
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option>Individual</option>
                      <option>Business</option>
                      <option>Authorized reseller</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Response time
                    <select
                      id="seller-response-time"
                      name="responseTime"
                      value={formData.responseTime}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option>Within 24 hours</option><option>Within 2 business days</option><option>Within 3 business days</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Return policy
                    <input
                      name="returnPolicy"
                      value={formData.returnPolicy}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Ships from
                    <input
                      name="shippingFrom"
                      value={formData.shippingFrom}
                      onChange={handleChange}
                      maxLength={MAX_LENGTHS.shippingFrom}
                      className={fieldClass(fieldErrors.shippingFrom)}
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 md:col-span-2">
                    Store bio
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={3}
                      maxLength={MAX_LENGTHS.bio}
                      className={fieldClass(fieldErrors.bio) + " resize-none"}
                    />
                    <FieldError message={fieldErrors.bio} />
                  </label>
                </div>
                {editError && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {editError}
                  </p>
                )}
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {saving ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Positive feedback"
                value={`${reputation.positiveFeedbackPercent}%`}
                helper={`${reputation.positiveReviews}/${reputation.totalReviews} positive`}
              />
              <StatCard
                label="Average rating"
                value={averageRating}
                helper={`${reputation.totalReviews} feedback`}
              />
              <StatCard
                label="Active listings"
                value={listings.length}
                helper="Available now"
              />
              <StatCard
                label="Total feedback"
                value={reputation.totalReviews}
                helper="Verified purchases"
              />
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.25fr_1fr]">
                <div>
                <p className="text-sm font-semibold text-gray-900">About this seller</p>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {sellerInfo.bio ||
                    "This seller has not added a store introduction yet."}
                </p>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Location</span>
                  <span className="text-right font-medium text-gray-900">
                    {sellerInfo.location || "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Ships from</span>
                  <span className="text-right font-medium text-gray-900">
                    {sellerInfo.shippingFrom || "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Response</span>
                  <span className="text-right font-medium text-gray-900">
                    {sellerInfo.responseTime || "Within 24 hours"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Returns</span>
                  <span className="text-right font-medium text-gray-900">
                    {sellerInfo.returnPolicy || "30-day returns"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Type</span>
                  <span className="text-right font-medium text-gray-900">
                    {sellerInfo.businessType || "Individual"}
                  </span>
                </div>
                {sellerInfo.phone && (
                  <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Phone</span>
                    <span className="text-right font-medium text-gray-900">
                      {sellerInfo.phone}
                    </span>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Active listings</h2>
            <span className="text-sm text-gray-500">{listings.length} items</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
                No active listings.
              </div>
            ) : (
              listings.map((listing) => (
                <Link
                  key={listing._id}
                  to={`/listing/${listing._id}`}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="h-48 bg-gray-50 flex items-center justify-center">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="h-full w-full object-contain p-4 transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <span className="text-sm text-gray-400">No image</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="min-h-[40px] text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600">
                      {listing.title}
                    </p>
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      {formatPrice(listing.pricing?.fixedPrice)}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>{listing.totalQuantity} available</span>
                      <SellerReputation reputation={reputation} badgeOnly />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent feedback</h2>
            <span className="text-sm text-gray-500">
              {reviews.length} latest
            </span>
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">No feedback yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <div key={review._id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                        {(review.buyerId?.username || "B").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {review.buyerId?.username || "buyer"}
                        </p>
                        <StarRating value={review.rating} className="mt-1" />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="mt-3 pl-12 text-sm leading-relaxed text-gray-600">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default SellerProfile;
