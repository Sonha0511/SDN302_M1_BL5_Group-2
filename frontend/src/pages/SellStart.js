import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import shoesImg from "../assets/images/shoes.png";

const steps = [
  { number: 1, title: "Share item details", text: "Use keywords such as the brand, model, size, color, or unique information." },
  { number: 2, title: "Find a match", text: "We'll help you identify the item and prepare the right listing details." },
  { number: 3, title: "Edit and list", text: "Preview the information, add photos and pricing, then publish your item." },
];

function SellStart() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const continueListing = (event) => {
    event.preventDefault();
    if (!query.trim()) { setError("Tell us what you're selling to continue."); return; }
    if (!user) { navigate("/login"); return; }
    if (user.role !== "seller") { navigate("/register"); return; }
    navigate("/seller/listings", { state: { createListing: true, suggestedTitle: query.trim() } });
  };

  if (loading) return null;

  return <div className="flex min-h-screen flex-col bg-[#f7f7f7] text-gray-900">
    <header className="border-b border-gray-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"><Link to="/" className="text-4xl font-bold italic tracking-tighter"><span className="text-red-600">e</span><span className="text-blue-600">b</span><span className="text-yellow-500">a</span><span className="text-green-600">y</span></Link><Link to="/sell" className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-400 font-bold">?</Link></div></header>
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14 lg:py-20"><h1 className="text-3xl font-bold">Start your listing</h1><form onSubmit={continueListing} className="mt-8"><div className="flex gap-3"><input autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setError(""); }} placeholder="Tell us what you're selling" className="h-14 flex-1 rounded-xl border border-gray-500 bg-white px-5 text-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" /><button aria-label="Search and continue" className="flex h-14 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl text-white hover:bg-blue-700">⌕</button></div>{error && <p className="mt-2 text-sm text-red-600">{error}</p>}</form>
      <div className="mt-16 grid gap-5 md:grid-cols-3">{steps.map((step, index) => <article key={step.number} className="flex min-h-[310px] flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div className={`mb-7 flex h-32 items-center justify-center overflow-hidden rounded-xl ${index === 0 ? "bg-blue-50" : index === 1 ? "bg-purple-50" : "bg-gray-100"}`}><img src={shoesImg} alt="" className="h-full w-full object-contain" /></div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Step {step.number}</p><h2 className="mt-2 text-xl font-bold">{step.title}</h2><p className="mt-2 leading-6 text-gray-600">{step.text}</p></article>)}</div>
    </main><footer className="border-t border-gray-200 bg-white px-6 py-7 text-center text-xs text-gray-500">Copyright © 1995–2026 eBay Inc. All Rights Reserved. · Accessibility · User Agreement · Privacy</footer>
  </div>;
}

export default SellStart;
