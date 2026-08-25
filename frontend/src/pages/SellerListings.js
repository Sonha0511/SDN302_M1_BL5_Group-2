import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createListing, findListingMatches } from "../services/sellerService";

const Logo = () => (
  <span className="text-5xl font-bold italic tracking-tighter">
    <span className="text-red-600">e</span>
    <span className="text-blue-600">b</span>
    <span className="text-yellow-500">a</span>
    <span className="text-green-600">y</span>
  </span>
);
const Field = ({ label, children, hint, hidden = false }) => (
  <div className={hidden ? "hidden" : ""}>
    <label className="mb-2 block text-sm font-medium text-gray-800">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
);
const inputClass =
  "w-full rounded-lg border border-gray-500 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

const conditions = [
  [
    "new",
    "New with box",
    "Brand new, unused and defect-free with original packaging and accessories.",
  ],
  [
    "new",
    "New without box",
    "Brand new and unused, with accessories but missing the original box.",
  ],
  [
    "like_new",
    "New with defects",
    "Unused with minor cosmetic defects, missing accessories, or damaged packaging.",
  ],
  [
    "like_new",
    "Pre-owned · Excellent",
    "Like new, with no visible flaws or signs of use.",
  ],
  [
    "good",
    "Pre-owned · Good",
    "Gently used with moderate signs of wear and/or visible flaws.",
  ],
  [
    "acceptable",
    "Pre-owned · Fair",
    "Significant visible flaws, heavy signs of use, or missing components.",
  ],
];

// A small first-party catalogue keeps the matching step useful before the
// marketplace has any live listings.  A selected catalogue item is a template:
// it never reuses the other seller's photos or inventory.
const catalog = [
  { id: "iphone-15-pro-max", title: "Apple iPhone 15 Pro Max 256GB", category: "Electronics > Cell Phones & Smartphones", condition: "like_new", image: "/seed-images/smartphone.png", price: "22990000", specifics: { brand: "Apple", model: "iPhone 15 Pro Max", color: "Natural Titanium", storageCapacity: "256GB", network: "Unlocked", ram: "8GB", screenSize: "6.7 in" } },
  { id: "galaxy-s24-ultra", title: "Samsung Galaxy S24 Ultra 256GB", category: "Electronics > Cell Phones & Smartphones", condition: "new", image: "/seed-images/smartphone.png", price: "20990000", specifics: { brand: "Samsung", model: "Galaxy S24 Ultra", color: "Titanium Gray", storageCapacity: "256GB", network: "Unlocked", ram: "12GB", screenSize: "6.8 in" } },
  { id: "macbook-air-m3", title: "Apple MacBook Air 13-inch M3 256GB", category: "Electronics > Computers & Tablets", condition: "like_new", image: "/seed-images/laptop.png", price: "24990000", specifics: { brand: "Apple", model: "MacBook Air M3", color: "Midnight", storageCapacity: "256GB", ram: "8GB", screenSize: "13.6 in" } },
  { id: "nike-air-force", title: "Nike Air Force 1 '07 White", category: "Fashion > Men's Shoes", condition: "good", image: "/seed-images/shoes.png", price: "1250000", specifics: { brand: "Nike", model: "Air Force 1 '07", color: "White", size: "42", department: "Men" } },
];

const specificsByCategory = (category) =>
  category.startsWith("Electronics")
    ? [["brand", "Brand"], ["model", "Model"], ["storageCapacity", "Storage capacity"], ["color", "Color"], ["network", "Network"], ["ram", "RAM"], ["screenSize", "Screen size"]]
    : [["brand", "Brand"], ["model", "Model"], ["size", "Size"], ["color", "Color"], ["department", "Department"]];

function SellerListings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const initialTitle = location.state?.suggestedTitle || "";
  const savedDraft = JSON.parse(
    localStorage.getItem("seller-listing-draft") || "null",
  );
  const savedConditionLabel =
    conditions.find(([value]) => value === savedDraft?.form?.condition)?.[1] ||
    "";
  const [step, setStep] = useState(savedDraft?.step || "match");
  const [selectedCondition, setSelectedCondition] =
    useState(savedConditionLabel);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [form, setForm] = useState({
    title: savedDraft?.form?.title || initialTitle,
    matchedCatalogTitle: savedDraft?.form?.matchedCatalogTitle || "",
    subtitle: "",
    description: "",
    condition: "new",
    fixedPrice: "",
    // Fixed price is eBay's usual quick-listing choice. Auction remains an
    // explicit seller choice, so a catalogue match never creates a hidden bid
    // requirement.
    pricingFormat: "fixed",
    auctionDuration: "7 days",
    startingBid: "",
    buyItNowPrice: "",
    reservePrice: "",
    immediatePayment: false,
    scheduled: false,
    totalQuantity: "1",
    brand: "",
    model: "",
    size: "",
    color: "",
    department: "",
    storageCapacity: "",
    network: "",
    ram: "",
    screenSize: "",
    category: "Other",
    shipping: "Standard shipping",
    shippingCost: "0",
    handlingTime: "1 business day",
    shippingFrom: "",
    itemOrigin: "Vietnam",
    shippingCostType: "flat",
    packageWeightLbs: "",
    packageWeightOz: "",
    packageLength: "",
    packageWidth: "",
    packageHeight: "",
    acceptsReturns: "false",
    returnWindow: "No returns",
    returnShippingPaidBy: "Buyer",
    ...savedDraft?.form,
  });
  const fileRef = useRef(null);
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(
    () => () =>
      imagesRef.current.forEach(({ preview }) => URL.revokeObjectURL(preview)),
    [],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/login");
    else if (user.role !== "seller") navigate("/seller/register-notice");
  }, [authLoading, navigate, user]);

  useEffect(() => {
    const search = form.title.trim();
    if (search.length < 2) {
      setMatches([]);
      setMatching(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setMatching(true);
      setMatchError("");
      try {
        const response = await findListingMatches(search);
        setMatches(response.data.listings || []);
      } catch (requestError) {
        setMatches([]);
        setMatchError(
          requestError.response?.data?.message ||
            "Unable to load product matches.",
        );
      } finally {
        setMatching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [form.title]);

  const applyMatch = (match) => {
    const specifics = match.specifics || match.itemSpecifics || {};
    setForm((current) => ({
      ...current,
      title: match.title || current.title,
      matchedCatalogTitle: match.title || "",
      subtitle: match.subtitle || `${match.title} — verify the details and describe your exact item.`,
      description: match.description || `Selling ${match.title}. Please see photos for the exact item, condition and included accessories.`,
      category: match.category || current.category,
      condition: match.condition || current.condition,
      brand: specifics.brand || current.brand,
      model: specifics.model || current.model,
      size: specifics.size || current.size,
      color: specifics.color || current.color,
      department: specifics.department || current.department,
      fixedPrice: match.price || match.pricing?.fixedPrice || current.fixedPrice,
      pricingFormat: "fixed",
      ...specifics,
    }));
    const matchedCondition = conditions.find(
      ([value]) => value === match.condition,
    );
    if (matchedCondition) setSelectedCondition(matchedCondition[1]);
    setStep("condition");
  };

  const catalogueMatches = catalog.filter((item) => {
    const query = form.title.trim().toLowerCase();
    return query.length >= 2 && `${item.title} ${item.category}`.toLowerCase().includes(query);
  });
  const allMatches = [...catalogueMatches, ...matches];

  const addFiles = (files) => {
    const next = Array.from(files || [])
      .filter(
        (file) =>
          file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024,
      )
      .slice(0, 5 - images.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((current) => [...current, ...next]);
  };
  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  const updateShipping = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      if (name === "shipping" && value === "Local pickup") {
        return { ...current, shipping: value, shippingCostType: "free", shippingCost: "0" };
      }
      if (name === "shippingCostType" && value === "free") {
        return { ...current, shippingCostType: value, shippingCost: "0" };
      }
      return { ...current, [name]: value };
    });
  };
  const chooseCondition = (value, label) => {
    setSelectedCondition(label);
    setForm((current) => ({ ...current, condition: value }));
  };

  const publish = async (event) => {
    event.preventDefault();
    setError("");
    const listingPrice =
      form.pricingFormat === "auction"
        ? form.buyItNowPrice || form.startingBid
        : form.fixedPrice;
    const auctionInvalid =
      form.pricingFormat === "auction" &&
      (!form.startingBid ||
        Number(form.startingBid) <= 0 ||
        (form.buyItNowPrice &&
          Number(form.buyItNowPrice) <= Number(form.startingBid)));
    const problems = [];
    if (form.title.trim().length < 5 || form.title.trim().length > 80) problems.push("a title between 5 and 80 characters");
    if (form.description.trim().length < 10) problems.push("a description of at least 10 characters");
    if (!Number.isFinite(Number(listingPrice)) || Number(listingPrice) <= 0) problems.push(form.pricingFormat === "auction" ? "a valid starting bid" : "a Buy It Now price");
    if (!Number.isInteger(Number(form.totalQuantity)) || Number(form.totalQuantity) < 1) problems.push("a quantity of at least 1");
    if (images.length === 0) problems.push("at least one photo");
    if (auctionInvalid) problems.push("a Buy It Now price higher than the starting bid");
    if (problems.length) {
      setError(`Before listing, add ${problems.join(", ")}.`);
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      [
        "title",
        "subtitle",
        "description",
        "condition",
        "totalQuantity",
        "category",
        "brand",
        "model",
        "size",
        "color",
        "department",
        "storageCapacity",
        "network",
        "ram",
        "screenSize",
        "shipping",
        "pricingFormat",
        "auctionDuration",
        "startingBid",
        "buyItNowPrice",
        "reservePrice",
        "immediatePayment",
        "scheduled",
        "shippingCost",
        "handlingTime",
        "shippingFrom",
        "itemOrigin", "shippingCostType", "packageWeightLbs", "packageWeightOz",
        "packageLength", "packageWidth", "packageHeight",
        "acceptsReturns",
        "returnWindow",
        "returnShippingPaidBy",
      ].forEach((key) => payload.append(key, form[key]));
      payload.append("fixedPrice", listingPrice);
      images.forEach(({ file }) => payload.append("images", file));
      const response = await createListing(payload);
      if (response.data.success) {
        localStorage.removeItem("seller-listing-draft");
        navigate(`/listing/${response.data.data._id}`);
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to publish this listing.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || user.role !== "seller") return null;

  const saveDraft = () => {
    localStorage.setItem(
      "seller-listing-draft",
      JSON.stringify({ form, step }),
    );
    setError(
      "Draft saved. Your photos will need to be selected again before publishing.",
    );
  };

  if (step === "match")
    return (
      <WizardShell onBack={() => navigate("/sell/start")}>
        <div className="grid gap-14 lg:grid-cols-[320px_1fr]">
          <aside>
            <h1 className="text-3xl font-bold">Find a match</h1>
            <p className="mt-2 text-gray-600">
              for “{form.title || "your item"}”
            </p>
            <p className="mt-1 text-sm underline">
              Choose the closest product or continue without a match.
            </p>
            <div className="mt-8 border-t pt-7">
              <p className="font-semibold">Add details to sharpen results</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Brand", "Size", "Model", "Color", "Release year"].map(
                  (tag) => (
                    <button
                      key={tag}
                      className="rounded-full bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
                    >
                      {tag}⌄
                    </button>
                  ),
                )}
              </div>
            </div>
          </aside>
          <section>
            <p className="mb-5 text-sm text-gray-500">
              {matching
                ? "Searching the product library..."
                : "Listings similar to your title"}
            </p>
            {matchError && (
              <p className="mb-4 text-sm text-red-600">{matchError}</p>
            )}
            <div className="space-y-4">
              {allMatches.map((match) => (
                <button
                  key={match.id || match._id}
                  onClick={() => applyMatch(match)}
                  className="flex w-full items-center gap-5 rounded-xl border border-transparent p-4 text-left hover:border-blue-500 hover:bg-blue-50"
                >
                  <img
                    src={match.image || match.images?.[0] || "/seed-images/shoes.png"}
                    alt={match.title}
                    className="h-24 w-36 rounded-lg bg-gray-100 object-contain"
                  />
                  <div>
                    <h2 className="font-bold">{match.title}</h2>
                    <p className="mt-2 text-sm text-gray-500">
                      {match.category || "Other"} ·{" "}
                      {match.condition || "Condition not specified"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {match.price || match.pricing?.fixedPrice
                        ? `Suggested price: ${Number(match.price || match.pricing?.fixedPrice).toLocaleString()} VND`
                        : "Use details from this listing"}
                    </p>
                  </div>
                </button>
              ))}
              {!matching && !matchError && !allMatches.length && (
                <p className="rounded-lg border border-dashed p-8 text-center text-gray-500">
                  No similar listings found. Continue and enter your own
                  details.
                </p>
              )}
            </div>
          </section>
        </div>
        <button
          onClick={() => setStep("condition")}
          className="mx-auto mt-12 block w-full max-w-sm rounded-full border border-blue-600 py-3 font-bold text-blue-600 hover:bg-blue-50"
        >
          Continue without match
        </button>
      </WizardShell>
    );

  if (step === "condition")
    return (
      <WizardShell onBack={() => setStep("match")}>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold">Select condition</h1>
          <p className="mt-4 text-sm text-gray-600">
            Disclose all flaws to prevent returns and earn better feedback.
          </p>
          <div className="mt-6 space-y-3">
            {conditions.map(([value, label, description]) => (
              <button
                key={label}
                onClick={() => chooseCondition(value, label)}
                className={`w-full rounded-xl border p-5 text-left transition ${selectedCondition === label ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-400 hover:border-gray-900"}`}
              >
                <strong>{label}</strong>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              </button>
            ))}
          </div>
          <button
            disabled={!selectedCondition}
            onClick={() => setStep("form")}
            className="mt-10 w-full rounded-full bg-blue-600 py-3.5 font-bold text-white disabled:bg-gray-300"
          >
            Continue
          </button>
        </div>
      </WizardShell>
    );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ListingHeader onBack={() => setStep("condition")} />
      <form onSubmit={publish} className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="mb-10 border-b border-gray-200 pb-7">
          <p className="text-sm text-gray-600">Seller Hub <span className="mx-2">›</span> Listings <span className="mx-2">›</span> Create listing</p>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Create your listing</h1><p className="mt-2 text-gray-600">Add accurate details so buyers can find and trust your item.</p></div><span className="rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-800">Draft saved automatically</span></div>
          <ol className="mt-7 grid max-w-2xl grid-cols-3 text-sm"><li className="border-b-2 border-green-600 pb-3 font-semibold text-green-700">1. Find item</li><li className="border-b-2 border-blue-600 pb-3 font-semibold text-blue-700">2. Create listing</li><li className="border-b-2 border-gray-200 pb-3 text-gray-500">3. Review & list</li></ol>
        </div>
        <Section title="Photos & video" action="See photo options">
          <p className="mb-8 text-gray-600">
            Add up to 5 photos. Buyers want to see all details and angles.
          </p>
          <p className="mb-3 text-sm text-gray-500">{images.length}/5</p>
          {images.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              className="flex min-h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-400"
            >
              <span className="text-4xl">▧</span>
              <p className="mt-4 text-2xl font-semibold">Drag and drop files</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-6 rounded-full border border-gray-800 px-7 py-3"
              >
                Upload from computer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {images.map((image, index) => (
                <div
                  key={image.preview}
                  className={`${index === 0 ? "col-span-2 row-span-2" : ""} group relative overflow-hidden rounded-xl border bg-gray-50`}
                >
                  <img
                    src={image.preview}
                    alt="Preview"
                    className="aspect-square h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="absolute right-2 top-2 hidden h-8 w-8 rounded-full bg-white shadow group-hover:block"
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-3 left-3 rounded-full bg-gray-900 px-3 py-1 text-xs text-white">
                      Main
                    </span>
                  )}
                </div>
              ))}
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed text-lg"
                >
                  ＋ Add
                </button>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </Section>

        <Section title="Item details">
          {form.matchedCatalogTitle && <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Product match</p><p className="mt-1 font-semibold">{form.matchedCatalogTitle}</p><p className="mt-1 text-sm text-gray-600">We filled the suggested details below. Check that they match your exact item.</p></div><button type="button" onClick={() => setStep("match")} className="font-semibold text-blue-700 underline">Change</button></div>}
          <Field label="Item title" hint={`${form.title.length}/80`}>
            <input
              name="title"
              maxLength="80"
              value={form.title}
              onChange={update}
              className={inputClass}
              required
            />
          </Field>
          <div className="mt-8">
            <p className="text-sm font-bold uppercase">Item category</p>
            <Field label="Category">
              <select
                name="category"
                value={form.category}
                onChange={update}
                className={inputClass}
              >
                <option>Other</option>
                <option>Electronics > Cell Phones & Smartphones</option>
                <option>Electronics > Computers & Tablets</option>
                <option>Fashion > Men's Shoes</option>
                <option>Fashion > Women's Clothing</option>
                <option>Collectibles and art</option>
                <option>Home and garden</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Item specifics">
          <p className="mb-6 text-sm text-gray-600">These fields adapt to your category and are filled automatically when you choose a catalogue match.</p>
          <div className="grid gap-x-12 gap-y-6 md:grid-cols-2">
            {specificsByCategory(form.category).map(([name, label]) => <Field key={name} label={label}><input name={name} value={form[name] || ""} onChange={update} placeholder={`Enter ${label.toLowerCase()}`} className={inputClass} /></Field>)}
          </div>
        </Section>

        <Section title="Description">
          <Field label="Subtitle (optional)">
            <input
              name="subtitle"
              value={form.subtitle}
              onChange={update}
              className={inputClass}
            />
          </Field>
          <div className="mt-6">
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1 font-bold"
              >
                B
              </button>
              <button type="button" className="rounded border px-3 py-1">
                ☷
              </button>
            </div>
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              rows="10"
              maxLength="1000"
              placeholder="Write a detailed description of your item"
              className={inputClass}
              required
            />
            <p className="mt-1 text-right text-xs text-gray-500">
              {form.description.length}/1000
            </p>
          </div>
        </Section>

        <Section title="Pricing" action="See pricing options">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
            <div className="space-y-5">
              <Field label="Format">
                <select
                  name="pricingFormat"
                  value={form.pricingFormat}
                  onChange={update}
                  className={inputClass}
                >
                  <option value="auction">Auction</option>
                  <option value="fixed">Buy It Now</option>
                </select>
              </Field>

              {form.pricingFormat === "auction" ? (
                <>
                  <Field label="Auction duration">
                    <select
                      name="auctionDuration"
                      value={form.auctionDuration}
                      onChange={update}
                      className={inputClass}
                    >
                      <option>1 day</option>
                      <option>3 days</option>
                      <option>5 days</option>
                      <option>7 days</option>
                      <option>10 days</option>
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-5">
                    <Field label="Starting bid">
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-500">
                          ₫
                        </span>
                        <input
                          name="startingBid"
                          type="number"
                          min="1"
                          value={form.startingBid}
                          onChange={update}
                          placeholder="0"
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </Field>
                    <Field
                      label="Buy It Now (optional)"
                      hint="Set a price buyers can pay immediately."
                    >
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-500">
                          ₫
                        </span>
                        <input
                          name="buyItNowPrice"
                          type="number"
                          min="1"
                          value={form.buyItNowPrice}
                          onChange={update}
                          placeholder="0"
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </Field>
                  </div>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      name="immediatePayment"
                      type="checkbox"
                      checked={form.immediatePayment}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          immediatePayment: event.target.checked,
                        }))
                      }
                      className="h-5 w-5 rounded"
                    />
                    Require immediate payment when buyer uses Buy It Now
                  </label>
                  <Field
                    label="Reserve price (optional) — fees apply"
                    hint="Your item won't sell below this amount."
                  >
                    <div className="relative max-w-xs">
                      <span className="absolute left-4 top-3.5 text-gray-500">
                        ₫
                      </span>
                      <input
                        name="reservePrice"
                        type="number"
                        min="0"
                        value={form.reservePrice}
                        onChange={update}
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </Field>
                </>
              ) : (
                <Field label="Buy It Now price (VND)">
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-500">
                      ₫
                    </span>
                    <input
                      name="fixedPrice"
                      type="number"
                      min="1"
                      value={form.fixedPrice}
                      onChange={update}
                      placeholder="0"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </Field>
              )}

              <Field label="Quantity">
                <input
                  name="totalQuantity"
                  type="number"
                  min="1"
                  value={form.totalQuantity}
                  onChange={update}
                  className={`${inputClass} max-w-xs`}
                  required
                />
              </Field>
            </div>

            <aside className="h-fit rounded-xl bg-gray-50 p-7">
              <h3 className="text-lg font-bold">
                Sold listings in the last 90 days ⓘ
              </h3>
              <dl className="mt-7 grid grid-cols-[1fr_auto] gap-x-8 gap-y-4 text-gray-600">
                <dt>Recommended starting bid</dt>
                <dd className="font-medium text-gray-900">₫100,000</dd>
                <dt>Median sold price</dt>
                <dd className="font-medium text-gray-900">₫260,000</dd>
                <dt>Free shipping</dt>
                <dd className="font-medium text-gray-900">31%</dd>
              </dl>
              <button type="button" className="mt-8 font-medium underline">
                See similar listings
              </button>
            </aside>
          </div>

          <div className="mt-8 flex items-center justify-between rounded-xl border border-gray-200 p-5">
            <div>
              <h3 className="font-bold">Schedule your listing</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your listing goes live immediately, unless you select a time and
                date to start.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.scheduled}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  scheduled: !current.scheduled,
                }))
              }
              className={`relative h-8 w-14 rounded-full transition ${form.scheduled ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${form.scheduled ? "left-7" : "left-1"}`}
              />
            </button>
          </div>
        </Section>

        <Section title="Shipping" action="See shipping options">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
            ⓘ Shipping recommendations are applied. Review them before
            publishing.
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Field label="Shipping method">
              <select
                name="shipping"
                value={form.shipping}
                onChange={updateShipping}
                className={inputClass}
              >
                <option>Standard shipping</option>
                <option>Express shipping</option>
                <option>Freight</option>
                <option>Local pickup</option>
              </select>
            </Field>
            {form.shipping !== "Local pickup" && <Field label="Cost type">
              <select name="shippingCostType" value={form.shippingCostType} onChange={updateShipping} className={inputClass}>
                <option value="flat">Flat: Same cost to all buyers</option>
                <option value="free">Free shipping</option>
                <option value="calculated">Calculated by buyer location</option>
              </select>
            </Field>}
            {form.shipping !== "Local pickup" && form.shippingCostType === "calculated" && <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900 md:col-span-2">Calculated shipping is shown to buyers from the package weight, dimensions and their delivery location.</div>}
            {form.shipping === "Local pickup" && <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900 md:col-span-2">Buyers will collect this item directly. No shipping fee or package details are needed.</div>}
            {form.shipping !== "Local pickup" && form.shippingCostType === "flat" && <Field label="Shipping cost (VND)">
              <input
                name="shippingCost"
                type="number"
                min="0"
                value={form.shippingCost}
                onChange={update}
                className={inputClass}
              />
            </Field>}
            {form.shipping !== "Local pickup" && <Field label={`Package weight (${form.shipping === "Freight" ? "required" : "optional"})`}><div className="flex gap-2"><input name="packageWeightLbs" type="number" min="0" required={form.shipping === "Freight"} value={form.packageWeightLbs} onChange={update} placeholder="lbs." className={inputClass} /><input name="packageWeightOz" type="number" min="0" value={form.packageWeightOz} onChange={update} placeholder="oz." className={inputClass} /></div></Field>}
            {form.shipping !== "Local pickup" && <Field label={`Package dimensions (${form.shipping === "Freight" ? "required" : "optional"})`}><div className="flex items-center gap-2"><input name="packageLength" type="number" min="0" required={form.shipping === "Freight"} value={form.packageLength} onChange={update} placeholder="in." className={inputClass} /><span>×</span><input name="packageWidth" type="number" min="0" required={form.shipping === "Freight"} value={form.packageWidth} onChange={update} placeholder="in." className={inputClass} /><span>×</span><input name="packageHeight" type="number" min="0" required={form.shipping === "Freight"} value={form.packageHeight} onChange={update} placeholder="in." className={inputClass} /></div></Field>}
            <Field label="Handling time">
              <select
                name="handlingTime"
                value={form.handlingTime}
                onChange={update}
                className={inputClass}
              >
                <option>1 business day</option>
                <option>2 business days</option>
                <option>3 business days</option>
              </select>
            </Field>
            <Field label={form.shipping === "Local pickup" ? "Pickup location" : "Ships from"}>
              <input
                name="shippingFrom"
                value={form.shippingFrom}
                onChange={update}
                placeholder="City or province"
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-10 max-w-4xl"><h3 className="mb-5 text-lg font-bold">Item origin</h3><div className="rounded-xl bg-gray-50 p-4 text-sm">ⓘ We prefilled the country of origin for you. To comply with customs policies, make sure it is correct before listing.</div><div className="mt-5 max-w-lg"><Field label="Country of origin"><select name="itemOrigin" value={form.itemOrigin} onChange={update} className={inputClass}><option>Vietnam</option><option>China</option><option>United States</option><option>Japan</option><option>South Korea</option><option>Other</option></select></Field><p className="mt-2 text-sm text-gray-500">This information may be needed for your listing to be visible to international buyers.</p></div></div>
        </Section>

        <Section title="Returns" action="Edit">
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Accept returns">
              <select
                name="acceptsReturns"
                value={form.acceptsReturns}
                onChange={update}
                className={inputClass}
              >
                <option value="false">No returns</option>
                <option value="true">Yes, accept returns</option>
              </select>
            </Field>
            <Field label="Return window">
              <select
                name="returnWindow"
                value={form.returnWindow}
                onChange={update}
                className={inputClass}
              >
                <option>No returns</option>
                <option>14 days</option>
                <option>30 days</option>
              </select>
            </Field>
            <Field label="Return shipping paid by">
              <select
                name="returnShippingPaidBy"
                value={form.returnShippingPaidBy}
                onChange={update}
                className={inputClass}
              >
                <option>Buyer</option>
                <option>Seller</option>
              </select>
            </Field>
          </div>
        </Section>

        <div className="py-10 text-center">
          <h2 className="text-3xl font-bold">List it for free.</h2>
          <p className="mt-3 text-gray-500">
            A final value fee applies when your item sells.
          </p>
          {error && (
            <p className="mx-auto mt-5 max-w-xl rounded-lg bg-red-50 p-4 text-red-600">
              {error}
            </p>
          )}
          <button
            disabled={submitting}
            className="mt-8 w-full max-w-md rounded-full bg-blue-600 py-4 text-lg font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Listing item..." : "List it"}
          </button>
          <button
            type="button"
            onClick={saveDraft}
            className="mx-auto mt-3 block w-full max-w-md rounded-full border border-gray-900 py-3.5 font-semibold"
          >
            Save for later
          </button>
          <button
            type="button"
            onClick={() =>
              setError(
                "Preview is available after completing the required listing details.",
              )
            }
            className="mx-auto mt-3 block w-full max-w-md rounded-full border border-gray-900 py-3.5 font-semibold"
          >
            Preview
          </button>
        </div>
      </form>
    </div>
  );
}

function ListingHeader({ onBack }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-3 items-center px-6 py-5">
        <button onClick={onBack} className="justify-self-start text-3xl">
          ‹
        </button>
        <div className="justify-self-center">
          <Logo />
        </div>
        <div className="flex items-center gap-4 justify-self-end">
          <a
            href="/seller/inventory"
            className="hidden text-sm font-semibold text-blue-600 hover:underline sm:block"
          >
            My listings
          </a>
          <span className="text-2xl">?</span>
          <span className="text-2xl">⋮</span>
        </div>
      </div>
    </header>
  );
}
function WizardShell({ children, onBack }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <ListingHeader onBack={onBack} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {children}
      </main>
      <footer className="border-t bg-white px-6 py-6 text-center text-xs text-gray-500">
        Copyright © 1995–2026 eBay Inc. All Rights Reserved. · Accessibility ·
        User Agreement · Privacy
      </footer>
    </div>
  );
}
function Section({ title, action, children }) {
  return (
    <section className="border-b border-gray-200 py-10">
      <div className="mb-7 flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase">{title}</h2>
        {action && (
          <button
            type="button"
            className="rounded-full bg-gray-50 px-5 py-2 text-sm font-medium hover:bg-gray-100"
          >
            ⚙ {action}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
export default SellerListings;
