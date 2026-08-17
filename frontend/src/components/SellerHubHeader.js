import React from "react";
import { Link } from "react-router-dom";

const tabs = [
  ["overview", "Overview", "/seller/inventory"],
  ["orders", "Orders", "/seller/orders"],
  ["listings", "Listings", "/seller/inventory"],
  ["marketing", "Marketing", null],
  ["performance", "Performance", null],
  ["payments", "Payments", null],
  ["research", "Research", null],
];

function SellerHubHeader({ active = "overview", user }) {
  return (
    <header className="border-b border-gray-300 bg-white">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-5 py-3 text-xs text-gray-600 lg:px-8">
        <Link to="/" className="hover:underline">
          Hi, {user?.name || user?.username || "Seller"}
        </Link>
        <div className="flex gap-5">
          <Link to="/messages" className="hover:underline">Messages</Link>
          <Link to={`/seller/${user?._id}`} className="hover:underline">Account</Link>
          <Link to="/" className="hover:underline">eBay Home</Link>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-7 px-5 lg:px-8">
          <Link to="/" className="flex-shrink-0 py-4 text-4xl font-bold italic tracking-tighter">
            <span className="text-red-600">e</span>
            <span className="text-blue-600">b</span>
            <span className="text-yellow-500">a</span>
            <span className="text-green-600">y</span>
          </Link>
          <span className="hidden flex-shrink-0 border-l border-gray-300 pl-7 text-xl font-bold sm:block">
            Seller Hub
          </span>
          <nav className="ml-2 hidden min-w-0 flex-1 items-stretch gap-6 self-stretch xl:flex">
            {tabs.map(([value, label, to]) =>
              to ? (
                <Link
                  key={value}
                  to={to}
                  className={`flex items-center border-b-4 px-1 text-sm ${active === value ? "border-blue-600 font-bold text-blue-700" : "border-transparent hover:border-gray-300"}`}
                >
                  {label}
                </Link>
              ) : (
                <span key={value} className="flex cursor-default items-center border-b-4 border-transparent px-1 text-sm text-gray-600">
                  {label}
                </span>
              ),
            )}
          </nav>
          <Link to="/sell/start" className="ml-auto flex-shrink-0 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
            Create listing
          </Link>
        </div>

        <nav className="flex overflow-x-auto border-t border-gray-200 px-4 xl:hidden">
          {tabs.slice(0, 5).map(([value, label, to]) =>
            to ? (
              <Link key={value} to={to} className={`whitespace-nowrap border-b-4 px-4 py-3 text-sm ${active === value ? "border-blue-600 font-bold text-blue-700" : "border-transparent"}`}>
                {label}
              </Link>
            ) : (
              <span key={value} className="whitespace-nowrap border-b-4 border-transparent px-4 py-3 text-sm text-gray-500">{label}</span>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}

export default SellerHubHeader;
