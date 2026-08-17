import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import shoesImg from "../assets/images/shoes.png";
import businessImg from "../assets/images/bussiness-register.png";
import personalImg from "../assets/images/personal-register.png";

const benefits = [
  { title: "Quick listing", text: "List in a few steps with helpful guidance for pricing and descriptions. Only pay a final value fee when your item sells." },
  { title: "Secure payments", text: "Get paid securely with fraud detection, dispute resolution, and safeguards against abusive buyers." },
  { title: "Easy shipping", text: "Pick your carrier or use our suggestions, get discounted labels, or arrange local pickup with the buyer." },
];

const tips = [
  { title: "Write a standout title", color: "bg-[#f7d8b1]", text: "Use words buyers search for: brand, model, size, color, and the item's most important details." },
  { title: "Take high-quality photos", color: "bg-[#e9ef9d]", text: "Photograph every angle in good light and show any flaws clearly so buyers know what to expect." },
  { title: "Pick a purchase format", color: "bg-[#d8e8f8]", text: "Choose a fixed price for a quick sale, then set a fair price based on similar items." },
  { title: "Describe it accurately", color: "bg-[#f3c6cf]", text: "Select the right condition and include measurements, materials, accessories, and defects." },
  { title: "Set up shipping", color: "bg-[#cceadf]", text: "Choose a practical service, packaging, handling time, and return policy." },
  { title: "Review and publish", color: "bg-[#ddd4f3]", text: "Check your photos, title, price, and delivery details before your listing goes live." },
];

const faqs = [
  ["How much does it cost to sell?", "You only pay applicable selling fees after your item sells."],
  ["What's the best way to ship my item?", "Choose a tracked service that fits the item's size, weight, and value."],
  ["Can I sell locally?", "Yes. You can arrange local pickup when it is suitable for the item."],
  ["How much will it cost to ship my item?", "Shipping cost depends on package dimensions, weight, destination, and carrier."],
  ["Where can I get shipping supplies?", "Use strong packaging and enough protection to keep the item safe in transit."],
  ["How should I choose my listing price?", "Compare similar active and recently sold items, then account for condition and shipping."],
  ["How does eBay protect sellers?", "Secure payments and dispute tools help protect eligible transactions."],
  ["What can I sell?", "Most legal goods are allowed, subject to marketplace policies and local regulations."],
];

function Sell() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const startListing = () => navigate("/sell/start");

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4">
          <Link to="/sell" className="text-2xl font-bold">Selling</Link>
          <nav className="hidden items-center gap-9 text-sm text-gray-700 md:flex">
            <a href="#business" className="hover:underline">Business selling</a>
            <a href="#tips" className="hover:underline">Tips for listing</a>
            <a href="#faq" className="hover:underline">FAQ</a>
            <Link to="/seller/inventory" className="hover:underline">My eBay</Link>
            <button onClick={startListing} className="rounded-full bg-blue-600 px-7 py-3 font-bold text-white hover:bg-blue-700">List an item</button>
          </nav>
          <button onClick={startListing} className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white md:hidden">List an item</button>
        </div>
      </div>

      <main>
        <section className="mx-auto max-w-screen-2xl px-6 py-8 lg:px-10">
          <div className="grid min-h-[520px] overflow-hidden rounded-3xl bg-[#f7f7f7] lg:grid-cols-[0.95fr_1.45fr]">
            <div className="flex items-center p-8 lg:p-16">
              <div className="w-full rounded-2xl bg-[#191919] p-8 text-white lg:p-10">
                <h1 className="text-4xl font-bold leading-tight lg:text-5xl">If you don't love it,<br />list it</h1>
                <p className="mt-6 max-w-md text-lg text-gray-200">Cash in on your pre-loved pieces — millions of buyers are waiting.</p>
                <button onClick={startListing} className="mt-8 w-full rounded-full bg-blue-600 px-8 py-3.5 font-bold hover:bg-blue-700">Sell now</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 p-8 lg:items-center lg:p-12">
              <div className="h-80 overflow-hidden rounded-3xl bg-blue-600 lg:h-96"><img src={shoesImg} alt="Items ready to sell" className="h-full w-full object-cover object-left" /></div>
              <div className="h-80 overflow-hidden rounded-3xl bg-amber-100 lg:h-96"><img src={businessImg} alt="Growing a selling business" className="h-full w-full object-cover" /></div>
              <div className="h-80 overflow-hidden rounded-3xl bg-red-100 lg:h-96"><img src={personalImg} alt="People selling online" className="h-full w-full object-cover" /></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold lg:text-4xl">Reach millions of trusted buyers on eBay</h2>
          <div className="mt-12 grid gap-10 text-left md:grid-cols-3">
            {benefits.map((item) => <article key={item.title}><h3 className="text-2xl font-bold">{item.title}</h3><p className="mt-3 leading-7 text-gray-600">{item.text}</p></article>)}
          </div>
        </section>

        <section id="business" className="mx-auto max-w-screen-2xl scroll-mt-24 px-6 pb-20 lg:px-10">
          <div className="grid overflow-hidden rounded-3xl bg-[#f3f3f3] md:grid-cols-2">
            <div className="flex items-center p-10 lg:p-20"><div><h2 className="text-4xl font-bold leading-tight lg:text-5xl">Selling as a business?<br />We make it easy</h2><p className="mt-6 max-w-xl text-lg text-gray-600">Powerful tools help you manage inventory and orders, track sales, and build your brand.</p><Link to="/seller/inventory" className="mt-8 inline-block rounded-full border border-blue-600 px-7 py-3 font-bold text-blue-600 hover:bg-blue-50">Learn more</Link></div></div>
            <img src={businessImg} alt="Business seller packing orders" className="h-full min-h-[430px] w-full object-cover" />
          </div>
        </section>

        <section id="tips" className="scroll-mt-24 bg-[#f7f7f7] py-20">
          <div className="mx-auto max-w-screen-2xl px-6 lg:px-10"><h2 className="text-4xl font-bold lg:text-5xl">Create a great listing</h2><p className="mt-3 text-lg text-gray-600">Here are six ways to set yourself up for success.</p>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{tips.map((tip) => <article key={tip.title} className={`${tip.color} min-h-64 rounded-2xl p-8`}><h3 className="text-3xl font-bold leading-tight">{tip.title}</h3><p className="mt-6 text-base leading-7 text-gray-800">{tip.text}</p></article>)}</div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20"><h2 className="mb-8 text-4xl font-bold">FAQ</h2><div className="divide-y divide-gray-300 border-y border-gray-300">{faqs.map(([question, answer], index) => <div key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between py-5 text-left font-semibold"><span>{question}</span><span className="text-2xl font-light">{openFaq === index ? "−" : "+"}</span></button>{openFaq === index && <p className="pb-5 pr-12 text-gray-600">{answer}</p>}</div>)}</div></section>

        <section className="mx-auto max-w-screen-2xl px-6 pb-16 lg:px-10"><div className="relative min-h-[390px] overflow-hidden rounded-3xl"><img src={personalImg} alt="Start selling today" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-black/25" /><div className="relative m-8 max-w-md rounded-2xl bg-white p-8 lg:m-14"><h2 className="text-4xl font-bold">You've got this.<br />We've got your back.</h2><button onClick={startListing} className="mt-7 w-full rounded-full bg-blue-600 py-3 font-bold text-white hover:bg-blue-700">List an item</button></div></div></section>
      </main>

      <footer className="border-t border-gray-200 px-6 py-10 text-sm text-gray-500"><div className="mx-auto flex max-w-screen-2xl flex-wrap justify-between gap-6"><p>Copyright © 1995–2026 eBay Inc. All Rights Reserved.</p><div className="flex flex-wrap gap-5"><Link to="/user-agreement">User Agreement</Link><Link to="/privacy-notice">Privacy</Link><Link to="/">Help & Contact</Link></div></div></footer>
    </div>
  );
}

export default Sell;
