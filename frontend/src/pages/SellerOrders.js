import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyOrders, updateOrderStatus } from "../services/sellerService";
import { useAuth } from "../context/AuthContext";
import SellerHubHeader from "../components/SellerHubHeader";

const formatPrice = (value = 0) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
const formatDate = (value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const statusCopy = {
  pending: "Pending",
  awaiting_payment: "Awaiting payment",
  awaiting_shipment: "Awaiting shipment",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};
const statusStyle = {
  awaiting_payment: "bg-yellow-100 text-yellow-800",
  awaiting_shipment: "bg-orange-100 text-orange-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-700",
  returned: "bg-purple-100 text-purple-800",
};

export default function SellerOrders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [updating, setUpdating] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    if (user.role !== "seller") { navigate("/"); return; }
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const loadOrders = async () => {
    setLoading(true); setError("");
    try { const response = await getMyOrders(); setOrders(response.data.success ? response.data.data : []); }
    catch (requestError) { setError(requestError.response?.data?.message || "We couldn't load your orders."); }
    finally { setLoading(false); }
  };

  const counts = useMemo(() => ({
    all: orders.length,
    awaiting_shipment: orders.filter((item) => item.status === "awaiting_shipment").length,
    shipped: orders.filter((item) => item.status === "shipped").length,
    delivered: orders.filter((item) => item.status === "delivered").length,
    cancelled: orders.filter((item) => ["cancelled", "returned"].includes(item.status)).length,
  }), [orders]);

  const visibleOrders = useMemo(() => orders.filter((order) => {
    if (activeTab === "cancelled" && !["cancelled", "returned"].includes(order.status)) return false;
    if (activeTab !== "all" && activeTab !== "cancelled" && order.status !== activeTab) return false;
    const needle = query.trim().toLowerCase();
    return !needle || order.listingTitle?.toLowerCase().includes(needle) || order._id.toLowerCase().includes(needle) || order.shippingAddress?.fullName?.toLowerCase().includes(needle);
  }), [activeTab, orders, query]);

  const changeStatus = async (orderId, status) => {
    setUpdating(orderId); setError("");
    try {
      const response = await updateOrderStatus(orderId, status);
      if (response.data.success) setOrders((current) => current.map((order) => order._id === orderId ? { ...order, status } : order));
    } catch (requestError) { setError(requestError.response?.data?.message || "Unable to update this order."); }
    finally { setUpdating(""); }
  };

  if (authLoading || !user || user.role !== "seller") return null;

  return <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
    <SellerHubHeader active="orders" user={user} />

    <main className="mx-auto max-w-screen-2xl px-6 py-9">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Orders</h1><p className="mt-2 text-sm text-gray-600">Manage shipping, delivery, cancellations, and buyer requests.</p></div><div className="flex gap-3"><button onClick={loadOrders} className="rounded-full border border-gray-600 px-5 py-2.5 text-sm font-semibold hover:bg-white">Refresh</button><button className="rounded-full border border-gray-600 px-5 py-2.5 text-sm font-semibold hover:bg-white">Download report</button></div></div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Awaiting shipment" value={counts.awaiting_shipment} accent="text-orange-700" /><Metric label="Shipped" value={counts.shipped} accent="text-blue-700" /><Metric label="Delivered" value={counts.delivered} accent="text-green-700" /><Metric label="Cancelled / returned" value={counts.cancelled} accent="text-gray-700" /></section>

      <section className="mt-6 rounded-xl border border-gray-300 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-300 p-5 lg:flex-row lg:items-center lg:justify-between"><div className="relative w-full max-w-xl"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order number, buyer, or item" className="w-full rounded-full border border-gray-500 py-3 pl-5 pr-12 outline-none focus:border-blue-600" /><span className="absolute right-5 top-3 text-xl">⌕</span></div><div className="flex gap-2"><button className="rounded-full border px-4 py-2 text-sm font-semibold">Date: All</button><button className="rounded-full border px-4 py-2 text-sm font-semibold">Shipping: All</button></div></div>
        <div className="flex gap-1 overflow-x-auto border-b border-gray-300 px-4">{[["all","All orders"],["awaiting_shipment","Awaiting shipment"],["shipped","Shipped"],["delivered","Delivered"],["cancelled","Cancelled"]].map(([value,label]) => <button key={value} onClick={() => setActiveTab(value)} className={`whitespace-nowrap border-b-4 px-4 py-4 text-sm font-semibold ${activeTab === value ? "border-blue-600 text-blue-700" : "border-transparent"}`}>{label} ({counts[value] || 0})</button>)}</div>
        {error && <p className="m-5 rounded-lg bg-red-50 p-4 text-red-600">{error}</p>}
        {loading ? <div className="space-y-4 p-5">{[1,2,3].map((item) => <div key={item} className="h-40 animate-pulse rounded-xl bg-gray-100" />)}</div> : visibleOrders.length === 0 ? <div className="px-6 py-24 text-center"><h2 className="text-2xl font-bold">No orders found</h2><p className="mt-2 text-gray-500">Orders matching this filter will appear here.</p></div> : <div className="divide-y divide-gray-200">{visibleOrders.map((order) => <OrderRow key={order._id} order={order} updating={updating} onStatusChange={changeStatus} />)}</div>}
      </section>
    </main>
  </div>;
}

function Metric({ label, value, accent }) { return <div className="rounded-xl border border-gray-300 bg-white p-5"><p className="text-sm text-gray-500">{label}</p><p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p></div>; }
function OrderRow({ order, updating, onStatusChange }) {
  const listingId = order.listingId?._id || order.listingId;
  const buyer = order.buyerId?.username || order.shippingAddress?.fullName || "Buyer";
  return <article>
    <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-5 py-3 text-xs text-gray-600"><div><span className="font-bold text-gray-900">Order #{order._id.slice(-12).toUpperCase()}</span><span className="mx-3 text-gray-300">|</span>Sold {formatDate(order.createdAt)}</div><Link to={`/orders/${order._id}`} className="font-semibold text-blue-600 hover:underline">View order details</Link></div>
    <div className="grid gap-5 px-5 py-5 md:grid-cols-[90px_1fr_180px] xl:grid-cols-[90px_1fr_180px_220px]">
      <Link to={`/listing/${listingId}`} className="h-24 overflow-hidden rounded-lg bg-gray-100">{order.listingImage ? <img src={order.listingImage} alt={order.listingTitle} className="h-full w-full object-contain p-2" /> : <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>}</Link>
      <div><Link to={`/listing/${listingId}`} className="font-semibold text-blue-700 hover:underline">{order.listingTitle}</Link><p className="mt-2 text-sm text-gray-500">Buyer: {buyer}</p><p className="mt-1 text-sm text-gray-500">Quantity: {order.quantity}</p><p className="mt-3 font-bold">{formatPrice(order.pricing?.total)}</p></div>
      <div><p className="text-xs font-semibold uppercase text-gray-500">Ship to</p><p className="mt-2 text-sm font-semibold">{order.shippingAddress?.fullName}</p><p className="mt-1 text-xs leading-5 text-gray-500">{order.shippingAddress?.street}<br />{order.shippingAddress?.city}, {order.shippingAddress?.country}</p></div>
      <div className="flex flex-col gap-3"><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyle[order.status] || "bg-gray-100 text-gray-700"}`}>{statusCopy[order.status] || order.status}</span><select disabled={updating === order._id || ["cancelled","returned"].includes(order.status)} value={order.status} onChange={(e) => onStatusChange(order._id, e.target.value)} className="rounded-lg border border-gray-400 bg-white px-3 py-2 text-sm disabled:bg-gray-100"><option value="awaiting_shipment">Awaiting shipment</option><option value="shipped">Mark as shipped</option><option value="delivered">Mark as delivered</option><option value="cancelled">Cancel order</option></select><div className="flex gap-4 text-sm"><Link to="/messages" className="font-semibold text-blue-600 hover:underline">Contact buyer</Link><button className="font-semibold hover:underline">More actions</button></div></div>
    </div>
  </article>;
}
