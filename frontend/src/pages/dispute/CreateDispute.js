import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import API from "../../services/api";
import {
  REASON_LABELS,
  createDispute,
  formatDate,
  formatPrice,
} from "../../services/disputeService";

// Reasons a buyer can pick, in the order eBay presents them
const REASON_OPTIONS = [
  "NOT_RECEIVED",
  "NOT_AS_DESCRIBED",
  "DAMAGED",
  "WRONG_ITEM",
  "MISSING_PARTS",
  "FAKE_COUNTERFEIT",
  "LATE_DELIVERY",
  "REFUND_NOT_RECEIVED",
  "OTHER",
];

const REASON_HINTS = {
  NOT_RECEIVED: "The estimated delivery date has passed and nothing arrived.",
  NOT_AS_DESCRIBED:
    "The item is different from the listing photos or description.",
  DAMAGED: "The item arrived broken, cracked, or otherwise damaged.",
  WRONG_ITEM: "You received a different item than the one you ordered.",
  MISSING_PARTS: "Parts or accessories listed in the description are missing.",
  FAKE_COUNTERFEIT: "You believe the item is not authentic.",
  LATE_DELIVERY: "The item arrived well after the estimated delivery date.",
  REFUND_NOT_RECEIVED: "A refund was agreed but never reached your account.",
  OTHER: "Something else went wrong with this order.",
};

const MAX_PHOTOS = 3;

export default function CreateDispute() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [reason, setReason] = useState("NOT_AS_DESCRIBED");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // Restore any draft the buyer left behind
    const draft = localStorage.getItem(`draft_dispute_${orderId}`);
    if (draft) setDescription(draft);

    const fetchOrder = async () => {
      try {
        const response = await API.get(`/orders/${orderId}`);
        setOrder(response.data?.data || response.data);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "We couldn't load this order.",
        );
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleDescriptionChange = (event) => {
    const text = event.target.value;
    setDescription(text);
    localStorage.setItem(`draft_dispute_${orderId}`, text);
  };

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files);
    if (selected.length > MAX_PHOTOS) {
      setError(`You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }
    setError("");
    setFiles(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (description.trim().length < 20) {
      setError(
        "Please describe the problem in at least 20 characters so the seller can help.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    let uploadedImageUrls = [];

    try {
      if (files.length > 0) {
        setProgress("Uploading photos...");
        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));

        const uploadResponse = await API.post("/upload/images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const rawUrls = uploadResponse.data?.urls || [];
        uploadedImageUrls = rawUrls.map((item) =>
          typeof item === "string" ? item : item.url,
        );
      }

      setProgress("Sending your request...");
      await createDispute({
        orderId,
        reason,
        description: description.trim(),
        evidenceImages: uploadedImageUrls,
      });

      localStorage.removeItem(`draft_dispute_${orderId}`);
      navigate("/disputes/my");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "We couldn't send your request. Please try again.",
      );
    } finally {
      setProgress("");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <Navbar />

      <main className="mx-auto max-w-screen-lg px-6 py-8">
        <nav className="mb-5 text-xs text-gray-600">
          <Link to="/my-orders" className="hover:underline">
            Purchase history
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="font-semibold text-gray-900">
            Tell us what went wrong
          </span>
        </nav>

        <h1 className="text-3xl font-bold">Tell us what went wrong</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          The seller has 3 business days to respond. If you can't work it out
          together, you can ask eBay to step in and help.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* -------------------- Request form -------------------- */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-300 bg-white p-6"
          >
            {error && (
              <p className="mb-5 rounded-lg border-l-4 border-red-600 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            )}

            <fieldset>
              <legend className="text-lg font-bold">
                Why are you opening this request?
              </legend>
              <div className="mt-4 space-y-2">
                {REASON_OPTIONS.map((value) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${
                      reason === value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={reason === value}
                      onChange={(event) => setReason(event.target.value)}
                      className="mt-1 h-4 w-4 flex-shrink-0 accent-blue-600"
                    />
                    <span>
                      <span className="block text-sm font-semibold">
                        {REASON_LABELS[value]}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {REASON_HINTS[value]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <hr className="my-6 border-gray-200" />

            <label className="block text-lg font-bold" htmlFor="description">
              Describe the problem
            </label>
            <p className="mt-1 text-sm text-gray-600">
              Include details like what you expected, what you received, and
              what you'd like the seller to do.
            </p>
            <textarea
              id="description"
              rows="6"
              value={description}
              onChange={handleDescriptionChange}
              required
              placeholder="For example: The listing said the item was unused, but the box was already open and the screen has scratches. I'd like a refund."
              className="mt-3 w-full rounded-lg border border-gray-400 p-3 text-sm outline-none focus:border-blue-600"
            />
            <p className="mt-1 text-xs text-gray-500">
              {description.length} characters &middot; your draft is saved
              automatically
            </p>

            <hr className="my-6 border-gray-200" />

            <p className="text-lg font-bold">Add photos (optional)</p>
            <p className="mt-1 text-sm text-gray-600">
              Photos help the seller understand the problem. Up to{" "}
              {MAX_PHOTOS} images.
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="mt-3 w-full rounded-lg border border-dashed border-gray-400 bg-gray-50 p-4 text-sm"
            />
            {files.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {files.map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`Attachment ${index + 1}`}
                    className="h-20 w-20 rounded-lg border border-gray-300 object-cover"
                  />
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? progress || "Sending..." : "Send request"}
              </button>
              <Link
                to="/my-orders"
                className="rounded-full border border-gray-600 px-8 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* -------------------- Order summary -------------------- */}
          <aside className="space-y-6">
            <section className="rounded-xl border border-gray-300 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold">Order summary</h2>
              {!order ? (
                <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
              ) : (
                <>
                  <div className="mb-4 h-40 overflow-hidden rounded-lg bg-gray-100">
                    {order.listingImage ? (
                      <img
                        src={order.listingImage}
                        alt={order.listingTitle}
                        className="h-full w-full object-contain p-3"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <p className="font-semibold leading-6">
                    {order.listingTitle}
                  </p>
                  <dl className="mt-4 space-y-2 text-sm">
                    <Row label="Order number">
                      #{orderId.slice(-12).toUpperCase()}
                    </Row>
                    <Row label="Order date">{formatDate(order.createdAt)}</Row>
                    <Row label="Quantity">{order.quantity || 1}</Row>
                    <Row label="Seller">
                      {order.sellerId?.username || "Seller"}
                    </Row>
                    <Row label="Payment">{order.paymentMethod || "COD"}</Row>
                  </dl>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                    <span className="font-bold">Order total</span>
                    <span className="text-lg font-bold">
                      {formatPrice(order.pricing?.total)}
                    </span>
                  </div>
                </>
              )}
            </section>

            <section className="rounded-xl border border-gray-300 bg-white p-6">
              <h2 className="mb-3 text-lg font-bold">What happens next</h2>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-gray-600">
                <li>The seller is notified and has 3 business days to reply.</li>
                <li>
                  Most sellers resolve requests with a refund or a replacement.
                </li>
                <li>
                  If you're not satisfied, you can ask eBay to step in and
                  review the case.
                </li>
              </ol>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}
