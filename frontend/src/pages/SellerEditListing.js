import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyListings, updateListing } from "../services/sellerService";

const inputClass = "w-full rounded-lg border border-gray-500 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

function SellerEditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [form, setForm] = useState({ title: "", subtitle: "", description: "", condition: "new", fixedPrice: "", totalQuantity: "1", status: "active" });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    if (user.role !== "seller") { navigate("/"); return; }
    const load = async () => {
      setLoading(true); setError("");
      try {
        const response = await getMyListings();
        const item = response.data.data?.find((listing) => listing._id === id);
        if (!item) { setError("Listing not found or you don't have permission to edit it."); return; }
        setExistingImages(item.images || []);
        setForm({ title: item.title || "", subtitle: item.subtitle || "", description: item.description || "", condition: item.condition || "new", fixedPrice: item.pricing?.fixedPrice || "", totalQuantity: item.totalQuantity || "1", status: item.status || "active" });
      } catch (requestError) { setError(requestError.response?.data?.message || "Unable to load this listing."); }
      finally { setLoading(false); }
    };
    load();
  }, [authLoading, id, navigate, user]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const addImages = (files) => {
    const available = Math.max(0, 5 - existingImages.length - newImages.length);
    const additions = Array.from(files || []).filter((file) => file.type.startsWith("image/")).slice(0, available).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setNewImages((current) => [...current, ...additions]);
  };

  const save = async (event) => {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      newImages.forEach(({ file }) => payload.append("images", file));
      const response = await updateListing(id, payload);
      if (response.data.success) navigate("/seller/inventory");
    } catch (requestError) { setError(requestError.response?.data?.message || "Unable to save your changes."); }
    finally { setSaving(false); }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-white"><EditHeader /><main className="mx-auto max-w-5xl px-6 py-12"><div className="h-10 w-72 animate-pulse rounded bg-gray-200" /><div className="mt-8 h-96 animate-pulse rounded-xl bg-gray-100" /></main></div>;

  return <div className="min-h-screen bg-white text-gray-900"><EditHeader />
    <form onSubmit={save} className="mx-auto max-w-5xl px-6 pb-24 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Revise your listing</h1><p className="mt-2 text-sm text-gray-500">Item #{id.slice(-12).toUpperCase()}</p></div><Link to={`/listing/${id}`} className="text-sm font-semibold text-blue-600 hover:underline">View listing</Link></div>
      {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-600">{error}</p>}

      <EditSection title="Photos & video"><p className="mb-5 text-gray-600">Add photos that clearly show the item and any flaws. Existing photos will be kept.</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{existingImages.map((image, index) => <div key={image} className="relative aspect-square overflow-hidden rounded-xl border bg-gray-50"><img src={image} alt="Current listing" className="h-full w-full object-contain p-2" />{index === 0 && <span className="absolute bottom-2 left-2 rounded-full bg-gray-900 px-3 py-1 text-xs text-white">Main</span>}</div>)}{newImages.map((image, index) => <div key={image.preview} className="group relative aspect-square overflow-hidden rounded-xl border bg-blue-50"><img src={image.preview} alt="New upload" className="h-full w-full object-contain p-2" /><button type="button" onClick={() => setNewImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white shadow">×</button><span className="absolute bottom-2 left-2 rounded-full bg-blue-600 px-3 py-1 text-xs text-white">New</span></div>)}{existingImages.length + newImages.length < 5 && <button type="button" onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-400 text-lg hover:border-blue-600">＋ Add photos</button>}</div><input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => addImages(event.target.files)} /></EditSection>

      <EditSection title="Item details"><Field label="Item title" hint={`${form.title.length}/80`}><input name="title" maxLength="80" value={form.title} onChange={update} className={inputClass} required /></Field><div className="mt-6"><Field label="Subtitle (optional)"><input name="subtitle" value={form.subtitle} onChange={update} className={inputClass} /></Field></div><div className="mt-6"><Field label="Condition"><select name="condition" value={form.condition} onChange={update} className={inputClass}><option value="new">New</option><option value="like_new">Like New</option><option value="good">Pre-owned · Good</option><option value="acceptable">Pre-owned · Fair</option></select></Field></div></EditSection>

      <EditSection title="Description"><textarea name="description" value={form.description} onChange={update} maxLength="1000" rows="10" className={inputClass} placeholder="Describe your item accurately" required /><p className="mt-2 text-right text-xs text-gray-500">{form.description.length}/1000</p></EditSection>

      <EditSection title="Pricing"><div className="grid gap-6 md:grid-cols-2"><Field label="Buy It Now price (VND)"><input name="fixedPrice" type="number" min="1" value={form.fixedPrice} onChange={update} className={inputClass} required /></Field><Field label="Quantity"><input name="totalQuantity" type="number" min="1" value={form.totalQuantity} onChange={update} className={inputClass} required /></Field></div></EditSection>

      <EditSection title="Listing status"><div className="grid gap-4 sm:grid-cols-2"><label className={`cursor-pointer rounded-xl border p-5 ${form.status === "active" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-300"}`}><input type="radio" name="status" value="active" checked={form.status === "active"} onChange={update} className="mr-3" /><strong>Active</strong><p className="ml-6 mt-1 text-sm text-gray-500">Visible to buyers in search results.</p></label><label className={`cursor-pointer rounded-xl border p-5 ${form.status === "inactive" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-300"}`}><input type="radio" name="status" value="inactive" checked={form.status === "inactive"} onChange={update} className="mr-3" /><strong>Inactive</strong><p className="ml-6 mt-1 text-sm text-gray-500">Hidden from buyers until reactivated.</p></label></div></EditSection>

      <div className="sticky bottom-0 -mx-6 mt-8 flex flex-wrap justify-end gap-3 border-t bg-white/95 px-6 py-5 backdrop-blur"><Link to="/seller/inventory" className="rounded-full border border-gray-600 px-7 py-3 font-semibold hover:bg-gray-50">Cancel</Link><Link to={`/listing/${id}`} className="rounded-full border border-gray-600 px-7 py-3 font-semibold hover:bg-gray-50">Preview</Link><button disabled={saving} className="rounded-full bg-blue-600 px-8 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button></div>
    </form>
  </div>;
}

function EditHeader() { return <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"><Link to="/seller/inventory" className="text-3xl">‹</Link><Link to="/" className="text-4xl font-bold italic tracking-tighter"><span className="text-red-600">e</span><span className="text-blue-600">b</span><span className="text-yellow-500">a</span><span className="text-green-600">y</span></Link><div className="flex gap-4 text-2xl"><span>?</span><span>⋮</span></div></div></header>; }
function EditSection({ title, children }) { return <section className="border-b border-gray-200 py-10"><h2 className="mb-7 text-xl font-bold uppercase">{title}</h2>{children}</section>; }
function Field({ label, hint, children }) { return <div><div className="mb-2 flex items-center justify-between"><label className="text-sm font-medium">{label}</label>{hint && <span className="text-xs text-gray-500">{hint}</span>}</div>{children}</div>; }

export default SellerEditListing;
