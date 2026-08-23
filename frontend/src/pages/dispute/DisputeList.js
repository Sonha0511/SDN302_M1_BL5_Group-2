import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  REASON_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  formatPrice,
  getDisputes,
} from "../../services/disputeService";

const DisputeList = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    loadDisputes();
  }, [authLoading, navigate, user]);

  const loadDisputes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDisputes();
      setDisputes(response.data || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "We couldn't load your cases.",
      );
    } finally {
      setLoading(false);
    }
  };

  const activeCases = disputes.filter((item) => item.status === "OPEN").length;

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <LoadingState />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Customer support
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              My requests and disputes
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              Track issues with your orders, review seller responses, and keep
              all case updates in one place.
            </p>
          </div>
          <Link
            to="/my-orders"
            className="rounded-lg border border-gray-400 bg-white px-4 py-2.5 text-sm font-semibold hover:border-blue-600 hover:text-blue-700"
          >
            View my orders
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Summary label="Total cases" value={disputes.length} />
          <Summary
            label="Awaiting a response"
            value={activeCases}
            accent="text-red-700"
          />
          <Summary
            label="Resolved or closed"
            value={disputes.length - activeCases}
            accent="text-green-700"
          />
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border border-gray-300 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold">Your cases</h2>
              <p className="mt-1 text-sm text-gray-500">
                {disputes.length
                  ? `${disputes.length} case${disputes.length === 1 ? "" : "s"} in your account`
                  : "No cases in your account"}
              </p>
            </div>
            <button
              onClick={loadDisputes}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              Refresh
            </button>
          </div>
          {error && (
            <p className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}
          {!error && disputes.length === 0 && <EmptyState />}
          {disputes.length > 0 && (
            <div className="divide-y divide-gray-200">
              {disputes.map((dispute) => (
                <DisputeCard key={dispute._id} dispute={dispute} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

function Summary({ label, value, accent = "text-gray-900" }) {
  return (
    <div className="rounded-xl border border-gray-300 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function DisputeCard({ dispute }) {
  const order = dispute.orderId || {};
  const statusStyle =
    STATUS_STYLES[dispute.status] || "bg-gray-100 text-gray-700 ring-gray-300";
  return (
    <article className="p-5 transition-colors hover:bg-gray-50 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24">
            {order.listingImage ? (
              <img
                src={order.listingImage}
                alt={order.listingTitle || "Order item"}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-400">
                No image
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Case #{dispute._id.slice(-10).toUpperCase()}
            </p>
            <h3 className="mt-1 truncate text-lg font-bold">
              {order.listingTitle || "Order item unavailable"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Opened {formatDate(dispute.createdAt)} &middot; Order #
              {String(order._id || dispute.orderId || "")
                .slice(-10)
                .toUpperCase()}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusStyle}`}
        >
          {STATUS_LABELS[dispute.status] || dispute.status}
        </span>
      </div>
      <div className="mt-5 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-sm">
            <span className="font-semibold">Reason:</span>{" "}
            {REASON_LABELS[dispute.reason] || dispute.reason}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
            {dispute.description}
          </p>
          {order.pricing?.total !== undefined && (
            <p className="mt-2 text-sm font-semibold">
              Order value: {formatPrice(order.pricing.total)}
            </p>
          )}
        </div>
        <Link
          to={`/disputes/${dispute._id}`}
          className="inline-flex justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
        >
          View case
        </Link>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
      <div className="h-10 w-72 animate-pulse rounded bg-gray-200" />
      <div className="mt-8 h-24 animate-pulse rounded-xl bg-gray-200" />
      <div className="mt-6 h-64 animate-pulse rounded-xl bg-white" />
    </main>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
        ?
      </div>
      <h2 className="mt-5 text-xl font-bold">You have no open cases</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        When you report an issue with an order, your request and its updates
        will appear here.
      </p>
      <Link
        to="/my-orders"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
      >
        Browse my orders
      </Link>
    </div>
  );
}

export default DisputeList;
