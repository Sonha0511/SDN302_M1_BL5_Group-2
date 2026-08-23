import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SellerHubHeader from "../../components/SellerHubHeader";
import { useAuth } from "../../context/AuthContext";
import {
  CLOSED_STATUSES,
  PRIORITY_STYLES,
  REASON_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  formatDateTime,
  formatPrice,
  getDisputeById,
  responseDueIn,
  updateDispute,
} from "../../services/disputeService";

// The stages eBay shows in the case progress bar
const STAGES = [
  { key: "opened", label: "Request opened" },
  { key: "responded", label: "Seller responded" },
  { key: "escalated", label: "eBay stepped in" },
  { key: "closed", label: "Case closed" },
];

const stageIndexFor = (status) => {
  if (CLOSED_STATUSES.includes(status)) return 3;
  if (["ESCALATED", "UNDER_REVIEW"].includes(status)) return 2;
  if (status === "SELLER_RESPONDED") return 1;
  return 0;
};

const ACTOR_LABELS = {
  buyer: "Buyer",
  seller: "Seller",
  admin: "eBay",
  system: "System",
};

export default function DisputeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDisputeById(id);
      setDispute(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't load this request.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Wait for AuthContext so we know which side of the case the viewer is on
    if (!authLoading) fetchDetail();
  }, [authLoading, fetchDetail]);

  const applyUpdate = async (payload, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setSaving(true);
    setError("");
    try {
      const response = await updateDispute(id, payload);
      setDispute(response.data);
      setResponseMessage("");
      setResolutionNote("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't update this request.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <Navbar />
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <Navbar />
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">We can't find this request</h1>
          <p className="mt-2 text-gray-600">
            {error || "The request may have been removed."}
          </p>
        </div>
      </div>
    );
  }

  // Work out which side of the case the signed-in user is on
  const sellerId = dispute.sellerId?._id || dispute.sellerId;
  const buyerId = dispute.buyerId?._id || dispute.buyerId;
  let viewerRole = "guest";
  if (user) {
    if (user._id === sellerId) viewerRole = "seller";
    else if (user._id === buyerId) viewerRole = "buyer";
    else if (user.role === "admin") viewerRole = "admin";
  }

  const order = dispute.orderId || {};
  const isClosed = CLOSED_STATUSES.includes(dispute.status);
  const currentStage = stageIndexFor(dispute.status);
  const due = dispute.status === "OPEN" ? responseDueIn(dispute.createdAt) : null;
  const backLink = viewerRole === "seller" ? "/seller/disputes" : "/disputes/my";

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      {viewerRole === "seller" ? (
        <SellerHubHeader active="disputes" user={user} />
      ) : (
        <Navbar />
      )}

      <main className="mx-auto max-w-screen-xl px-6 py-8">
        <nav className="mb-5 text-xs text-gray-600">
          <Link to={backLink} className="hover:underline">
            {viewerRole === "seller"
              ? "Requests and disputes"
              : "My requests"}
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="font-semibold text-gray-900">
            Case #{dispute._id.slice(-12).toUpperCase()}
          </span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {REASON_LABELS[dispute.reason] || dispute.reason}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Case #{dispute._id.slice(-12).toUpperCase()} &middot; Opened{" "}
              {formatDate(dispute.createdAt)} by{" "}
              {dispute.buyerId?.username || "the buyer"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-bold ring-1 ${
                STATUS_STYLES[dispute.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {STATUS_LABELS[dispute.status] || dispute.status}
            </span>
            <span
              className={`rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${
                PRIORITY_STYLES[dispute.priority] || PRIORITY_STYLES.LOW
              }`}
            >
              {dispute.priority} priority
            </span>
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-4 text-red-600">{error}</p>
        )}

        {due && viewerRole === "seller" && (
          <div
            className={`mt-5 rounded-xl border-l-4 p-4 text-sm ${
              due.overdue
                ? "border-red-600 bg-red-50 text-red-800"
                : "border-blue-600 bg-blue-50 text-blue-900"
            }`}
          >
            <strong className="font-bold">
              {due.overdue ? "Response overdue. " : "Action needed. "}
            </strong>
            The buyer is waiting for your reply &mdash; {due.label.toLowerCase()}
            . Cases without a seller response can be escalated to eBay.
          </div>
        )}

        <ProgressBar currentStage={currentStage} status={dispute.status} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* -------------------- LEFT: the conversation -------------------- */}
          <div className="space-y-6">
            <Panel title="What the buyer reported">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Reason">
                  {REASON_LABELS[dispute.reason] || dispute.reason}
                </Field>
                <Field label="Opened on">
                  {formatDateTime(dispute.createdAt)}
                </Field>
              </dl>
              <p className="mt-5 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-800">
                {dispute.description}
              </p>

              <h3 className="mt-6 text-sm font-bold">Photos from the buyer</h3>
              {dispute.evidenceImages?.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  {dispute.evidenceImages.map((imageUrl, index) => (
                    <a
                      key={index}
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open full size"
                    >
                      <img
                        src={imageUrl}
                        alt={`Buyer evidence ${index + 1}`}
                        onError={(event) => {
                          event.target.src =
                            "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='104' height='104'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' font-size='11' fill='%239ca3af' text-anchor='middle'>No image</text></svg>";
                        }}
                        className="h-[104px] w-[104px] cursor-zoom-in rounded-lg border border-gray-300 object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  The buyer didn't attach any photos to this request.
                </p>
              )}
            </Panel>

            {dispute.sellerResponse && (
              <Panel title="Your response">
                <p className="whitespace-pre-wrap rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                  {dispute.sellerResponse}
                </p>
              </Panel>
            )}

            {dispute.resolution?.type &&
              dispute.resolution.type !== "NONE" && (
                <Panel title="Resolution">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
                    <p className="font-bold text-green-900">
                      {dispute.resolution.type.replace(/_/g, " ")}
                      {dispute.resolution.amount
                        ? ` — ${formatPrice(dispute.resolution.amount)}`
                        : ""}
                    </p>
                    {dispute.resolution.note && (
                      <p className="mt-1 text-green-900">
                        {dispute.resolution.note}
                      </p>
                    )}
                    {dispute.resolution.resolvedAt && (
                      <p className="mt-2 text-xs text-green-800">
                        Closed on {formatDateTime(dispute.resolution.resolvedAt)}
                      </p>
                    )}
                  </div>
                </Panel>
              )}

            <Panel title="Case history">
              <ol className="relative border-l border-gray-200 pl-6">
                {(dispute.timeline || []).map((event, index) => (
                  <li key={index} className="relative pb-6 last:pb-0">
                    <span
                      className={`absolute -left-[31px] mt-1 h-3 w-3 rounded-full ring-4 ring-white ${
                        event.actor === "buyer"
                          ? "bg-orange-500"
                          : event.actor === "seller"
                            ? "bg-blue-600"
                            : "bg-gray-500"
                      }`}
                    />
                    <p className="text-xs text-gray-500">
                      {formatDateTime(event.timestamp)}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-bold">
                        {ACTOR_LABELS[event.actor] || event.actor}
                      </span>
                      {" — "}
                      {event.note}
                    </p>
                  </li>
                ))}
              </ol>
            </Panel>

            {/* -------------------- Actions -------------------- */}
            {viewerRole === "seller" && !isClosed && (
              <Panel title="Respond to this request">
                <p className="text-sm text-gray-600">
                  Explain what happened and what you're offering. The buyer sees
                  this message on their side of the case.
                </p>
                <textarea
                  rows="4"
                  value={responseMessage}
                  onChange={(event) => setResponseMessage(event.target.value)}
                  placeholder="For example: I'm sorry about this. I can send a replacement today, or issue a full refund if you'd prefer."
                  className="mt-3 w-full rounded-lg border border-gray-400 p-3 text-sm outline-none focus:border-blue-600"
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    disabled={saving || !responseMessage.trim()}
                    onClick={() =>
                      applyUpdate({
                        status: "SELLER_RESPONDED",
                        sellerResponse: responseMessage,
                      })
                    }
                    className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Sending..." : "Send response"}
                  </button>
                  <Link
                    to="/messages"
                    className="rounded-full border border-gray-600 px-6 py-2.5 text-sm font-semibold hover:bg-gray-50"
                  >
                    Message the buyer
                  </Link>
                </div>

                <hr className="my-6 border-gray-200" />

                <h3 className="text-sm font-bold">Close this request</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Choosing an outcome closes the case and records it on your
                  seller performance.
                </p>
                <input
                  value={resolutionNote}
                  onChange={(event) => setResolutionNote(event.target.value)}
                  placeholder="Optional note for the buyer and eBay"
                  className="mt-3 w-full rounded-lg border border-gray-400 p-3 text-sm outline-none focus:border-blue-600"
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    disabled={saving}
                    onClick={() =>
                      applyUpdate(
                        {
                          status: "RESOLVED_REFUND",
                          resolutionNote: resolutionNote || undefined,
                        },
                        "Issue a full refund and close this case?",
                      )
                    }
                    className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    Issue full refund
                  </button>
                  <button
                    disabled={saving}
                    onClick={() =>
                      applyUpdate(
                        {
                          status: "RESOLVED_REPLACE",
                          resolutionNote: resolutionNote || undefined,
                        },
                        "Send a replacement and close this case?",
                      )
                    }
                    className="rounded-full border border-gray-600 px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    Send replacement
                  </button>
                  <button
                    disabled={saving}
                    onClick={() =>
                      applyUpdate(
                        {
                          status: "RESOLVED_REJECTED",
                          resolutionNote: resolutionNote || undefined,
                        },
                        "Decline this request? The buyer can still ask eBay to step in.",
                      )
                    }
                    className="rounded-full border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Decline request
                  </button>
                </div>
              </Panel>
            )}

            {viewerRole === "buyer" && !isClosed && (
              <Panel title="Your options">
                <div className="flex flex-wrap gap-3">
                  {dispute.status !== "ESCALATED" &&
                    dispute.status !== "UNDER_REVIEW" && (
                      <button
                        disabled={saving}
                        onClick={() =>
                          applyUpdate(
                            { status: "ESCALATED" },
                            "Ask eBay to step in and review this case?",
                          )
                        }
                        className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Ask eBay to step in
                      </button>
                    )}
                  <button
                    disabled={saving}
                    onClick={() =>
                      applyUpdate(
                        { status: "CLOSED" },
                        "Close this request? You won't be able to reopen it.",
                      )
                    }
                    className="rounded-full border border-gray-600 px-6 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    Close request
                  </button>
                </div>
              </Panel>
            )}
          </div>

          {/* -------------------- RIGHT: order summary -------------------- */}
          <aside className="space-y-6">
            <Panel title="Order details">
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
                {order.listingTitle || "Item no longer available"}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Order number">
                  #{(order._id || dispute.orderId || "")
                    .toString()
                    .slice(-12)
                    .toUpperCase()}
                </Row>
                <Row label="Order date">{formatDate(order.createdAt)}</Row>
                <Row label="Quantity">{order.quantity || 1}</Row>
                <Row label="Payment">{order.paymentMethod || "COD"}</Row>
                <Row label="Order status">{order.status || "-"}</Row>
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="font-bold">Order total</span>
                <span className="text-lg font-bold">
                  {formatPrice(order.pricing?.total)}
                </span>
              </div>
              <Link
                to={`/orders/${order._id || dispute.orderId}`}
                className="mt-4 block rounded-full border border-gray-600 py-2.5 text-center text-sm font-semibold hover:bg-gray-50"
              >
                View full order
              </Link>
            </Panel>

            <Panel title={viewerRole === "seller" ? "Buyer" : "Seller"}>
              <p className="text-sm font-semibold">
                {viewerRole === "seller"
                  ? dispute.buyerId?.username || "Buyer"
                  : dispute.sellerId?.username || "Seller"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {viewerRole === "seller"
                  ? dispute.buyerId?.email
                  : dispute.sellerId?.email}
              </p>
              {order.shippingAddress?.fullName && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase text-gray-500">
                    Ship to
                  </p>
                  <p className="mt-1 text-sm leading-6 text-gray-700">
                    {order.shippingAddress.fullName}
                    <br />
                    {order.shippingAddress.street}
                    <br />
                    {order.shippingAddress.city},{" "}
                    {order.shippingAddress.country}
                  </p>
                </>
              )}
              <Link
                to="/messages"
                className="mt-4 block rounded-full bg-blue-600 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-700"
              >
                Send a message
              </Link>
            </Panel>

            <Panel title="How eBay handles requests">
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-gray-600">
                <li>Sellers have 3 business days to respond.</li>
                <li>
                  If the buyer isn't satisfied, they can ask eBay to step in.
                </li>
                <li>
                  Cases eBay decides against the seller count towards your
                  service metrics.
                </li>
              </ul>
            </Panel>
          </aside>
        </div>

        <button
          onClick={() => navigate(backLink)}
          className="mt-8 text-sm font-semibold text-blue-600 hover:underline"
        >
          &larr; Back to all requests
        </button>
      </main>
    </div>
  );
}

function ProgressBar({ currentStage, status }) {
  return (
    <div className="mt-6 rounded-xl border border-gray-300 bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {STAGES.map((stage, index) => {
          const reached = index <= currentStage;
          const isLast = index === STAGES.length - 1;
          return (
            <React.Fragment key={stage.key}>
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    reached
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index < currentStage ? "✓" : index + 1}
                </span>
                <span
                  className={`whitespace-nowrap text-sm ${
                    reached ? "font-semibold text-gray-900" : "text-gray-500"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {!isLast && (
                <span
                  className={`hidden h-0.5 flex-1 sm:block ${
                    index < currentStage ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Current status: {STATUS_LABELS[status] || status}
      </p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-300 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{children}</dd>
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
