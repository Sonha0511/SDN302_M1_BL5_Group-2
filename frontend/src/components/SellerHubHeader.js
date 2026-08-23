import React from "react";
import { Link } from "react-router-dom";

const tabs = [
  ["overview", "Overview", "/seller/overview"],
  ["orders", "Orders", "/seller/orders"],
  ["disputes", "Disputes", "/seller/disputes"],
  ["listings", "Listings", "/seller/inventory"],
  ["marketing", "Marketing", "/seller/marketing"],
  ["feedback", "Feedback", "/seller/feedback"],
  ["performance", "Performance", null],
  ["payments", "Payments", null],
  ["research", "Research", null],
];

function SellerHubHeader({ active = "overview", user }) {
  return (
    <header className="border-b border-gray-300 bg-white">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-5 py-2 text-xs text-gray-700 lg:px-8">
        <div className="flex gap-6">
          <Link to="/" className="font-semibold hover:underline">
            Hi, {user?.name || user?.username || "Seller"}⌄
          </Link>
          <Link to="/listings" className="hidden hover:underline sm:block">
            Deals
          </Link>
          <Link to="/listings" className="hidden hover:underline sm:block">
            Brand Outlet
          </Link>
          <Link to="/messages" className="hidden hover:underline sm:block">
            Help & Contact
          </Link>
        </div>
        <div className="flex gap-5">
          <span>🇻🇳 &nbsp; Ship to</span>
          <Link to="/sell" className="hover:underline">
            Sell⌄
          </Link>
          <Link to="/listings" className="hidden hover:underline sm:block">
            Watchlist⌄
          </Link>
          <Link to={`/seller/${user?._id}`} className="hover:underline">
            My eBay⌄
          </Link>
          <Link to="/messages" className="text-base" aria-label="Messages">
            ♧
          </Link>
          <Link to="/cart" className="text-base" aria-label="Cart">
            🛒
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 sm:px-5 lg:px-8">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-3 py-3 lg:gap-5">
          <Link
            to="/"
            className="flex-shrink-0 py-2 text-4xl font-bold italic tracking-tighter"
          >
            <span className="text-red-600">e</span>
            <span className="text-blue-600">b</span>
            <span className="text-yellow-500">a</span>
            <span className="text-green-600">y</span>
          </Link>
          <button className="hidden text-sm text-gray-700 sm:block">
            Shop by
            <br />
            category⌄
          </button>
          <div className="order-3 flex h-11 min-w-0 flex-[1_1_240px] items-center rounded-full border-2 border-gray-800 px-3 text-gray-500 lg:order-none">
            <span className="mr-2 flex-shrink-0 text-xl">⌕</span>
            <span className="truncate">Search for anything</span>
            <span className="ml-auto hidden flex-shrink-0 border-l border-gray-300 pl-3 text-xs sm:block">
              All Categories⌄
            </span>
          </div>
          <button className="order-4 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 lg:order-none">
            Search
          </button>
          <span className="hidden text-xs text-gray-600 lg:block">
            Advanced
          </span>
          <span className="hidden flex-shrink-0 border-l border-gray-300 pl-5 text-lg font-bold xl:block">
            Seller Hub
          </span>
          <Link
            to="/messages"
            className="ml-auto hidden flex-shrink-0 rounded-full border border-gray-400 px-4 py-2 text-sm font-semibold lg:block"
          >
            Messages (0)
          </Link>
        </div>

        <nav className="mx-auto flex max-w-screen-2xl gap-1 overflow-x-auto border-t border-gray-200 scrollbar-thin">
          {tabs.map(([value, label, to]) =>
            to ? (
              <Link
                key={value}
                to={to}
                className={`whitespace-nowrap border-b-4 px-3 py-3 text-sm sm:px-4 ${active === value ? "border-blue-600 font-bold text-blue-700" : "border-transparent hover:border-gray-300"}`}
              >
                {label}
              </Link>
            ) : (
              <span
                key={value}
                className="whitespace-nowrap border-b-4 border-transparent px-3 py-3 text-sm text-gray-500 sm:px-4"
              >
                {label}
              </span>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}

export default SellerHubHeader;
