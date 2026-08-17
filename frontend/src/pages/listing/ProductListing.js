import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import StarRating from "../../components/StarRating";
import api from "../../services/api";

const formatPrice = (value = 0) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
const conditionLabels = { new: "New", like_new: "Like New", good: "Pre-owned", acceptable: "Acceptable" };

function ProductListing() {
  const [params, setParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("best");
  const [view, setView] = useState("list");
  const [conditions, setConditions] = useState([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "");
  const search = params.get("search") || "";
  const category = params.get("category") || "";

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("");
      try {
        const query = { limit: 50 };
        if (search) query.search = search;
        if (category) query.category = category;
        if (params.get("minPrice")) query.minPrice = params.get("minPrice");
        if (params.get("maxPrice")) query.maxPrice = params.get("maxPrice");
        const response = await api.get("/listings", { params: query });
        setListings(response.data.listings || []);
        setTotal(response.data.total || 0);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "We couldn't load these results.");
      } finally { setLoading(false); }
    };
    load();
  }, [category, params, search]);

  const results = useMemo(() => listings
    .filter((item) => !conditions.length || conditions.includes(item.condition))
    .filter((item) => !featuredOnly || item.isFeatured)
    .sort((a, b) => {
      if (sort === "price-low") return a.pricing.fixedPrice - b.pricing.fixedPrice;
      if (sort === "price-high") return b.pricing.fixedPrice - a.pricing.fixedPrice;
      if (sort === "newly-listed") return new Date(b.createdAt) - new Date(a.createdAt);
      return Number(b.isFeatured) - Number(a.isFeatured);
    }), [conditions, featuredOnly, listings, sort]);

  const applyPrice = () => {
    const next = Object.fromEntries(params.entries());
    if (minPrice) next.minPrice = minPrice; else delete next.minPrice;
    if (maxPrice) next.maxPrice = maxPrice; else delete next.maxPrice;
    setParams(next);
  };
  const clearFilters = () => { setConditions([]); setFeaturedOnly(false); setMinPrice(""); setMaxPrice(""); const next = {}; if (search) next.search = search; if (category) next.category = category; setParams(next); };

  return <div className="min-h-screen bg-white"><Navbar />
    <main className="mx-auto max-w-screen-2xl px-5 py-6 lg:px-8">
      <div className="mb-5 flex items-center gap-2 text-xs text-gray-500"><Link to="/" className="hover:underline">Home</Link><span>›</span><span>{category || "All categories"}</span></div>
      <div className="grid gap-8 lg:grid-cols-[245px_1fr]">
        <aside className="hidden border-r border-gray-200 pr-7 lg:block">
          <FilterGroup title="Category"><Link to="/listings" className="font-semibold hover:underline">All categories</Link>{["Electronics", "Fashion", "Collectibles and art", "Sports", "Home and garden"].map((item) => <button key={item} className="block py-1.5 text-left text-sm hover:underline">{item}</button>)}</FilterGroup>
          <FilterGroup title="Condition">{Object.entries(conditionLabels).map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-2 py-1.5 text-sm"><input type="checkbox" checked={conditions.includes(value)} onChange={() => setConditions((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} className="h-4 w-4" />{label}</label>)}</FilterGroup>
          <FilterGroup title="Price"><div className="flex items-center gap-2"><input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="Min" className="w-20 rounded-full border px-3 py-2 text-sm" /><span>to</span><input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="Max" className="w-20 rounded-full border px-3 py-2 text-sm" /><button onClick={applyPrice} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white">›</button></div></FilterGroup>
          <FilterGroup title="Buying format"><label className="flex items-center gap-2 py-1.5 text-sm"><input type="radio" defaultChecked /> Buy It Now</label><label className="flex items-center gap-2 py-1.5 text-sm"><input type="radio" /> Auction</label></FilterGroup>
          <FilterGroup title="Show only"><label className="flex cursor-pointer items-center gap-2 py-1.5 text-sm"><input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} /> Featured listings</label><label className="flex items-center gap-2 py-1.5 text-sm"><input type="checkbox" /> Free returns</label><label className="flex items-center gap-2 py-1.5 text-sm"><input type="checkbox" /> Completed items</label></FilterGroup>
          <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline">Clear all filters</button>
        </aside>

        <section className="min-w-0">
          <h1 className="text-2xl font-bold">{search ? `${total}+ results for “${search}”` : category || "All Listings"}</h1>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-4">
            <div className="flex gap-2"><button className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white">All Listings</button><button className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50">Accepts Offers</button><button className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50">Auction</button></div>
            <div className="flex items-center gap-2"><select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border px-4 py-2 text-sm"><option value="best">Best Match</option><option value="newly-listed">Time: newly listed</option><option value="price-low">Price + Shipping: lowest first</option><option value="price-high">Price + Shipping: highest first</option></select><div className="overflow-hidden rounded-full border"><button onClick={() => setView("list")} className={`px-3 py-2 ${view === "list" ? "bg-gray-200" : ""}`}>☰</button><button onClick={() => setView("grid")} className={`px-3 py-2 ${view === "grid" ? "bg-gray-200" : ""}`}>▦</button></div></div>
          </div>
          {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-600">{error}</p>}
          {loading ? <div className="mt-6 space-y-4">{[1,2,3,4].map((item) => <div key={item} className="h-56 animate-pulse rounded-xl bg-gray-100" />)}</div> : !results.length ? <div className="py-24 text-center"><h2 className="text-2xl font-bold">No exact matches found</h2><p className="mt-2 text-gray-500">Try removing some filters or searching for something else.</p><button onClick={clearFilters} className="mt-5 rounded-full border border-gray-900 px-6 py-3 font-semibold">Clear filters</button></div> : <div className={view === "grid" ? "mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "divide-y divide-gray-200"}>{results.map((listing) => <ResultCard key={listing._id} listing={listing} grid={view === "grid"} />)}</div>}
        </section>
      </div>
    </main>
  </div>;
}

function FilterGroup({ title, children }) { return <div className="border-b border-gray-200 py-5"><h2 className="mb-3 font-bold">{title}</h2>{children}</div>; }
function ResultCard({ listing, grid }) {
  const [watched, setWatched] = useState(false);
  return <article className={grid ? "relative rounded-xl border border-gray-200 p-3" : "relative grid gap-5 py-5 sm:grid-cols-[240px_1fr]"}>
    <Link to={`/listing/${listing._id}`} className={`block overflow-hidden rounded-xl bg-gray-100 ${grid ? "h-56" : "h-56"}`}>{listing.images?.[0] ? <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-contain p-3" /> : <div className="flex h-full items-center justify-center text-gray-400">No image</div>}</Link>
    <div className={grid ? "pt-4" : "py-1 pr-10"}><Link to={`/listing/${listing._id}`} className="line-clamp-2 text-lg hover:text-blue-600 hover:underline">{listing.title}</Link><p className="mt-1 text-sm text-gray-500">{conditionLabels[listing.condition] || listing.condition}</p>{listing.subtitle && <p className="mt-2 line-clamp-1 text-sm text-gray-600">{listing.subtitle}</p>}<p className="mt-4 text-2xl font-bold">{formatPrice(listing.pricing?.fixedPrice)}</p><p className="mt-1 text-sm">Free shipping</p><p className="mt-3 text-xs text-gray-500">Seller: {listing.sellerId?.username || "seller"}</p>{listing.reviews?.reviewCount > 0 && <div className="mt-2 flex items-center gap-1"><StarRating value={listing.reviews.averageRating} /><span className="text-xs text-gray-500">{listing.reviews.reviewCount}</span></div>}{listing.isFeatured && <span className="mt-3 inline-block bg-gray-100 px-2 py-1 text-xs font-semibold">SPONSORED</span>}</div>
    <button onClick={() => setWatched((current) => !current)} aria-label="Add to Watchlist" className="absolute right-3 top-6 text-3xl">{watched ? "♥" : "♡"}</button>
  </article>;
}

export default ProductListing;
