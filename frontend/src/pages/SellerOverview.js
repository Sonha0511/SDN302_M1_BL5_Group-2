import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SellerHubHeader from "../components/SellerHubHeader";
import { getMyListings, getMyOrders } from "../services/sellerService";

const formatPrice = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export default function SellerOverview() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [listingResponse, orderResponse] = await Promise.all([
        getMyListings(),
        getMyOrders(),
      ]);
      setListings(listingResponse.data.data || listingResponse.data || []);
      setOrders(orderResponse.data.data || orderResponse.data || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load your seller overview.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "seller") {
      navigate("/sell");
      return;
    }
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const metrics = useMemo(() => {
    const activeListings = listings.filter((item) => item.status === "active");
    const awaitingShipment = orders.filter(
      (item) => item.status === "awaiting_shipment",
    );
    const deliveredRevenue = orders
      .filter((item) => item.status === "delivered")
      .reduce((sum, item) => sum + (item.pricing?.total || 0), 0);
    return { activeListings, awaitingShipment, deliveredRevenue };
  }, [listings, orders]);
  if (authLoading || !user || user.role !== "seller") return null;

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <SellerHubHeader active="overview" user={user} />
      <main className="mx-auto max-w-screen-2xl px-5 py-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Seller Hub{" "}
              <a href="#seller" className="ml-3 text-sm font-normal underline">
                {user?.username || user?.name || "Seller"}
              </a>{" "}
              <span className="text-sm font-normal">(0)</span>
            </h1>
          </div>
          <Link
            to="/messages"
            className="rounded-full border border-gray-400 px-5 py-2 text-sm font-semibold"
          >
            Messages (0)
          </Link>
        </div>
        {error && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={loadDashboard} className="font-bold underline">
              Try again
            </button>
          </div>
        )}
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <section className="mt-7 flex flex-wrap items-center gap-5 rounded-lg bg-gray-100 px-6 py-5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white">
                ✓
              </span>
              <div>
                <p className="font-bold">You're all caught up!</p>
                <p className="mt-1 text-sm">
                  New tasks, like orders to ship or offers to review, will show
                  up here.
                </p>
              </div>
            </section>
            <section className="mt-7 grid gap-5 xl:grid-cols-3">
              <DashboardCard
                title="Listings"
                rows={[
                  ["Create listing", "/sell/start", ""],
                  ["Drafts", "/seller/inventory", "0"],
                  [
                    "Active listings",
                    "/seller/inventory",
                    metrics.activeListings.length,
                  ],
                  ["With questions", "#", "0"],
                  ["With open offers from buyers", "#", "0"],
                  ["All auctions", "#", "0"],
                  ["Scheduled listings", "#", "0"],
                  [
                    "Unsold and not relisted",
                    "/seller/inventory",
                    listings.filter((item) => item.status !== "active").length,
                  ],
                ]}
              />
              <DashboardCard
                title="Orders"
                rows={[
                  ["See all orders", "/seller/orders", ""],
                  [
                    "Awaiting shipment - print shipping label",
                    "/seller/orders",
                    metrics.awaitingShipment.length,
                  ],
                  ["All open returns/replacements", "/seller/orders", "0"],
                  ["Open cancellations", "/seller/orders", "0"],
                  [
                    "Awaiting payment",
                    "/seller/orders",
                    orders.filter((item) => item.status === "awaiting_payment")
                      .length,
                  ],
                  ["Shipped and awaiting your feedback", "/seller/orders", "0"],
                  [
                    "Orders eligible for combined purchases",
                    "/seller/orders",
                    "",
                  ],
                ]}
              />
              <SalesCard revenue={metrics.deliveredRevenue} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function DashboardCard({ title, rows }) {
  return (
    <div className="rounded-xl border border-gray-300 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold underline">{title}</h2>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-2xl">
          ›
        </span>
      </div>
      <div className="mt-4">
        {rows.map(([label, to, value]) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-gray-200 py-2.5 text-sm"
          >
            <Link to={to} className="pr-3 underline hover:text-blue-700">
              {label}
            </Link>
            {value !== "" && <strong>{value}</strong>}
          </div>
        ))}
      </div>
    </div>
  );
}
function SalesCard({ revenue }) {
  return (
    <div className="rounded-xl border border-gray-300 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold underline">Sales</h2>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-2xl">
          ›
        </span>
      </div>
      <div className="mt-10 text-center">
        <p className="font-bold">Chart for sales data across 31 days</p>
        <div className="mt-5 h-28 border-b-2 border-gray-500 bg-gray-50" />
        <div className="mt-5 space-y-3 text-left text-sm">
          <div className="flex justify-between border-b border-gray-200 pb-2 underline">
            <span>Today</span>
            <strong>{formatPrice(revenue)}</strong>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2 underline">
            <span>Last 7 days</span>
            <strong>{formatPrice(revenue)}</strong>
          </div>
          <div className="flex justify-between underline">
            <span>Last 31 days</span>
            <strong>{formatPrice(revenue)}</strong>
          </div>
        </div>
        <p className="mt-5 text-left text-xs leading-5 text-gray-500">
          Performance statistics are rounded to the nearest tenth. Data includes
          shipping and sales tax.
        </p>
      </div>
    </div>
  );
}
function DashboardSkeleton() {
  return (
    <div className="mt-7 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-xl bg-gray-200"
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
    </div>
  );
}
