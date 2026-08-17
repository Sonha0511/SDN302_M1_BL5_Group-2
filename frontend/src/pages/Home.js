import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import laptopImg from "../assets/images/laptop.png";
import keyboardImg from "../assets/images/keyboard.png";
import smartphoneImg from "../assets/images/smartphone.png";
import enterpriseImg from "../assets/images/enterprise-networking.png";
import tabletsImg from "../assets/images/tablets-and-eBooks.png";
import storageImg from "../assets/images/storeage-and-blankmedia.png";
import lensesImg from "../assets/images/lenses-and-filters.png";
import couponImg from "../assets/images/coupon.png";
import ebayShippingImg from "../assets/images/ebay-shipping.png";
import techImg from "../assets/images/Tech.png";
import motorsImg from "../assets/images/Motors.png";
import luxuryImg from "../assets/images/Luxury.png";
import collectiblesImg from "../assets/images/Collectibles-and-art.png";
import homeGardenImg from "../assets/images/Home-and-garde.png";
import tradingCardsImg from "../assets/images/Trading-cards.png";
import healthBeautyImg from "../assets/images/Health-and-beauty.png";
import shoesImg from "../assets/images/shoes.png";
// Banner slides data
const banners = [
  {
    id: 1,
    bg: "bg-yellow-300",
    title: "20% off your wishlist",
    subtitle: "Score savings on tech, home, and more.",
    btn: "Get the coupon",
    btnStyle: "bg-gray-800 text-white",
  },
  {
    id: 2,
    bg: "bg-blue-100",
    title: "Top deals this week",
    subtitle: "Save big on electronics and more.",
    btn: "Shop now",
    btnStyle: "bg-blue-600 text-white",
  },
  {
    id: 3,
    bg: "bg-orange-100",
    title: "Free shipping on orders",
    subtitle: "On thousands of items.",
    btn: "Explore deals",
    btnStyle: "bg-orange-500 text-white",
  },
];

// Category data
const categories = [
  { name: "Laptops", img: laptopImg },
  { name: "Computer parts", img: keyboardImg },
  { name: "Smartphones", img: smartphoneImg },
  { name: "Enterprise networking", img: enterpriseImg },
  { name: "Tablets and eBooks", img: tabletsImg },
  { name: "Storage and blank media", img: storageImg },
  { name: "Lenses and filters", img: lensesImg },
];

const trendingCategories = [
  { name: "Tech", img: techImg },
  { name: "Motors", img: motorsImg },
  { name: "Luxury", img: luxuryImg },
  { name: "Collectibles and art", img: collectiblesImg },
  { name: "Home and garden", img: homeGardenImg },
  { name: "Trading cards", img: tradingCardsImg },
  { name: "Health and beauty", img: healthBeautyImg },
];
// Fake today's deals
const todaysDeals = [
  {
    id: 1,
    title: "Apple iPhone 13 128GB Unlocked",
    price: "₫8,323,071",
    originalPrice: null,
    img: null,
  },
  {
    id: 2,
    title: "Dyson UP30 Ball Animal 3 | Nickel/Silver | Refurbished",
    price: "₫5,531,767",
    originalPrice: "₫13,171,237",
    img: null,
  },
  {
    id: 3,
    title: "Ego Turbo Leaf Blower 530 Bare Tool Certified Refurbished",
    price: "₫2,871,387",
    originalPrice: "₫3,925,107",
    img: null,
  },
  {
    id: 4,
    title: "DESIGN by Paul Sebastian Perfume for Women 3.4 oz",
    price: "₫618,270",
    originalPrice: "₫1,712,296",
    img: null,
  },
  {
    id: 5,
    title: "iRobot Roomba Combo i5+ Vacuum & Mop - Self-Emptying",
    price: "₫3,951,187",
    originalPrice: "₫10,536,937",
    img: null,
  },
  {
    id: 6,
    title: "Apple iPad 9 (2021) Space Gray Silver",
    price: "₫4,372,675",
    originalPrice: null,
    img: null,
  },
];

function CategoryCard({ name, img }) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0 w-44">
      <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden group-hover:shadow-md transition">
        {img ? (
          <img src={img} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )}
      </div>
      <span className="text-sm text-gray-700">{name}</span>
    </div>
  );
}

function DealCard({ title, price, originalPrice, img }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="flex-shrink-0 w-60 border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer bg-white">
      <div className="relative">
        <div className="w-full h-52 bg-gray-100 flex items-center justify-center">
          {img ? (
            <img
              src={img}
              alt={title}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
              No image
            </div>
          )}
        </div>
        <button
          onClick={() => setLiked((p) => !p)}
          className={`absolute top-2 right-2 text-xl ${liked ? "text-red-500" : "text-gray-400"} hover:text-red-500`}
        >
          {liked ? "♥" : "♡"}
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm text-gray-700 line-clamp-2 mb-1">{title}</p>
        <p className="font-bold text-gray-900">{price}</p>
        {originalPrice && (
          <p className="text-xs text-gray-400 line-through">{originalPrice}</p>
        )}
      </div>
    </div>
  );
}

function Home() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-screen-2xl mx-auto px-6 py-4">
        {/* Banner Slider */}
        <div
          className={`relative rounded-xl overflow-hidden ${banners[currentBanner].bg} mb-6`}
        >
          <div className="flex items-center justify-between px-12 py-0">
            {/* Text */}
            <div className="flex flex-col gap-4 max-w-xs">
              <h2 className="text-3xl font-bold text-gray-800">
                {banners[currentBanner].title}
              </h2>
              <p className="text-gray-600">{banners[currentBanner].subtitle}</p>
              <button
                className={`px-5 py-2 rounded-full text-sm font-semibold w-fit ${banners[currentBanner].btnStyle}`}
              >
                {banners[currentBanner].btn}
              </button>
            </div>
            {/* Image placeholder */}
            <div className="flex-shrink-0 w-[800px] h-[600px] overflow-visible mr-16 -mb-24 -mt-24">
              <img
                src={couponImg}
                alt="product"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBanner(i)}
                className={`w-2 h-2 rounded-full transition ${i === currentBanner ? "bg-gray-700" : "bg-gray-400"}`}
              />
            ))}
          </div>

          {/* Prev / Next / Pause */}

          <div className="absolute bottom-4 right-4 flex items-center gap-1">
            <button
              onClick={() =>
                setCurrentBanner(
                  (prev) => (prev - 1 + banners.length) % banners.length,
                )
              }
              className="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-gray-100 text-lg"
            >
              ‹
            </button>
            <button
              onClick={() =>
                setCurrentBanner((prev) => (prev + 1) % banners.length)
              }
              className="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-gray-100 text-lg"
            >
              ›
            </button>
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-gray-100"
            >
              {isPlaying ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <rect x="1" y="1" width="4" height="10" rx="1" />
                  <rect x="7" y="1" width="4" height="10" rx="1" />
                </svg>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M2 1.5l9 4.5-9 4.5V1.5z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Shop by category */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            The future in your hands
          </h2>
          <div className="grid grid-cols-7 gap-4 pb-2">
            {categories.map((cat) => (
              <CategoryCard key={cat.name} {...cat} />
            ))}
          </div>
        </section>

        {/* Black banner - Sign in */}
        <div className="bg-gray-900 rounded-xl p-6 mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-white text-xl font-bold">
              Get more with an eBay account
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Enjoy exclusive benefits-deals, app-only coupons, and more.
            </p>
          </div>
          <Link to="/login">
            <button className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-semibold hover:bg-gray-100">
              Sign in
            </button>
          </Link>
        </div>

        {/* Purple banner */}
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ backgroundColor: "#6B4FBB" }}
        >
          <div className="flex items-center justify-between px-12 py-10">
            <div className="flex flex-col gap-4 max-w-xs">
              <h2 className="text-white text-3xl font-bold">
                Shop the world. Ship for free.
              </h2>
              <p className="text-purple-200 text-sm">
                Discover international finds with free shipping included.
              </p>
              <button className="border border-white text-white px-5 py-2 rounded-full text-sm font-semibold w-fit hover:bg-white hover:text-purple-800 transition">
                Shop now
              </button>
            </div>
            <div className="w-80 h-64 rounded-xl overflow-hidden">
              <img
                src={ebayShippingImg}
                alt="product"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Today's Deals */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Today's Deals</h2>
              <p className="text-sm text-gray-500">All with free shipping</p>
            </div>
          </div>
          <div className="relative">
            <button className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-gray-100 text-lg">
              ‹
            </button>
            <div className="flex gap-4 overflow-x-auto pb-2 px-10 scrollbar-hide">
              {todaysDeals.map((deal) => (
                <DealCard key={deal.id} {...deal} />
              ))}
            </div>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-gray-100 text-lg">
              ›
            </button>
          </div>
        </section>

        {/* Trending on eBay */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Trending on eBay
          </h2>
          <div className="grid grid-cols-7 gap-4 pb-2">
            {trendingCategories.map((cat) => (
              <CategoryCard key={cat.name} {...cat} />
            ))}
          </div>
        </section>
        {/* Sport banner */}
        <div className="rounded-xl overflow-hidden mb-6 bg-gray-50 border border-gray-200">
          <div className="flex items-stretch justify-between px-12">
            <div className="flex flex-col gap-4 max-w-sm">
              <h2 className="text-gray-900 text-3xl font-bold">
                Cheer on your team with 5% off*
              </h2>
              <p className="text-gray-600 text-sm">
                From pre-game to game day, get everything you need for soccer.
              </p>
              <button className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-semibold w-fit hover:bg-gray-700 transition">
                Shop now
              </button>
              <p className="text-gray-400 text-xs">
                *Ends June 9 GMT-6. 2x use. Select items.
              </p>
            </div>
            <div className="h-full w-[500px] overflow-hidden rounded-xl">
              <img
                src={shoesImg}
                alt="shoes"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-8">
        <div className="max-w-screen-2xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Buy</h4>
              {[
                "Registration",
                "Bidding & buying help",
                "Stores",
                "eBay for Charity",
              ].map((i) => (
                <p key={i} className="hover:underline cursor-pointer mb-1">
                  {i}
                </p>
              ))}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Sell</h4>
              {[
                "Start selling",
                "How to sell",
                "Business sellers",
                "Affiliates",
              ].map((i) => (
                <p key={i} className="hover:underline cursor-pointer mb-1">
                  {i}
                </p>
              ))}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">About eBay</h4>
              {["Company info", "News", "Investors", "Careers"].map((i) => (
                <p key={i} className="hover:underline cursor-pointer mb-1">
                  {i}
                </p>
              ))}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Help & Contact
              </h4>
              {["Seller Center", "Contact Us", "eBay Returns"].map((i) => (
                <p key={i} className="hover:underline cursor-pointer mb-1">
                  {i}
                </p>
              ))}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Community</h4>
              {[
                "Announcements",
                "eBay Community",
                "eBay for Business Podcast",
              ].map((i) => (
                <p key={i} className="hover:underline cursor-pointer mb-1">
                  {i}
                </p>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
            Copyright © 1995-2026 eBay Inc. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
