import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const formatPrice = (value = 0) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
const formatDate = (value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const statusLabels = { pending: "Order placed", awaiting_payment: "Awaiting payment", awaiting_shipment: "Preparing for shipment", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned" };

function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [cancelling, setCancelling] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    const load = async () => {
      setLoading(true); setError("");
      try { const response = await api.get("/orders/my"); setOrders(response.data || []); }
      catch (requestError) { setError(requestError.response?.data?.message || "We couldn't load your purchase history."); }
      finally { setLoading(false); }
    };
    load();
  }, [authLoading, navigate, user]);

  const years = useMemo(() => [...new Set(orders.map((order) => new Date(order.createdAt).getFullYear()))].sort((a, b) => b - a), [orders]);
  const visibleOrders = useMemo(() => orders.filter((order) => {
    if (year !== "all" && String(new Date(order.createdAt).getFullYear()) !== year) return false;
    if (status === "active" && ["delivered", "cancelled", "returned"].includes(order.status)) return false;
    if (status === "completed" && !["delivered", "returned"].includes(order.status)) return false;
    if (status === "cancelled" && order.status !== "cancelled") return false;
    const needle = query.trim().toLowerCase();
    return !needle || order.listingTitle?.toLowerCase().includes(needle) || order._id.toLowerCase().includes(needle) || order.sellerId?.username?.toLowerCase().includes(needle);
  }), [orders, query, status, year]);

  const cancelOrder = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(id);
    try { await api.patch(`/orders/${id}/cancel`); setOrders((current) => current.map((order) => order._id === id ? { ...order, status: "cancelled" } : order)); }
    catch (requestError) { setError(requestError.response?.data?.message || "This order can't be cancelled."); }
    finally { setCancelling(""); }
  };

  if (authLoading || !user) return null;

  return <div className="min-h-screen bg-white"><Navbar />
    <main className="mx-auto max-w-screen-xl px-5 py-8 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[210px_1fr]">
        <aside className="hidden lg:block"><h2 className="mb-5 text-xl font-bold">My eBay</h2><nav className="space-y-1 text-sm"><SideLink active>Purchase history</SideLink><SideLink>Buy Again</SideLink><SideLink>Saved searches</SideLink><SideLink>Saved sellers</SideLink><SideLink>Watchlist</SideLink><Link to="/messages" className="block rounded-lg px-3 py-2 hover:bg-gray-100">Messages</Link><Link to="/disputes/my" className="block rounded-lg px-3 py-2 hover:bg-gray-100">Requests and disputes</Link></nav></aside>

        <section className="min-w-0">
          <h1 className="text-3xl font-bold">Purchase history</h1>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your orders" className="w-full rounded-full border border-gray-500 py-3 pl-5 pr-12 outline-none focus:border-blue-600" /><span className="absolute right-5 top-3 text-xl">⌕</span></div>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-full border border-gray-500 px-5 py-3"><option value="all">See orders from all years</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </div>

          <div className="mt-7 flex gap-1 overflow-x-auto border-b border-gray-300">{[["all","All"],["active","Not shipped yet"],["completed","Completed"],["cancelled","Cancelled"]].map(([value,label]) => <button key={value} onClick={() => setStatus(value)} className={`whitespace-nowrap border-b-4 px-5 py-3 text-sm font-semibold ${status === value ? "border-blue-600 text-blue-700" : "border-transparent hover:border-gray-300"}`}>{label}</button>)}</div>
          <div className="flex items-center justify-between py-5"><p className="text-sm text-gray-500">{visibleOrders.length} order{visibleOrders.length === 1 ? "" : "s"}</p><button className="text-sm font-semibold hover:underline">Print purchase history</button></div>
          {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-red-600">{error}</p>}

          {loading ? <div className="space-y-5">{[1,2,3].map((item) => <div key={item} className="h-64 animate-pulse rounded-xl bg-gray-100" />)}</div> : !visibleOrders.length ? <div className="rounded-xl border py-24 text-center"><h2 className="text-2xl font-bold">You don't have any orders here</h2><p className="mt-2 text-gray-500">When you buy an item, it will appear in your purchase history.</p><Link to="/listings" className="mt-6 inline-block rounded-full bg-blue-600 px-7 py-3 font-bold text-white">Start shopping</Link></div> : <div className="space-y-5">{visibleOrders.map((order) => <OrderCard key={order._id} order={order} cancelling={cancelling} onCancel={cancelOrder} />)}</div>}
        </section>
      </div>
    </main>
  </div>;
}

function SideLink({ children, active }) { return <button className={`block w-full rounded-lg px-3 py-2 text-left ${active ? "bg-gray-200 font-bold" : "hover:bg-gray-100"}`}>{children}</button>; }
function OrderCard({ order, cancelling, onCancel }) {
  const listingId = order.listingId?._id || order.listingId;
  const image = order.listingImage || order.listingId?.images?.[0];
  const canCancel = ["pending", "awaiting_payment", "awaiting_shipment"].includes(order.status);
  const canReview = order.status === "delivered" && !order.isReviewed;
  const canDispute = !["cancelled", "returned"].includes(order.status);
  return <article className="overflow-hidden rounded-xl border border-gray-300 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-5 py-4 text-sm"><div><span className="font-semibold">Order date</span> {formatDate(order.createdAt)} <span className="mx-3 text-gray-300">|</span><span className="font-semibold">Order total</span> {formatPrice(order.pricing?.total)}</div><div className="text-gray-600">Order number: {order._id.slice(-12).toUpperCase()} <button className="ml-3 font-semibold text-blue-600 hover:underline">More actions⌄</button></div></div>
    <div className="border-t px-5 py-5"><h2 className="text-xl font-bold">{statusLabels[order.status] || "Order placed"}</h2><p className="mt-1 text-sm text-gray-500">Sold by <Link to={`/seller/${order.sellerId?._id || order.sellerId}`} className="text-blue-600 hover:underline">{order.sellerId?.username || "seller"}</Link></p>
      <div className="mt-5 grid gap-5 sm:grid-cols-[130px_1fr] lg:grid-cols-[130px_1fr_190px]">
        <Link to={`/listing/${listingId}`} className="h-32 overflow-hidden rounded-lg bg-gray-100">{image ? <img src={image} alt={order.listingTitle} className="h-full w-full object-contain p-2" /> : <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>}</Link>
        <div><Link to={`/listing/${listingId}`} className="font-semibold text-blue-700 hover:underline">{order.listingTitle}</Link><p className="mt-3 text-sm text-gray-500">Quantity: {order.quantity}</p><p className="mt-1 text-sm text-gray-500">Payment: {order.paymentMethod}</p><p className="mt-4 font-bold">{formatPrice(order.pricing?.total)}</p></div>
        <div className="flex flex-col gap-2"><Link to={`/orders/${order._id}`} className="rounded-full bg-blue-600 px-5 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-700">View order details</Link>{canReview && <Link to={`/review/${order._id}`} className="rounded-full border border-blue-600 px-5 py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50">Leave feedback</Link>}{order.isReviewed && <span className="rounded-full bg-green-50 px-5 py-2.5 text-center text-sm font-semibold text-green-700">Feedback left</span>}<Link to="/messages" className="rounded-full border border-gray-500 px-5 py-2.5 text-center text-sm font-semibold hover:bg-gray-50">Contact seller</Link>{canDispute && <Link to={`/disputes/create/${order._id}`} className="rounded-full border border-gray-500 px-5 py-2.5 text-center text-sm font-semibold hover:bg-gray-50">Return or dispute</Link>}{canCancel && <button onClick={() => onCancel(order._id)} disabled={cancelling === order._id} className="rounded-full border border-gray-500 px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">{cancelling === order._id ? "Cancelling..." : "Cancel order"}</button>}</div>
      </div>
    </div>
  </article>;
}

export default MyOrders;
