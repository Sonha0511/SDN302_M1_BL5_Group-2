import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SellerHubHeader from "../components/SellerHubHeader";
import StarRating from "../components/StarRating";
import { useAuth } from "../context/AuthContext";
import { getMySellerReviews, respondToReview } from "../services/sellerService";

const feedbackTypes = ["all", "positive", "neutral", "negative"];

export default function SellerFeedback() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("all");
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");

  const loadReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getMySellerReviews();
      setReviews(response.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return navigate("/login");
    if (user.role !== "seller") return navigate("/sell");
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const filteredReviews = useMemo(
    () => reviews.filter((review) => filter === "all" || review.feedbackType === filter),
    [filter, reviews],
  );

  const submitResponse = async (reviewId) => {
    const comment = (drafts[reviewId] || "").trim();
    if (!comment) {
      setError("Please enter a response before posting.");
      return;
    }
    setSubmittingId(reviewId);
    setError("");
    try {
      const response = await respondToReview(reviewId, comment);
      setReviews((current) => current.map((review) => review._id === reviewId ? response.data : review));
      setDrafts((current) => ({ ...current, [reviewId]: "" }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to post the seller response.");
    } finally {
      setSubmittingId("");
    }
  };

  if (authLoading || !user || user.role !== "seller") return null;

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <SellerHubHeader active="feedback" user={user} />
      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Feedback</h1>
            <p className="mt-2 text-sm text-gray-600">Read buyer feedback and post one public response for each transaction.</p>
          </div>
          <p className="text-sm font-semibold text-gray-700">{reviews.length} total feedback</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {feedbackTypes.map((type) => (
            <button key={type} onClick={() => setFilter(type)} className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize ${filter === type ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700"}`}>
              {type}
            </button>
          ))}
        </div>

        {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 rounded-xl border border-gray-200 bg-white">
          {loading ? <div className="h-80 animate-pulse bg-gray-100" /> : filteredReviews.length ? (
            <div className="divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <article key={review._id} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{review.buyerId?.username || "Buyer"}</p>
                      <div className="mt-1 flex items-center gap-3"><StarRating value={review.rating} /><span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</span></div>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold capitalize">{review.feedbackType}</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-gray-700">{review.comment}</p>
                  <Link to={`/listing/${review.listingId?._id || review.listingId}`} className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline">View item: {review.listingId?.title || "Listing"}</Link>

                  {review.sellerResponse?.comment ? (
                    <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-800">Your public response</p>
                      <p className="mt-1 text-sm text-gray-700">{review.sellerResponse.comment}</p>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <label className="text-sm font-bold text-gray-800">Public response to buyer</label>
                      <textarea value={drafts[review._id] || ""} onChange={(event) => setDrafts((current) => ({ ...current, [review._id]: event.target.value }))} maxLength={500} rows={3} placeholder="Thank the buyer or provide a helpful resolution. This response is public and cannot be edited." className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" />
                      <div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-gray-500">{(drafts[review._id] || "").length}/500 · One response only</span><button onClick={() => submitResponse(review._id)} disabled={submittingId === review._id} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:bg-gray-400">{submittingId === review._id ? "Posting..." : "Post response"}</button></div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : <div className="p-12 text-center text-sm text-gray-500">No {filter === "all" ? "buyer feedback" : `${filter} feedback`} yet.</div>}
        </div>
      </main>
    </div>
  );
}
