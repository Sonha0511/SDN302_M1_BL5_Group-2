import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import {
  CLOSED_STATUSES,
  REASON_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  formatPrice,
  getDisputes,
} from "../../services/disputeService";

const TABS = [
  ["open", "Open"],
  ["closed", "Closed"],
  ["all", "All"],
];

export default function DisputeList() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDisputes();
      setDisputes(response.data || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't load your requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(
    () => ({
      all: disputes.length,
      open: disputes.filter((item) => !CLOSED_STATUSES.includes(item.status))
        .length,
      closed: disputes.filter((item) => CLOSED_STATUSES.includes(item.status))
        .length,
    }),
    [disputes],
  );

  const visibleDisputes = useMemo(
    () =>
      disputes.filter((dispute) => {
        if (activeTab === "all") return true;
        const closed = CLOSED_STATUSES.includes(dispute.status);
        return activeTab === "closed" ? closed : !closed;
      }),
    [activeTab, disputes],
  );

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <Navbar />

      <main className="mx-auto max-w-screen-lg px-6 py-8">
        <nav className="mb-5 text-xs text-gray-600">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <Link to="/my-orders" className="hover:underline">
            Purchase history
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="font-semibold text-gray-900">
            Returns and requests
          </span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Returns and requests</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track the requests you've opened with sellers and see where each
              one stands.
            </p>
          </div>
          <Link
            to="/my-orders"
            className="rounded-full border border-gray-600 px-5 py-2.5 text-sm font-semibold hover:bg-white"
          >
            Purchase history
          </Link>
        </div>

        <section className="mt-6 rounded-xl border border-gray-300 bg-white">
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
                  className="h-32 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : visibleDisputes.length === 0 ? (
            <div className="px-6 py-24 text-center">
              <h2 className="text-2xl font-bold">No requests yet</h2>
              <p className="mt-2 text-gray-500">
                If something goes wrong with an order, you can open a request
                from your purchase history.
              </p>
              <Link
                to="/my-orders"
                className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                Go to purchase history
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {visibleDisputes.map((dispute) => {
                const order = dispute.orderId || {};
                return (
                  <article key={dispute._id}>
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-5 py-3 text-xs text-gray-600">
                      <span>
                        <span className="font-bold text-gray-900">
                          Case #{dispute._id.slice(-12).toUpperCase()}
                        </span>
                        <span className="mx-3 text-gray-300">|</span>
                        Opened {formatDate(dispute.createdAt)}
                      </span>
                      <span>
                        Seller: {dispute.sellerId?.username || "Seller"}
                      </span>
                    </div>

                    <div className="grid gap-5 px-5 py-5 sm:grid-cols-[80px_1fr_200px]">
                      <div className="h-20 overflow-hidden rounded-lg bg-gray-100">
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
                        <p className="mt-2 text-sm text-gray-600">
                          Reason:{" "}
                          {REASON_LABELS[dispute.reason] || dispute.reason}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {dispute.description}
                        </p>
                        <p className="mt-2 font-bold">
                          {formatPrice(order.pricing?.total)}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                            STATUS_STYLES[dispute.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {STATUS_LABELS[dispute.status] || dispute.status}
                        </span>
                        <Link
                          to={`/disputes/${dispute._id}`}
                          className="rounded-lg border border-gray-500 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                        >
                          View request
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
