import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SellerHubHeader from "../components/SellerHubHeader";
import {
  CLOSED_STATUSES,
  PRIORITY_STYLES,
  REASON_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  formatPrice,
  getDisputes,
  responseDueIn,
} from "../services/disputeService";

const TABS = [
  ["action_needed", "Action needed"],
  ["waiting", "Waiting on buyer"],
  ["escalated", "eBay involved"],
  ["closed", "Closed"],
  ["all", "All requests"],
];

const matchesTab = (dispute, tab) => {
  if (tab === "all") return true;
  if (tab === "action_needed") return dispute.status === "OPEN";
  if (tab === "waiting") return dispute.status === "SELLER_RESPONDED";
  if (tab === "escalated")
    return ["ESCALATED", "UNDER_REVIEW"].includes(dispute.status);
  if (tab === "closed") return CLOSED_STATUSES.includes(dispute.status);
  return true;
};

export default function SellerDisputes() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("action_needed");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "seller") {
      navigate("/");
      return;
    }
    loadDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const loadDisputes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDisputes();
      setDisputes(response.data || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't load your requests and disputes.",
      );
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    const result = { all: disputes.length };
    TABS.forEach(([tab]) => {
      if (tab !== "all")
        result[tab] = disputes.filter((item) => matchesTab(item, tab)).length;
    });
    return result;
  }, [disputes]);

  const visibleDisputes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return disputes.filter((dispute) => {
      if (!matchesTab(dispute, activeTab)) return false;
      if (!needle) return true;
      return (
        dispute._id.toLowerCase().includes(needle) ||
        dispute.orderId?.listingTitle?.toLowerCase().includes(needle) ||
        dispute.buyerId?.username?.toLowerCase().includes(needle) ||
        REASON_LABELS[dispute.reason]?.toLowerCase().includes(needle)
      );
    });
  }, [activeTab, disputes, query]);

  const refundExposure = useMemo(
    () =>
      disputes
        .filter((dispute) => !CLOSED_STATUSES.includes(dispute.status))
        .reduce(
          (total, dispute) => total + (dispute.orderId?.pricing?.total || 0),
          0,
        ),
    [disputes],
  );

  if (authLoading || !user || user.role !== "seller") return null;

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <SellerHubHeader active="disputes" user={user} />

      <main className="mx-auto max-w-screen-2xl px-6 py-9">
        <nav className="mb-5 text-xs text-gray-600">
          <Link to="/seller/overview" className="hover:underline">
            Seller Hub
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <Link to="/seller/orders" className="hover:underline">
            Orders
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="font-semibold text-gray-900">
            Requests and disputes
          </span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Requests and disputes</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Review buyer requests on items you've sold. Respond within 3
              business days to keep cases from being escalated to eBay.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadDisputes}
              className="rounded-full border border-gray-600 px-5 py-2.5 text-sm font-semibold hover:bg-white"
            >
              Refresh
            </button>
            <Link
              to="/seller/orders"
              className="rounded-full border border-gray-600 px-5 py-2.5 text-sm font-semibold hover:bg-white"
            >
              Back to orders
            </Link>
          </div>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Action needed"
            value={counts.action_needed || 0}
            accent="text-red-700"
            hint="Awaiting your reply"
          />
          <Metric
            label="Waiting on buyer"
            value={counts.waiting || 0}
            accent="text-blue-700"
            hint="You've replied"
          />
          <Metric
            label="eBay involved"
            value={counts.escalated || 0}
            accent="text-amber-700"
            hint="Escalated or under review"
          />
          <Metric
            label="Amount at risk"
            value={formatPrice(refundExposure)}
            accent="text-gray-900"
            hint="Order value in open cases"
            small
          />
        </section>

        <section className="mt-6 rounded-xl border border-gray-300 bg-white">
          <div className="flex flex-col gap-4 border-b border-gray-300 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by case number, item, buyer, or reason"
                className="w-full rounded-full border border-gray-500 py-3 pl-5 pr-12 outline-none focus:border-blue-600"
              />
              <span className="absolute right-5 top-3 text-xl">&#8981;</span>
            </div>
            <p className="text-sm text-gray-500">
              Showing {visibleDisputes.length} of {disputes.length} requests
            </p>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-gray-300 px-4">
            {TABS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`whitespace-nowrap border-b-4 px-4 py-4 text-sm font-semibold ${
                  activeTab === value
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent hover:text-blue-700"
                }`}
              >
                {label} ({counts[value] || 0})
              </button>
            ))}
          </div>

          {error && (
            <p className="m-5 rounded-lg bg-red-50 p-4 text-red-600">{error}</p>
          )}

          {loading ? (
            <div className="space-y-4 p-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : visibleDisputes.length === 0 ? (
            <div className="px-6 py-24 text-center">
              <h2 className="text-2xl font-bold">No requests here</h2>
              <p className="mt-2 text-gray-500">
                Requests matching this filter will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {visibleDisputes.map((dispute) => (
                <DisputeRow key={dispute._id} dispute={dispute} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, accent, hint, small }) {
  return (
    <div className="rounded-xl border border-gray-300 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 font-bold ${small ? "text-2xl" : "text-3xl"} ${accent}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </div>
  );
}

function DisputeRow({ dispute }) {
  const order = dispute.orderId || {};
  const needsAction = dispute.status === "OPEN";
  const due = needsAction ? responseDueIn(dispute.createdAt) : null;

  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-5 py-3 text-xs text-gray-600">
        <div>
          <span className="font-bold text-gray-900">
            Case #{dispute._id.slice(-12).toUpperCase()}
          </span>
          <span className="mx-3 text-gray-300">|</span>
          Opened {formatDate(dispute.createdAt)}
          <span className="mx-3 text-gray-300">|</span>
          Order #{(order._id || dispute.orderId || "").toString().slice(-12).toUpperCase()}
        </div>
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
            PRIORITY_STYLES[dispute.priority] || PRIORITY_STYLES.LOW
          }`}
        >
          {dispute.priority} priority
        </span>
      </div>

      <div className="grid gap-5 px-5 py-5 md:grid-cols-[90px_1fr_200px] xl:grid-cols-[90px_1fr_200px_220px]">
        <div className="h-24 overflow-hidden rounded-lg bg-gray-100">
          {order.listingImage ? (
            <img
              src={order.listingImage}
              alt={order.listingTitle}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0">
          <Link
            to={`/disputes/${dispute._id}`}
            className="font-semibold text-blue-700 hover:underline"
          >
            {order.listingTitle || "Item no longer available"}
          </Link>
          <p className="mt-2 text-sm text-gray-500">
            Buyer: {dispute.buyerId?.username || "Buyer"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Quantity: {order.quantity || 1}
          </p>
          <p className="mt-3 font-bold">{formatPrice(order.pricing?.total)}</p>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Reason
          </p>
          <p className="mt-2 text-sm font-semibold">
            {REASON_LABELS[dispute.reason] || dispute.reason}
          </p>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-500">
            {dispute.description}
          </p>
          {dispute.evidenceImages?.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              {dispute.evidenceImages.length} photo
              {dispute.evidenceImages.length > 1 ? "s" : ""} attached
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-3">
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${
              STATUS_STYLES[dispute.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {STATUS_LABELS[dispute.status] || dispute.status}
          </span>

          {due && (
            <span
              className={`text-xs font-semibold ${
                due.overdue ? "text-red-600" : "text-gray-600"
              }`}
            >
              {due.label}
            </span>
          )}

          <Link
            to={`/disputes/${dispute._id}`}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${
              needsAction
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border border-gray-500 hover:bg-gray-50"
            }`}
          >
            {needsAction ? "Respond to request" : "View case details"}
          </Link>

          <div className="flex gap-4 text-sm">
            <Link
              to="/messages"
              className="font-semibold text-blue-600 hover:underline"
            >
              Contact buyer
            </Link>
            <Link
              to={`/orders/${order._id || dispute.orderId}`}
              className="font-semibold hover:underline"
            >
              Order details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
