import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import StarRating from "../../components/StarRating";
import SellerReputation from "../../components/SellerReputation";
import ChatWidget from "../../components/ChatWidget";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price,
  );

const conditionLabel = {
  new: "Brand New",
  like_new: "Like New",
  good: "Good",
  acceptable: "Acceptable",
};

function RatingSummary({ title, reviews, averageRating, reviewCount, onWriteReview }) {
  const distribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((review) => review.rating === rating).length;
    const percent = reviewCount ? Math.round((count / reviewCount) * 100) : 0;
    return { rating, count, percent };
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Customer reviews for {title}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-[190px_1fr] gap-8 items-center">
        <div className="text-center lg:border-r lg:border-gray-100 lg:pr-8">
          <div className="flex items-end justify-center gap-1">
            <span className="text-5xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-lg font-semibold text-gray-400 mb-1">/5</span>
          </div>
          <StarRating value={averageRating} size="md" className="mt-2" />
          <p className="text-sm text-gray-600 mt-3">
            {reviewCount} customer review{reviewCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="space-y-3">
          {distribution.map((item) => (
            <div key={item.rating} className="grid grid-cols-[42px_1fr_44px] gap-3 items-center">
              <div className="flex items-center justify-end gap-1 text-sm font-medium text-gray-700">
                <span>{item.rating}</span>
                <span className="text-amber-400">{"\u2605"}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {item.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex justify-center">
        <button
          type="button"
          onClick={onWriteReview}
          className="w-full max-w-md rounded-lg bg-blue-600 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-blue-700"
        >
          Write a review
        </button>
      </div>
    </div>
  );
}

function DetailedSellerRatings({ reputation }) {
  const details = reputation?.detailedRatings || {};
  const rows = [
    { key: "itemDescription", label: "Item description" },
    { key: "communication", label: "Communication" },
    { key: "shippingTime", label: "Shipping time" },
    { key: "shippingCost", label: "Shipping cost" },
  ];

  if (!reputation?.totalReviews) return null;

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
      {rows.map((row) => (
        <div key={row.key}>
          <p className="text-xs font-medium text-gray-500">{row.label}</p>
          <div className="mt-1 flex items-center gap-2">
            <StarRating value={details[row.key] || 0} />
            <span className="text-sm font-semibold text-gray-800">
              {(details[row.key] || 0).toFixed(1)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RatingPicker({ value, onChange }) {
  const labels = ["Very bad", "Bad", "Okay", "Good", "Excellent"];

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {labels.map((label, index) => {
        const ratingValue = index + 1;
        const selected = value === ratingValue;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(ratingValue)}
            className={`h-24 rounded-xl border px-2 transition ${
              selected
                ? "border-amber-400 bg-amber-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/60"
            }`}
          >
            <span
              className={`block text-4xl leading-none ${
                selected ? "text-amber-400" : "text-gray-300"
              }`}
            >
              {"\u2605"}
            </span>
            <span
              className={`mt-2 block text-xs font-semibold ${
                selected ? "text-amber-600" : "text-gray-500"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ProductReviewModal({ listing, user, onClose, onSubmitted }) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState("positive");
  const [detailedRatings, setDetailedRatings] = useState({
    itemDescription: 5,
    communication: 5,
    shippingTime: 5,
    shippingCost: 5,
  });
  const [comment, setComment] = useState("");
  const [eligibleOrder, setEligibleOrder] = useState(null);
  const [checkingOrder, setCheckingOrder] = useState(Boolean(user));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const findEligibleOrder = async () => {
      setCheckingOrder(true);
      try {
        const res = await api.get("/orders/my");
        const order = res.data.find((item) => {
          const itemListingId = item.listingId?._id || item.listingId;
          return (
            itemListingId === listing._id &&
            item.status === "delivered" &&
            !item.isReviewed
          );
        });
        setEligibleOrder(order || null);
      } catch (err) {
        setError(err.response?.data?.message || "Cannot check your order.");
      } finally {
        setCheckingOrder(false);
      }
    };

    findEligibleOrder();
  }, [listing._id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!eligibleOrder) {
      setError("You can review this product after a delivered purchase.");
      return;
    }
    if (!comment.trim()) {
      setError("Please write your review before submitting.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await api.post("/reviews", {
        orderId: eligibleOrder._id,
        rating,
        feedbackType,
        detailedRatings,
        comment: comment.trim(),
      });
      await onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Submit review failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Review product</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close review form"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
              {listing.images?.[0] ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <span className="text-xs text-gray-400">No image</span>
              )}
            </div>
            <h3 className="mx-auto max-w-2xl text-xl font-bold text-gray-900">
              {listing.title}
            </h3>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-gray-700">
              Overall feedback
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "positive", label: "Positive" },
                { value: "neutral", label: "Neutral" },
                { value: "negative", label: "Negative" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFeedbackType(option.value)}
                  className={`rounded-full border py-2 text-sm font-semibold transition ${
                    feedbackType === option.value
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-700 hover:border-blue-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-center text-sm font-semibold text-gray-700">
              How would you rate this product?
            </p>
            <RatingPicker value={rating} onChange={setRating} />
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-800">
              Detailed seller ratings
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { key: "itemDescription", label: "Item description" },
                { key: "communication", label: "Seller communication" },
                { key: "shippingTime", label: "Shipping time" },
                { key: "shippingCost", label: "Shipping cost" },
              ].map((field) => (
                <div key={field.key}>
                  <p className="mb-1 text-xs font-medium text-gray-600">
                    {field.label}
                  </p>
                  <StarRating
                    value={detailedRatings[field.key]}
                    interactive
                    onChange={(value) =>
                      setDetailedRatings((prev) => ({
                        ...prev,
                        [field.key]: value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={5}
            placeholder="Share more about your experience..."
            disabled={user && !checkingOrder && !eligibleOrder}
            className="mt-6 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />

          {!user && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Please sign in before writing a review.
            </p>
          )}
          {user && checkingOrder && (
            <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Checking your delivered order...
            </p>
          )}
          {user && !checkingOrder && !eligibleOrder && (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">
                Review is available after delivery
              </p>
              <p className="mt-1 text-sm text-amber-700">
                This account does not have a delivered, unreviewed order for this product yet.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate(`/checkout/${listing._id}`)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Buy this product
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/my-orders")}
                  className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-300"
                >
                  Check my orders
                </button>
              </div>
            </div>
          )}
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || checkingOrder || (user && !eligibleOrder)}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
          >
            {submitting
              ? "Submitting..."
              : user && !checkingOrder && !eligibleOrder
                ? "No eligible order"
                : "Submit review"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");

  useEffect(() => {
    fetchListing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchListing = async () => {
    try {
      const [listingRes, reviewRes] = await Promise.all([
        api.get(`/listings/${id}`),
        api.get(`/reviews/listing/${id}`).catch(() => ({ data: [] })),
      ]);
      setListing(listingRes.data);
      setReviews(reviewRes.data);
      try {
        const voucherRes = await api.get(`/vouchers/listing/${id}`);
        if (voucherRes.data.success) setVouchers(voucherRes.data.data);
      } catch (_) {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-screen-2xl mx-auto px-6 py-10 animate-pulse">
          <div className="grid grid-cols-2 gap-10">
            <div className="bg-gray-200 rounded-xl h-[600px]" />
            <div className="space-y-4">
              <div className="bg-gray-200 h-8 rounded w-3/4" />
              <div className="bg-gray-200 h-6 rounded w-1/2" />
              <div className="bg-gray-200 h-10 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">😕</p>
          <p>Listing not found</p>
        </div>
      </div>
    );
  }

  const reviewCount = listing.reviews?.reviewCount || reviews.length;
  const averageRating =
    listing.reviews?.averageRating ||
    (reviews.length
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : 0);
  const sellerId = listing.sellerId?._id || listing.sellerId;
  const isOwnListing = String(user?._id || "") === String(sellerId || "");
  const isUnavailable =
    listing.status !== "active" || Number(listing.totalQuantity) <= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex gap-2">
          <Link to="/" className="hover:underline text-blue-600">
            Home
          </Link>
          <span>›</span>
          <Link to="/listings" className="hover:underline text-blue-600">
            All Listings
          </Link>
          <span>›</span>
          <span className="text-gray-700 line-clamp-1">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white rounded-xl p-6 shadow-sm mb-6">
          {/* Left - Images */}
          <div className="flex flex-col">
            <div className="relative w-full h-[520px] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center mb-3">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[selectedImage]}
                  alt={listing.title}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="text-gray-400 text-sm">No image</div>
              )}
            </div>

            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {listing.images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 ${
                      selectedImage === i
                        ? "border-blue-500"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Right - Info */}
          <div className="flex flex-col gap-4">
            {/* Condition */}
            <span className="text-xs text-gray-500">
              Condition:{" "}
              <span className="font-semibold text-gray-700">
                {conditionLabel[listing.condition] || listing.condition}
              </span>
            </span>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">
              {listing.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              {reviewCount > 0 ? (
                <>
                  <StarRating value={averageRating} size="md" />
                  <span className="font-semibold text-gray-800">
                    {averageRating.toFixed(1)}
                  </span>
                  <a href="#reviews" className="text-blue-600 hover:underline">
                    {reviewCount} review{reviewCount > 1 ? "s" : ""}
                  </a>
                </>
              ) : (
                <span className="text-gray-400">No reviews yet</span>
              )}
              {!isOwnListing && (
                <ChatWidget
                  sellerId={sellerId}
                  sellerName={
                    listing.sellerId?.sellerProfile?.storeName ||
                    listing.sellerId?.username ||
                    "seller"
                  }
                  sellerReputation={listing.sellerReputation}
                  listingId={listing._id}
                  listingTitle={listing.title}
                  listingPrice={formatPrice(listing.pricing.fixedPrice)}
                  listingImage={listing.images?.[0]}
                  buttonStyle="small"
                />
              )}
            </div>

            {/* Price */}
            <div className="py-2">
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(listing.pricing.fixedPrice)}
              </p>
            </div>

            {/* Available Vouchers / Coupons */}
            {vouchers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Available coupons</p>
                {vouchers.map((v) => (
                  <div
                    key={v._id}
                    className="flex items-center justify-between gap-3 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/60 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-blue-600 text-lg flex-shrink-0">🎫</span>
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-sm text-blue-800 uppercase">{v.code}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {v.discountType === "percentage" ? `${v.discountValue}% off` : `${formatPrice(v.discountValue)} off`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(v.code);
                        setCopiedCode(v.code);
                        setTimeout(() => setCopiedCode(""), 2000);
                      }}
                      className="flex-shrink-0 rounded-full border border-blue-500 bg-white px-3 py-1 text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition"
                    >
                      {copiedCode === v.code ? "Copied!" : "Copy code"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Shipping */}
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 font-semibold">Shipping:</span>
                <span className="text-green-600 font-semibold">
                  Free shipping
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Returns:</span>
                <span>30 days returns</span>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-semibold">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(listing.totalQuantity, q + 1))
                  }
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-400">
                {listing.totalQuantity} available
              </span>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              {isOwnListing ? (
                <div className="w-full bg-gray-100 text-gray-500 py-3 rounded-full font-semibold text-sm text-center">
                  This is your listing
                </div>
              ) : isUnavailable ? (
                <div className="w-full bg-red-50 text-red-600 py-3 rounded-full font-semibold text-sm text-center">
                  This item is currently unavailable
                </div>
              ) : (
                <>
                  <button
                    onClick={() => navigate(`/checkout/${listing._id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-semibold text-sm transition"
                  >
                    Buy It Now
                  </button>
                  <button className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-full font-semibold text-sm transition">
                    Add to cart
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Item description
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {listing.description || "No description provided."}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-gray-100">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 overflow-hidden rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
                {listing.sellerId?.avatar ? (
                  <img
                    src={listing.sellerId.avatar}
                    alt={listing.sellerId?.username || "seller"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  listing.sellerId?.username?.charAt(0)?.toUpperCase() || "S"
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                </p>
                <Link
                  to={`/seller/${listing.sellerId?._id}`}
                  className="mt-1 inline-block text-lg font-bold text-gray-900 hover:text-blue-600"
                >
                  {listing.sellerId?.sellerProfile?.storeName ||
                    listing.sellerId?.username ||
                    "seller"}
                </Link>
                <p className="text-xs text-gray-400">
                  @{listing.sellerId?.username || "seller"}
                </p>
                <div className="mt-1">
                  <SellerReputation reputation={listing.sellerReputation} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                to={`/seller/${listing.sellerId?._id}`}
                className="rounded-full border border-gray-300 px-5 py-2 text-center text-sm font-semibold text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
              >
                View seller profile
              </Link>
            </div>
          </div>
          <DetailedSellerRatings reputation={listing.sellerReputation} />
        </div>

        {/* Reviews section */}
        <div id="reviews" className="space-y-5">
          <RatingSummary
            title={listing.title}
            reviews={reviews}
            averageRating={averageRating}
            reviewCount={reviewCount}
            onWriteReview={() => setShowReviewModal(true)}
          />

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Customer feedback
              </h2>
              <span className="text-sm text-gray-500">
                {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </span>
            </div>

            {reviewCount > 0 ? (
              <div className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <div key={review._id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                            {(review.buyerId?.username || "B")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {review.buyerId?.username || "buyer"}
                            </p>
                            <div className="mt-1">
                              <StarRating value={review.rating} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-700">
                        {review.feedbackType || "positive"}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mt-3 ml-12">
                      {review.comment}
                    </p>
                    {review.detailedRatings && (
                      <div className="ml-12 mt-3 grid grid-cols-1 gap-2 text-xs text-gray-500 sm:grid-cols-2 lg:grid-cols-4">
                        <span>Item: {review.detailedRatings.itemDescription || "-"} / 5</span>
                        <span>Communication: {review.detailedRatings.communication || "-"} / 5</span>
                        <span>Shipping time: {review.detailedRatings.shippingTime || "-"} / 5</span>
                        <span>Shipping cost: {review.detailedRatings.shippingCost || "-"} / 5</span>
                      </div>
                    )}
                    {review.isVerifiedPurchase && (
                      <p className="text-xs font-medium text-green-700 mt-2 ml-12">
                        Verified purchase
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                <p className="text-sm font-semibold text-gray-700">
                  No reviews yet
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Buyers can write a review from their orders after delivery.
                </p>
              </div>
            )}
          </div>
        </div>
        {showReviewModal && (
          <ProductReviewModal
            listing={listing}
            user={user}
            onClose={() => setShowReviewModal(false)}
            onSubmitted={fetchListing}
          />
        )}
      </main>
    </div>
  );
}

export default ProductDetail;
