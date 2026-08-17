import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const formatPrice = (value = 0) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
const formatDate = (value, options = {}) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", ...options });
const progressSteps = ["awaiting_payment", "awaiting_shipment", "shipped", "delivered"];
const copy = {
  pending: ["Order placed", "We've received your order."],
  awaiting_payment: ["Awaiting payment", "Complete payment so the seller can prepare your item."],
  awaiting_shipment: ["Paid", "The seller is preparing your item for shipment."],
  shipped: ["Shipped", "Your item is on its way."],
  delivered: ["Delivered", "Your item has been delivered."],
  cancelled: ["Order cancelled", "This order was cancelled."],
  returned: ["Item returned", "The return process has started."],
};

function OrderDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    const load = async () => {
      setLoading(true); setError("");
      try { const response = await api.get(`/orders/${id}`); setOrder(response.data); }
      catch (requestError) { setError(requestError.response?.data?.message || "We couldn't find this order."); }
      finally { setLoading(false); }
    };
    load();
  }, [authLoading, id, navigate, user]);

  const cancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true); setError("");
    try { const response = await api.patch(`/orders/${id}/cancel`); setOrder(response.data); }
    catch (requestError) { setError(requestError.response?.data?.message || "This order can't be cancelled."); }
    finally { setCancelling(false); }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-white"><Navbar /><main className="mx-auto max-w-5xl px-6 py-10"><div className="h-9 w-60 animate-pulse rounded bg-gray-200" /><div className="mt-7 h-72 animate-pulse rounded-xl bg-gray-100" /><div className="mt-5 h-80 animate-pulse rounded-xl bg-gray-100" /></main></div>;
  if (!order) return <div className="min-h-screen bg-white"><Navbar /><main className="mx-auto max-w-4xl px-6 py-24 text-center"><h1 className="text-2xl font-bold">Order not found</h1><p className="mt-3 text-gray-500">{error}</p><Link to="/my-orders" className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 font-bold text-white">Back to purchase history</Link></main></div>;

  const buyerId = order.buyerId?._id || order.buyerId;
  const isBuyer = String(buyerId) === String(user?._id);
  const listingId = order.listingId?._id || order.listingId;
  const image = order.listingImage || order.listingId?.images?.[0];
  const inactive = ["cancelled", "returned"].includes(order.status);
  const currentStep = progressSteps.indexOf(order.status);
  const canCancel = isBuyer && ["pending", "awaiting_payment", "awaiting_shipment"].includes(order.status);
  const canReview = isBuyer && order.status === "delivered" && !order.isReviewed;
  const [heading, description] = copy[order.status] || copy.pending;
  const estimatedDate = new Date(order.createdAt); estimatedDate.setDate(estimatedDate.getDate() + 5);

  return <div className="min-h-screen bg-white"><Navbar />
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
      {searchParams.get("success") === "true" && <div className="mb-6 flex gap-3 rounded-xl border border-green-300 bg-green-50 p-5 text-green-800"><span className="text-2xl">✓</span><div><p className="font-bold">Your order is confirmed</p><p className="mt-1 text-sm">We'll send updates when the seller ships your item.</p></div></div>}
      <div className="mb-6 flex items-center gap-2 text-sm"><Link to="/my-orders" className="text-blue-600 hover:underline">Purchase history</Link><span className="text-gray-400">›</span><span>Order details</span></div>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Order details</h1><p className="mt-2 text-sm text-gray-500">Order number {order._id.slice(-12).toUpperCase()} · Placed {formatDate(order.createdAt)}</p></div><button className="text-sm font-semibold hover:underline">Print order details</button></div>
      {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-600">{error}</p>}

      <section className={`mt-7 rounded-xl border p-6 ${inactive ? "border-red-200 bg-red-50" : "border-gray-300"}`}>
        <h2 className={`text-2xl font-bold ${inactive ? "text-red-700" : ""}`}>{heading}</h2><p className="mt-2 text-gray-600">{description}</p>
        {!inactive && <><div className="relative mt-9"><div className="absolute left-4 right-4 top-4 h-1 bg-gray-200" /><div className="absolute left-4 top-4 h-1 bg-blue-600 transition-all" style={{ width: `${Math.max(0, currentStep) / (progressSteps.length - 1) * 100}%` }} /><div className="relative grid grid-cols-4">{[["Payment","awaiting_payment"],["Preparing","awaiting_shipment"],["Shipped","shipped"],["Delivered","delivered"]].map(([label, value], index) => <div key={value} className={`flex flex-col ${index === 0 ? "items-start" : index === 3 ? "items-end" : "items-center"}`}><span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold ${index <= currentStep ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-400"}`}>{index <= currentStep ? "✓" : index + 1}</span><span className={`mt-2 text-xs font-semibold ${index <= currentStep ? "text-blue-700" : "text-gray-400"}`}>{label}</span></div>)}</div></div><div className="mt-7 rounded-lg bg-gray-50 p-4"><p className="text-sm font-bold">Estimated delivery: {formatDate(estimatedDate)}</p><p className="mt-1 text-sm text-gray-500">Tracking will appear here after the seller ships your item.</p>{order.status === "shipped" && <button className="mt-3 font-semibold text-blue-600 hover:underline">Track package</button>}</div></>}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_310px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-gray-300"><div className="flex items-center justify-between border-b bg-gray-50 px-5 py-4"><h2 className="font-bold">Your item</h2><span className="text-sm text-gray-500">Sold by <Link to={`/seller/${order.sellerId?._id || order.sellerId}`} className="text-blue-600 hover:underline">{order.sellerId?.username || "seller"}</Link></span></div><div className="grid gap-5 p-5 sm:grid-cols-[150px_1fr]"><Link to={`/listing/${listingId}`} className="h-36 overflow-hidden rounded-lg bg-gray-100">{image ? <img src={image} alt={order.listingTitle} className="h-full w-full object-contain p-2" /> : <div className="flex h-full items-center justify-center text-gray-400">No image</div>}</Link><div><Link to={`/listing/${listingId}`} className="text-lg font-semibold text-blue-700 hover:underline">{order.listingTitle}</Link><p className="mt-3 text-sm text-gray-500">Quantity: {order.quantity}</p><p className="mt-1 text-sm text-gray-500">Item price: {formatPrice(order.pricing?.itemPrice)}</p><div className="mt-5 flex flex-wrap gap-2"><Link to={`/listing/${listingId}`} className="rounded-full border border-gray-500 px-5 py-2 text-sm font-semibold hover:bg-gray-50">View item</Link><Link to="/messages" className="rounded-full border border-gray-500 px-5 py-2 text-sm font-semibold hover:bg-gray-50">Contact seller</Link></div></div></div></section>
          <section className="rounded-xl border border-gray-300 p-5"><h2 className="text-lg font-bold">Shipping address</h2><div className="mt-4 text-sm leading-6 text-gray-600"><p className="font-semibold text-gray-900">{order.shippingAddress?.fullName || "Not provided"}</p><p>{order.shippingAddress?.street}</p><p>{order.shippingAddress?.city}{order.shippingAddress?.country ? `, ${order.shippingAddress.country}` : ""}</p><p>{order.shippingAddress?.phone}</p></div></section>
          <section className="rounded-xl border border-gray-300 p-5"><h2 className="text-lg font-bold">Payment information</h2><div className="mt-4 flex items-center justify-between text-sm"><div><p className="font-semibold">{order.paymentMethod}</p><p className="mt-1 capitalize text-gray-500">Payment status: {order.paymentMethod === "COD" && order.paymentStatus === "pending" ? "Pay on delivery" : order.paymentStatus}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{order.paymentStatus === "paid" ? "Paid" : "Pending"}</span></div></section>
        </div>

        <aside className="space-y-5"><section className="rounded-xl border border-gray-300 p-5"><h2 className="text-lg font-bold">Order summary</h2><dl className="mt-5 space-y-3 text-sm"><Summary label={`Item (${order.quantity})`} value={formatPrice(order.pricing?.subtotal)} /><Summary label="Shipping" value={order.pricing?.shippingCost ? formatPrice(order.pricing.shippingCost) : "Free"} /><div className="border-t pt-4"><Summary label="Order total" value={formatPrice(order.pricing?.total)} strong /></div></dl></section>
          {isBuyer && <section className="rounded-xl border border-gray-300 p-4"><div className="flex flex-col gap-2"><Link to="/messages" className="rounded-full border border-gray-600 px-5 py-2.5 text-center text-sm font-semibold hover:bg-gray-50">Contact seller</Link>{canReview && <Link to={`/review/${order._id}`} className="rounded-full bg-blue-600 px-5 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-700">Leave feedback</Link>}{!inactive && <Link to={`/disputes/create/${order._id}`} className="rounded-full border border-gray-600 px-5 py-2.5 text-center text-sm font-semibold hover:bg-gray-50">Return this item</Link>}{canCancel && <button onClick={cancelOrder} disabled={cancelling} className="rounded-full border border-gray-600 px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">{cancelling ? "Cancelling..." : "Cancel order"}</button>}</div></section>}
          <Link to="/my-orders" className="block text-center text-sm font-semibold text-blue-600 hover:underline">Back to purchase history</Link>
        </aside>
      </div>
    </main>
  </div>;
}

function Summary({ label, value, strong }) { return <div className={`flex justify-between gap-5 ${strong ? "text-base font-bold" : "text-gray-600"}`}><dt>{label}</dt><dd>{value}</dd></div>; }
export default OrderDetail;
