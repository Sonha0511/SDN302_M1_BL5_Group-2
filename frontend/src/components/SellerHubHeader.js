import React from "react";
import { Link } from "react-router-dom";

const tabs = [
  ["overview", "Overview", "/seller/overview"],
  ["orders", "Orders", "/seller/orders"],
  ["disputes", "Requests", "/seller/disputes"],
  ["listings", "Listings", "/seller/inventory"],
  ["marketing", "Marketing", null],
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

      <div className="border-t border-gray-200 px-5 lg:px-8">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-5 py-3">
          <Link
            to="/"
            className="flex-shrink-0 py-4 text-4xl font-bold italic tracking-tighter"
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
          <div className="order-3 flex h-12 min-w-[250px] flex-1 items-center rounded-full border-2 border-gray-800 px-4 text-gray-500 lg:order-none">
            <span className="mr-3 text-xl">⌕</span>
            <span>Search for anything</span>
            <span className="ml-auto border-l border-gray-300 pl-4 text-xs">
              All Categories⌄
            </span>
          </div>
          <button className="order-4 rounded-full bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 lg:order-none">
            Search
          </button>
          <span className="hidden text-xs text-gray-600 lg:block">
            Advanced
          </span>
          <span className="hidden flex-shrink-0 whitespace-nowrap border-l border-gray-300 pl-7 text-xl font-bold sm:block">
            Seller Hub
          </span>
          <Link
            to="/messages"
            className="ml-auto hidden flex-shrink-0 whitespace-nowrap rounded-full border border-gray-400 px-5 py-2 text-sm font-semibold lg:block"
          >
            Messages (0)
          </Link>
        </div>

        {/* The Seller Hub tabs get their own row so they never collide with the
            search bar, and scroll sideways instead of wrapping when space runs out. */}
        <nav className="mx-auto flex max-w-screen-2xl gap-1 overflow-x-auto border-t border-gray-200">
          {tabs.map(([value, label, to]) =>
            to ? (
              <Link
                key={value}
                to={to}
                className={`flex-shrink-0 whitespace-nowrap border-b-4 px-4 py-3 text-sm ${active === value ? "border-blue-600 font-bold text-blue-700" : "border-transparent hover:border-gray-300"}`}
              >
                {label}
              </Link>
            ) : (
              <span
                key={value}
                className="flex-shrink-0 cursor-default whitespace-nowrap border-b-4 border-transparent px-4 py-3 text-sm text-gray-500"
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
