import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SellerHubHeader from "../components/SellerHubHeader";
import { deleteListing, getMyListings, toggleListing } from "../services/sellerService";

const formatPrice = (value = 0) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
const formatDate = (value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function SellerInventory() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("active");
  const [selected, setSelected] = useState([]);
  const [updating, setUpdating] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    if (user.role !== "seller") { navigate("/seller/register-notice"); return; }
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const loadListings = async () => {
    setLoading(true); setError("");
    try { const response = await getMyListings(); setListings(response.data.success ? response.data.data : []); }
    catch (requestError) { setError(requestError.response?.data?.message || "Unable to load listings."); }
    finally { setLoading(false); }
  };

  const counts = useMemo(() => ({
    active: listings.filter((item) => item.status === "active").length,
    unsold: listings.filter((item) => item.status !== "active").length,
    drafts: 0,
  }), [listings]);

  const visibleListings = useMemo(() => listings.filter((item) => {
    if (tab === "active" && item.status !== "active") return false;
    if (tab === "unsold" && item.status === "active") return false;
    if (tab === "drafts") return false;
    const needle = query.trim().toLowerCase();
    return !needle || item.title?.toLowerCase().includes(needle) || item._id.toLowerCase().includes(needle);
  }), [listings, query, tab]);

  const handleToggle = async (id) => {
    setUpdating(id); setError("");
    try { await toggleListing(id); await loadListings(); setSelected((current) => current.filter((item) => item !== id)); }
    catch (requestError) { setError(requestError.response?.data?.message || "Unable to change listing status."); }
    finally { setUpdating(""); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing permanently?")) return;
    setUpdating(id); setError("");
    try { await deleteListing(id); setListings((current) => current.filter((item) => item._id !== id)); setSelected((current) => current.filter((item) => item !== id)); }
    catch (requestError) { setError(requestError.response?.data?.message || "Unable to delete listing."); }
    finally { setUpdating(""); }
  };

  const handleAction = (item, action) => {
    if (action === "view") navigate(`/listing/${item._id}`);
    if (action === "edit") navigate(`/seller/listings/${item._id}/edit`);
    if (action === "toggle") handleToggle(item._id);
    if (action === "delete") handleDelete(item._id);
  };

  const toggleAll = () => setSelected(selected.length === visibleListings.length ? [] : visibleListings.map((item) => item._id));
  if (authLoading || !user || user.role !== "seller") return null;

  return <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
    <SellerHubHeader active="listings" user={user} />
    <main className="mx-auto max-w-screen-2xl px-5 py-9 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Listings</h1><p className="mt-2 text-sm text-gray-600">Create and manage your active, unsold, and draft listings.</p></div><div className="flex gap-3"><button onClick={loadListings} className="rounded-full border border-gray-600 px-5 py-2.5 text-sm font-semibold hover:bg-white">Refresh</button><Link to="/sell/start" className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Create listing</Link></div></div>

      <section className="mt-7 grid gap-4 sm:grid-cols-3"><Metric label="Active listings" value={counts.active} detail="Currently visible to buyers" /><Metric label="Unsold listings" value={counts.unsold} detail="Ended or hidden" /><Metric label="Drafts" value={counts.drafts} detail="Not published yet" /></section>

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-300 bg-white">
        <nav className="flex overflow-x-auto border-b border-gray-300 px-4">{[["active","Active"],["unsold","Unsold"],["drafts","Drafts"]].map(([value,label]) => <button key={value} onClick={() => { setTab(value); setSelected([]); }} className={`whitespace-nowrap border-b-4 px-5 py-4 text-sm font-semibold ${tab === value ? "border-blue-600 text-blue-700" : "border-transparent"}`}>{label} ({counts[value]})</button>)}</nav>

        <div className="flex flex-col gap-4 border-b border-gray-300 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title or item number" className="w-full rounded-full border border-gray-500 py-3 pl-5 pr-12 outline-none focus:border-blue-600" /><span className="absolute right-5 top-3 text-xl">⌕</span></div>
          <div className="flex flex-wrap gap-2"><button className="rounded-full border px-4 py-2 text-sm font-semibold">Category: All</button><button className="rounded-full border px-4 py-2 text-sm font-semibold">Format: All</button><button className="rounded-full border px-4 py-2 text-sm font-semibold">Sort: Start date</button></div>
        </div>

        {selected.length > 0 && <div className="flex flex-wrap items-center gap-3 border-b bg-blue-50 px-5 py-3"><span className="text-sm font-semibold">{selected.length} selected</span><button className="rounded-full border border-gray-500 bg-white px-4 py-2 text-sm font-semibold">Edit</button><button className="rounded-full border border-gray-500 bg-white px-4 py-2 text-sm font-semibold">Promote</button><button onClick={() => selected.forEach((id) => handleToggle(id))} className="rounded-full border border-gray-500 bg-white px-4 py-2 text-sm font-semibold">{tab === "active" ? "End listings" : "Relist"}</button></div>}
        {error && <p className="m-5 rounded-lg bg-red-50 p-4 text-red-600">{error}</p>}

        {loading ? <div className="space-y-4 p-5">{[1,2,3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-gray-100" />)}</div> : visibleListings.length === 0 ? <div className="px-6 py-24 text-center"><h2 className="text-2xl font-bold">No {tab} listings</h2><p className="mt-2 text-gray-500">{tab === "active" ? "Create a listing to start selling." : `Your ${tab} listings will appear here.`}</p>{tab === "active" && <Link to="/sell/start" className="mt-6 inline-block rounded-full bg-blue-600 px-7 py-3 font-bold text-white">Create listing</Link>}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[1050px] border-collapse text-left text-sm"><thead><tr className="border-b bg-gray-50 text-xs uppercase text-gray-500"><th className="w-14 p-4"><input type="checkbox" checked={selected.length === visibleListings.length && visibleListings.length > 0} onChange={toggleAll} className="h-4 w-4" /></th><th className="p-4">Listing</th><th className="p-4">Price</th><th className="p-4">Available quantity</th><th className="p-4">Views</th><th className="p-4">Start date</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-200">{visibleListings.map((item) => <ListingRow key={item._id} item={item} selected={selected.includes(item._id)} updating={updating === item._id} onSelect={() => setSelected((current) => current.includes(item._id) ? current.filter((id) => id !== item._id) : [...current, item._id])} onAction={(action) => handleAction(item, action)} />)}</tbody></table></div>}
      </section>
    </main>
  </div>;
}

function Metric({ label, value, detail }) { return <div className="rounded-xl border border-gray-300 bg-white p-5"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-2 text-xs text-gray-500">{detail}</p></div>; }
function ListingRow({ item, selected, updating, onSelect, onAction }) { return <tr className={selected ? "bg-blue-50" : "hover:bg-gray-50"}><td className="p-4 align-top"><input type="checkbox" checked={selected} onChange={onSelect} className="mt-4 h-4 w-4" /></td><td className="p-4"><div className="flex min-w-[330px] gap-4"><Link to={`/listing/${item._id}`} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">{item.images?.[0] ? <img src={item.images[0]} alt={item.title} className="h-full w-full object-contain p-1" /> : <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>}</Link><div><Link to={`/listing/${item._id}`} className="line-clamp-2 max-w-sm font-semibold text-blue-700 hover:underline">{item.title}</Link><p className="mt-2 text-xs text-gray-500">Item #{item._id.slice(-12).toUpperCase()}</p><p className="mt-1 text-xs text-gray-500">Buy It Now</p></div></div></td><td className="p-4 align-top font-semibold">{formatPrice(item.pricing?.fixedPrice)}</td><td className="p-4 align-top">{item.totalQuantity}</td><td className="p-4 align-top">{item.stats?.views || 0}</td><td className="p-4 align-top">{formatDate(item.createdAt)}</td><td className="p-4 align-top"><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>{item.status === "active" ? "Active" : "Ended"}</span></td><td className="p-4 text-right align-top"><select disabled={updating} defaultValue="" onChange={(event) => { if (event.target.value) onAction(event.target.value); event.target.value = ""; }} className="rounded-full border border-gray-500 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"><option value="">Actions</option><option value="edit">Edit listing</option><option value="view">View listing</option><option value="toggle">{item.status === "active" ? "End listing" : "Relist"}</option><option value="delete">Delete</option></select></td></tr>; }

export default SellerInventory;
