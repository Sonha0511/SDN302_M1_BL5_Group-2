import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import StarRating from "../../components/StarRating";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function ReviewOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState("positive");
  const [detailedRatings, setDetailedRatings] = useState({
    itemDescription: 5,
    communication: 5,
    shippingTime: 5,
    shippingCost: 5,
  });
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    fetchReviewPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, orderId]);

  const fetchReviewPage = async () => {
    setLoading(true);
    try {
      const [orderRes, reviewRes] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get(`/reviews/order/${orderId}`).catch(() => ({ data: null })),
      ]);
      setOrder(orderRes.data);
      setExistingReview(reviewRes.data);
      if (reviewRes.data) {
        setRating(reviewRes.data.rating);
        setFeedbackType(reviewRes.data.feedbackType || "positive");
        setDetailedRatings({
          itemDescription:
            reviewRes.data.detailedRatings?.itemDescription || 5,
          communication: reviewRes.data.detailedRatings?.communication || 5,
          shippingTime: reviewRes.data.detailedRatings?.shippingTime || 5,
          shippingCost: reviewRes.data.detailedRatings?.shippingCost || 5,
        });
        setComment(reviewRes.data.comment);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Vui lòng nhập nhận xét của bạn");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/reviews", {
        orderId,
        rating,
        feedbackType,
        detailedRatings,
        comment,
      });
      setExistingReview(res.data);
      navigate(`/listing/${order.listingId?._id || order.listingId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Gửi đánh giá thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-10 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="bg-white border border-gray-200 rounded-xl h-96" />
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-500 mb-4">{error || "Order not found"}</p>
          <Link to="/listings" className="text-blue-600 hover:underline">
            Back to listings
          </Link>
        </main>
      </div>
    );
  }

  const listing = order.listingId;
  const isBuyer = order.buyerId?._id === user?._id;
  const canReview =
    isBuyer && order.status === "delivered" && !existingReview && !order.isReviewed;
  const feedbackOptions = [
    { value: "positive", label: "Positive" },
    { value: "neutral", label: "Neutral" },
    { value: "negative", label: "Negative" },
  ];
  const detailedRatingFields = [
    { key: "itemDescription", label: "Item description" },
    { key: "communication", label: "Seller communication" },
    { key: "shippingTime", label: "Shipping time" },
    { key: "shippingCost", label: "Shipping cost" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link to={`/listing/${listing?._id || listing}`} className="text-sm text-blue-600 hover:underline">
            Back to item
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Leave feedback
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex gap-4 pb-6 border-b border-gray-200">
            <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden">
              {order.listingImage || listing?.images?.[0] ? (
                <img
                  src={order.listingImage || listing.images[0]}
                  alt={order.listingTitle || listing?.title}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-1">Verified purchase</p>
              <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {order.listingTitle || listing?.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Sold by{" "}
                <span className="text-blue-600">
                  {order.sellerId?.username || "seller"}
                </span>
              </p>
              <span className="inline-flex mt-3 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600 capitalize">
                {order.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {existingReview ? (
            <div className="pt-6">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                You already left feedback for this order.
              </p>
              <span className="inline-flex mb-3 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700 capitalize">
                {existingReview.feedbackType || "positive"}
              </span>
              <StarRating value={existingReview.rating} size="md" />
              <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                {existingReview.comment}
              </p>
            </div>
          ) : !isBuyer ? (
            <div className="pt-6">
              <p className="text-base font-semibold text-gray-900">
                Only the buyer can leave feedback for this order.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Sellers can view feedback after the buyer submits it.
              </p>
            </div>
          ) : order.isReviewed ? (
            <div className="pt-6">
              <p className="text-base font-semibold text-gray-900">
                Feedback has already been left for this order.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Each delivered order can receive one verified purchase review.
              </p>
            </div>
          ) : order.status !== "delivered" ? (
            <div className="pt-6">
              <p className="text-base font-semibold text-gray-900">
                You can review this item after it's delivered.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                eBay-style feedback is available only for completed purchases.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Overall feedback
              </label>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {feedbackOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFeedbackType(option.value)}
                    className={`border rounded-full py-2 text-sm font-semibold transition ${
                      feedbackType === option.value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:border-blue-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-semibold text-gray-800 mb-2">
                How was this item?
              </label>
              <StarRating
                value={rating}
                size="lg"
                interactive
                onChange={setRating}
                className="mb-5"
              />

              <div className="border border-gray-200 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Detailed seller ratings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {detailedRatingFields.map((field) => (
                    <div key={field.key}>
                      <p className="text-xs font-medium text-gray-600 mb-1">
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

              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Tell other buyers about your experience
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                rows={6}
                placeholder="Share details about the item condition, shipping, and overall experience."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Your feedback will appear as a verified purchase review.
                </p>
                <span className="text-xs text-gray-400">
                  {comment.length}/1000
                </span>
              </div>

              <button
                type="submit"
                disabled={!canReview || submitting}
                className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-full font-semibold text-sm transition"
              >
                {submitting ? "Submitting..." : "Leave feedback"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default ReviewOrder;
