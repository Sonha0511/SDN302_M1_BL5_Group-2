import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createListing } from "../services/sellerService";

const Logo = () => <span className="text-5xl font-bold italic tracking-tighter"><span className="text-red-600">e</span><span className="text-blue-600">b</span><span className="text-yellow-500">a</span><span className="text-green-600">y</span></span>;
const Field = ({ label, children, hint }) => <div><label className="mb-2 block text-sm font-medium text-gray-800">{label}</label>{children}{hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}</div>;
const inputClass = "w-full rounded-lg border border-gray-500 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

const conditions = [
  ["new", "New with box", "Brand new, unused and defect-free with original packaging and accessories."],
  ["new", "New without box", "Brand new and unused, with accessories but missing the original box."],
  ["like_new", "New with defects", "Unused with minor cosmetic defects, missing accessories, or damaged packaging."],
  ["like_new", "Pre-owned · Excellent", "Like new, with no visible flaws or signs of use."],
  ["good", "Pre-owned · Good", "Gently used with moderate signs of wear and/or visible flaws."],
  ["acceptable", "Pre-owned · Fair", "Significant visible flaws, heavy signs of use, or missing components."],
];

function SellerListings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const initialTitle = location.state?.suggestedTitle || "";
  const [step, setStep] = useState("match");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: initialTitle,
    subtitle: "",
    description: "",
    condition: "new",
    fixedPrice: "",
    pricingFormat: "auction",
    auctionDuration: "7 days",
    startingBid: "",
    buyItNowPrice: "",
    reservePrice: "",
    immediatePayment: false,
    scheduled: false,
    totalQuantity: "1",
    brand: "",
    size: "",
    color: "",
    department: "",
    category: "Other",
    shipping: "Standard shipping",
  });
  const fileRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/login");
    else if (user.role !== "seller") navigate("/sell/start");
  }, [authLoading, navigate, user]);

  const matches = useMemo(() => [
    { title: `${form.title || "Item"} · Popular match`, detail: "Recommended product details", image: "/seed-images/shoes.png" },
    { title: `${form.title || "Item"} · Best seller`, detail: "Frequently selected by sellers", image: "/seed-images/tech.png" },
    { title: `${form.title || "Item"} · Similar listing`, detail: "Use this match to list faster", image: "/seed-images/laptop.png" },
    { title: `${form.title || "Item"} · Generic item`, detail: "Add your own item specifics", image: "/seed-images/trading-cards.png" },
  ], [form.title]);

  const addFiles = (files) => {
    const next = Array.from(files || []).filter((file) => file.type.startsWith("image/")).slice(0, 5 - images.length).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((current) => [...current, ...next]);
  };
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const chooseCondition = (value, label) => { setSelectedCondition(label); setForm((current) => ({ ...current, condition: value })); };

  const publish = async (event) => {
    event.preventDefault();
    setError("");
    const listingPrice =
      form.pricingFormat === "auction"
        ? form.buyItNowPrice || form.startingBid
        : form.fixedPrice;
    if (!form.title.trim() || !form.description.trim() || !listingPrice || !form.totalQuantity) {
      setError("Complete the title, description, price, and quantity before listing your item.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      ["title", "subtitle", "description", "condition", "totalQuantity"].forEach((key) => payload.append(key, form[key]));
      payload.append("fixedPrice", listingPrice);
      images.forEach(({ file }) => payload.append("images", file));
      const response = await createListing(payload);
      if (response.data.success) navigate(`/listing/${response.data.data._id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to publish this listing.");
    } finally { setSubmitting(false); }
  };

  if (authLoading || !user || user.role !== "seller") return null;

  if (step === "match") return <WizardShell onBack={() => navigate("/sell/start")}>
    <div className="grid gap-14 lg:grid-cols-[320px_1fr]">
      <aside><h1 className="text-3xl font-bold">Find a match</h1><p className="mt-2 text-gray-600">for “{form.title || "your item"}”</p><p className="mt-1 text-sm underline">Choose the closest product or continue without a match.</p><div className="mt-8 border-t pt-7"><p className="font-semibold">Add details to sharpen results</p><div className="mt-4 flex flex-wrap gap-2">{["Brand", "Size", "Model", "Color", "Release year"].map((tag) => <button key={tag} className="rounded-full bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200">{tag}⌄</button>)}</div></div></aside>
      <section><p className="mb-5 text-sm text-gray-500">Top picks from the product library</p><div className="space-y-4">{matches.map((match) => <button key={match.title} onClick={() => { setForm((current) => ({ ...current, subtitle: match.detail })); setStep("condition"); }} className="flex w-full items-center gap-5 rounded-xl border border-transparent p-4 text-left hover:border-blue-500 hover:bg-blue-50"><img src={match.image} alt="" className="h-24 w-36 rounded-lg bg-gray-100 object-contain" /><div><h2 className="font-bold">{match.title}</h2><p className="mt-2 text-sm text-gray-500">{match.detail}</p></div></button>)}</div></section>
    </div><button onClick={() => setStep("condition")} className="mx-auto mt-12 block w-full max-w-sm rounded-full border border-blue-600 py-3 font-bold text-blue-600 hover:bg-blue-50">Continue without match</button>
  </WizardShell>;

  if (step === "condition") return <WizardShell onBack={() => setStep("match")}>
    <div className="mx-auto max-w-2xl"><h1 className="text-3xl font-bold">Select condition</h1><p className="mt-4 text-sm text-gray-600">Disclose all flaws to prevent returns and earn better feedback.</p><div className="mt-6 space-y-3">{conditions.map(([value, label, description]) => <button key={label} onClick={() => chooseCondition(value, label)} className={`w-full rounded-xl border p-5 text-left transition ${selectedCondition === label ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-400 hover:border-gray-900"}`}><strong>{label}</strong><p className="mt-1 text-sm text-gray-500">{description}</p></button>)}</div><button disabled={!selectedCondition} onClick={() => setStep("form")} className="mt-10 w-full rounded-full bg-blue-600 py-3.5 font-bold text-white disabled:bg-gray-300">Continue</button></div>
  </WizardShell>;

  return <div className="min-h-screen bg-white text-gray-900"><ListingHeader onBack={() => setStep("condition")} />
    <form onSubmit={publish} className="mx-auto max-w-6xl px-6 pb-20 pt-10"><h1 className="text-3xl font-bold">Complete your listing</h1>
      <Section title="Photos & video" action="See photo options"><p className="mb-8 text-gray-600">Add up to 5 photos. Buyers want to see all details and angles.</p><p className="mb-3 text-sm text-gray-500">{images.length}/5</p>{images.length === 0 ? <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }} className="flex min-h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-400"><span className="text-4xl">▧</span><p className="mt-4 text-2xl font-semibold">Drag and drop files</p><button type="button" onClick={() => fileRef.current?.click()} className="mt-6 rounded-full border border-gray-800 px-7 py-3">Upload from computer</button></div> : <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{images.map((image, index) => <div key={image.preview} className={`${index === 0 ? "col-span-2 row-span-2" : ""} group relative overflow-hidden rounded-xl border bg-gray-50`}><img src={image.preview} alt="Preview" className="aspect-square h-full w-full object-contain" /><button type="button" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-2 top-2 hidden h-8 w-8 rounded-full bg-white shadow group-hover:block">×</button>{index === 0 && <span className="absolute bottom-3 left-3 rounded-full bg-gray-900 px-3 py-1 text-xs text-white">Main</span>}</div>)}{images.length < 5 && <button type="button" onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed text-lg">＋ Add</button>}</div>}<input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} /></Section>

      <Section title="Item details"><Field label="Item title" hint={`${form.title.length}/80`}><input name="title" maxLength="80" value={form.title} onChange={update} className={inputClass} required /></Field><div className="mt-6 rounded-xl border bg-gray-50 p-5"><h3 className="font-bold">List faster</h3><p className="mt-1 text-gray-500">Select applicable item specifics pulled from your title.</p><div className="mt-4 flex flex-wrap gap-7">{["Brand", "Color", "Size"].map((item) => <label key={item} className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5" /> {item}</label>)}</div></div><div className="mt-8"><p className="text-sm font-bold uppercase">Item category</p><Field label="Category"><select name="category" value={form.category} onChange={update} className={inputClass}><option>Other</option><option>Electronics</option><option>Fashion</option><option>Collectibles and art</option><option>Home and garden</option></select></Field></div></Section>

      <Section title="Item specifics"><div className="grid gap-x-12 gap-y-6 md:grid-cols-2"><Field label="Brand"><input name="brand" value={form.brand} onChange={update} placeholder="Enter brand" className={inputClass} /></Field><Field label="Size"><input name="size" value={form.size} onChange={update} placeholder="Enter size" className={inputClass} /></Field><Field label="Color"><select name="color" value={form.color} onChange={update} className={inputClass}><option value="">Select color</option><option>Black</option><option>Blue</option><option>White</option><option>Red</option><option>Green</option></select></Field><Field label="Department"><select name="department" value={form.department} onChange={update} className={inputClass}><option value="">Select department</option><option>Men</option><option>Women</option><option>Unisex</option><option>Kids</option></select></Field></div></Section>

      <Section title="Description"><Field label="Subtitle (optional)"><input name="subtitle" value={form.subtitle} onChange={update} className={inputClass} /></Field><div className="mt-6"><div className="mb-2 flex gap-2"><button type="button" className="rounded border px-3 py-1 font-bold">B</button><button type="button" className="rounded border px-3 py-1">☷</button></div><textarea name="description" value={form.description} onChange={update} rows="10" maxLength="1000" placeholder="Write a detailed description of your item" className={inputClass} required /><p className="mt-1 text-right text-xs text-gray-500">{form.description.length}/1000</p></div></Section>

      <Section title="Pricing" action="See pricing options">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-5">
            <Field label="Format">
              <select name="pricingFormat" value={form.pricingFormat} onChange={update} className={inputClass}>
                <option value="auction">Auction</option>
                <option value="fixed">Buy It Now</option>
              </select>
            </Field>

            {form.pricingFormat === "auction" ? (
              <>
                <Field label="Auction duration">
                  <select name="auctionDuration" value={form.auctionDuration} onChange={update} className={inputClass}>
                    <option>1 day</option><option>3 days</option><option>5 days</option><option>7 days</option><option>10 days</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-5">
                  <Field label="Starting bid">
                    <div className="relative"><span className="absolute left-4 top-3.5 text-gray-500">₫</span><input name="startingBid" type="number" min="1" value={form.startingBid} onChange={update} placeholder="0" className={`${inputClass} pl-9`} /></div>
                  </Field>
                  <Field label="Buy It Now (optional)" hint="Set a price buyers can pay immediately.">
                    <div className="relative"><span className="absolute left-4 top-3.5 text-gray-500">₫</span><input name="buyItNowPrice" type="number" min="1" value={form.buyItNowPrice} onChange={update} placeholder="0" className={`${inputClass} pl-9`} /></div>
                  </Field>
                </div>
                <label className="flex items-center gap-3 text-sm"><input name="immediatePayment" type="checkbox" checked={form.immediatePayment} onChange={(event) => setForm((current) => ({ ...current, immediatePayment: event.target.checked }))} className="h-5 w-5 rounded" />Require immediate payment when buyer uses Buy It Now</label>
                <Field label="Reserve price (optional) — fees apply" hint="Your item won't sell below this amount.">
                  <div className="relative max-w-xs"><span className="absolute left-4 top-3.5 text-gray-500">₫</span><input name="reservePrice" type="number" min="0" value={form.reservePrice} onChange={update} className={`${inputClass} pl-9`} /></div>
                </Field>
              </>
            ) : (
              <Field label="Buy It Now price (VND)">
                <div className="relative"><span className="absolute left-4 top-3.5 text-gray-500">₫</span><input name="fixedPrice" type="number" min="1" value={form.fixedPrice} onChange={update} placeholder="0" className={`${inputClass} pl-9`} /></div>
              </Field>
            )}

            <Field label="Quantity">
              <input name="totalQuantity" type="number" min="1" value={form.totalQuantity} onChange={update} className={`${inputClass} max-w-xs`} required />
            </Field>
          </div>

          <aside className="h-fit rounded-xl bg-gray-50 p-7">
            <h3 className="text-lg font-bold">Sold listings in the last 90 days ⓘ</h3>
            <dl className="mt-7 grid grid-cols-[1fr_auto] gap-x-8 gap-y-4 text-gray-600">
              <dt>Recommended starting bid</dt><dd className="font-medium text-gray-900">₫100,000</dd>
              <dt>Median sold price</dt><dd className="font-medium text-gray-900">₫260,000</dd>
              <dt>Free shipping</dt><dd className="font-medium text-gray-900">31%</dd>
            </dl>
            <button type="button" className="mt-8 font-medium underline">See similar listings</button>
          </aside>
        </div>

        <div className="mt-8 flex items-center justify-between rounded-xl border border-gray-200 p-5">
          <div><h3 className="font-bold">Schedule your listing</h3><p className="mt-1 text-sm text-gray-500">Your listing goes live immediately, unless you select a time and date to start.</p></div>
          <button type="button" role="switch" aria-checked={form.scheduled} onClick={() => setForm((current) => ({ ...current, scheduled: !current.scheduled }))} className={`relative h-8 w-14 rounded-full transition ${form.scheduled ? "bg-blue-600" : "bg-gray-300"}`}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${form.scheduled ? "left-7" : "left-1"}`} /></button>
        </div>
      </Section>

      <Section title="Shipping" action="See shipping options"><div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">ⓘ Shipping recommendations are applied. Review them before publishing.</div><div className="mt-6 grid gap-6 md:grid-cols-2"><Field label="Shipping method"><select name="shipping" value={form.shipping} onChange={update} className={inputClass}><option>Standard shipping</option><option>Express shipping</option><option>Local pickup</option></select></Field><Field label="Cost type"><select className={inputClass}><option>Free shipping</option><option>Flat rate</option><option>Calculated by buyer location</option></select></Field></div></Section>

      <Section title="Charity" action="Edit"><div className="rounded-lg bg-blue-50 p-4 text-sm">ⓘ Donate a portion to charity and support a cause when your item sells.</div></Section>

      <div className="py-10 text-center"><h2 className="text-3xl font-bold">List it for free.</h2><p className="mt-3 text-gray-500">A final value fee applies when your item sells.</p>{error && <p className="mx-auto mt-5 max-w-xl rounded-lg bg-red-50 p-4 text-red-600">{error}</p>}<button disabled={submitting} className="mt-8 w-full max-w-md rounded-full bg-blue-600 py-4 text-lg font-bold text-white hover:bg-blue-700 disabled:opacity-60">{submitting ? "Listing item..." : "List it"}</button><button type="button" className="mx-auto mt-3 block w-full max-w-md rounded-full border border-gray-900 py-3.5 font-semibold">Save for later</button><button type="button" className="mx-auto mt-3 block w-full max-w-md rounded-full border border-gray-900 py-3.5 font-semibold">Preview</button></div>
    </form>
  </div>;
}

function ListingHeader({ onBack }) { return <header className="border-b border-gray-200 bg-white"><div className="mx-auto grid max-w-6xl grid-cols-3 items-center px-6 py-5"><button onClick={onBack} className="justify-self-start text-3xl">‹</button><div className="justify-self-center"><Logo /></div><div className="flex items-center gap-4 justify-self-end"><a href="/seller/inventory" className="hidden text-sm font-semibold text-blue-600 hover:underline sm:block">My listings</a><span className="text-2xl">?</span><span className="text-2xl">⋮</span></div></div></header>; }
function WizardShell({ children, onBack }) { return <div className="flex min-h-screen flex-col bg-[#fafafa]"><ListingHeader onBack={onBack} /><main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">{children}</main><footer className="border-t bg-white px-6 py-6 text-center text-xs text-gray-500">Copyright © 1995–2026 eBay Inc. All Rights Reserved. · Accessibility · User Agreement · Privacy</footer></div>; }
function Section({ title, action, children }) { return <section className="border-b border-gray-200 py-10"><div className="mb-7 flex items-center justify-between"><h2 className="text-xl font-bold uppercase">{title}</h2>{action && <button type="button" className="rounded-full bg-gray-50 px-5 py-2 text-sm font-medium hover:bg-gray-100">⚙ {action}</button>}</div>{children}</section>; }

export default SellerListings;
