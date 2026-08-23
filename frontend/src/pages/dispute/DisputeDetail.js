import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SellerHubHeader from "../../components/SellerHubHeader";
import { useAuth } from "../../context/AuthContext";
import {
  CLOSED_STATUSES,
  REASON_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  formatDateTime,
  formatPrice,
  getDisputeById,
  updateDispute,
} from "../../services/disputeService";

const DisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    loadDispute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, id, user]);

  const loadDispute = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDisputeById(id);
      setDispute(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "We couldn't load this case.",
      );
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (status) => {
    if (status === "SELLER_RESPONDED" && !responseMessage.trim()) {
      setError("Add a response before sending this case update.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateDispute(id, {
        status,
        sellerResponse:
          status === "SELLER_RESPONDED"
            ? responseMessage.trim()
            : dispute.sellerResponse,
      });
      setResponseMessage("");
      await loadDispute();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "We couldn't update this case.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading)
    return (
      <PageShell user={user}>
        <LoadingState />
      </PageShell>
    );
  if (!dispute)
    return (
      <PageShell user={user}>
        <EmptyState error={error} />
      </PageShell>
    );

  const sellerId = dispute.sellerId?._id || dispute.sellerId;
  const buyerId = dispute.buyerId?._id || dispute.buyerId;
  const isSeller = String(user?._id) === String(sellerId);
  const order = dispute.orderId || {};
  const canWithdraw =
    String(user?._id) === String(buyerId) &&
    !CLOSED_STATUSES.includes(dispute.status);
  const backPath = isSeller ? "/seller/disputes" : "/disputes/my";

  return (
    <PageShell user={user} seller={isSeller}>
      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <Link
          to={backPath}
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          &larr; Back to {isSeller ? "requests and disputes" : "my disputes"}
        </Link>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">
              Case #{dispute._id.slice(-12).toUpperCase()}
            </p>
            <h1 className="mt-1 text-3xl font-bold">Case details</h1>
            <p className="mt-2 text-sm text-gray-500">
              Opened {formatDate(dispute.createdAt)} &middot; Order #
              {String(order._id || dispute.orderId || "")
                .slice(-12)
                .toUpperCase()}
            </p>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-sm font-bold ring-1 ${STATUS_STYLES[dispute.status] || "bg-gray-100 text-gray-700 ring-gray-300"}`}
          >
            {STATUS_LABELS[dispute.status] || dispute.status}
          </span>
        </div>
        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <section className="rounded-xl border border-gray-300 bg-white p-6">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Buyer request
                  </p>
                  <h2 className="mt-2 text-xl font-bold">
                    {REASON_LABELS[dispute.reason] || dispute.reason}
                  </h2>
                </div>
                <span className="text-sm text-gray-500">
                  {dispute.buyerId?.username || "Buyer"}
                </span>
              </div>
              <p className="mt-5 whitespace-pre-wrap leading-7 text-gray-700">
                {dispute.description}
              </p>
            </section>
            <section className="rounded-xl border border-gray-300 bg-white p-6">
              <h2 className="text-lg font-bold">Evidence</h2>
              {dispute.evidenceImages?.length ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {dispute.evidenceImages.map((image, index) => (
                    <a
                      key={image}
                      href={image}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-lg border border-gray-200"
                    >
                      <img
                        src={image}
                        alt={`Evidence ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  The buyer did not attach any evidence.
                </p>
              )}
            </section>
            {dispute.sellerResponse && (
              <section className="rounded-xl border border-green-200 bg-green-50 p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                  Your response
                </p>
                <p className="mt-3 whitespace-pre-wrap leading-7 text-green-950">
                  {dispute.sellerResponse}
                </p>
              </section>
            )}
            <section className="rounded-xl border border-gray-300 bg-white p-6">
              <h2 className="text-lg font-bold">Case history</h2>
              <div className="mt-5 space-y-5">
                {dispute.timeline?.map((event, index) => (
                  <div
                    key={`${event.timestamp}-${index}`}
                    className="flex gap-3"
                  >
                    <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(event.timestamp)} &middot;{" "}
                        <span className="font-semibold uppercase">
                          {event.actor}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-gray-700">{event.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <aside className="space-y-6">
            <section className="rounded-xl border border-gray-300 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Order summary
              </p>
              <h2 className="mt-2 font-bold">
                {order.listingTitle || "Item details unavailable"}
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Quantity</dt>
                  <dd className="font-semibold">{order.quantity || 1}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Order value</dt>
                  <dd className="font-semibold">
                    {formatPrice(order.pricing?.total)}
                  </dd>
                </div>
              </dl>
              {order._id && (
                <Link
                  to={`/orders/${order._id}`}
                  className="mt-5 block text-sm font-semibold text-blue-700 hover:underline"
                >
                  View order details &rarr;
                </Link>
              )}
            </section>
            {isSeller && dispute.status === "OPEN" && (
              <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <h2 className="font-bold text-blue-950">
                  Respond to the buyer
                </h2>
                <p className="mt-2 text-sm leading-6 text-blue-900">
                  Explain how you will resolve this request. A clear response
                  helps avoid escalation.
                </p>
                <textarea
                  rows="5"
                  value={responseMessage}
                  onChange={(event) => setResponseMessage(event.target.value)}
                  placeholder="Write your response..."
                  className="mt-4 w-full rounded-lg border border-blue-300 bg-white p-3 text-sm outline-none focus:border-blue-600"
                />
                <button
                  disabled={saving}
                  onClick={() => changeStatus("SELLER_RESPONDED")}
                  className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {saving ? "Sending..." : "Send response"}
                </button>
              </section>
            )}
            {canWithdraw && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to withdraw this case?",
                    )
                  )
                    changeStatus("CLOSED");
                }}
                className="w-full rounded-lg border border-gray-400 px-4 py-3 text-sm font-semibold hover:bg-white"
              >
                Withdraw case
              </button>
            )}
          </aside>
        </div>
      </main>
    </PageShell>
  );
};

function PageShell({ children, user, seller }) {
  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      {seller ? <SellerHubHeader active="disputes" user={user} /> : <Navbar />}
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
      <div className="mt-7 h-96 animate-pulse rounded-xl bg-white" />
    </main>
  );
}

function EmptyState({ error }) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-24 text-center">
      <h1 className="text-2xl font-bold">Case not found</h1>
      <p className="mt-3 text-gray-500">
        {error ||
          "This request may have been removed or you may not have access."}
      </p>
      <Link
        to="/seller/disputes"
        className="mt-6 inline-block font-semibold text-blue-700 hover:underline"
      >
        Back to requests and disputes
      </Link>
    </main>
  );
}

export default DisputeDetail;
