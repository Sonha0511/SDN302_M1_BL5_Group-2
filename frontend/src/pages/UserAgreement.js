import React from "react";
import { Link } from "react-router-dom";

function UserAgreement() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200">
        <Link to="/">
          <span
            className="text-3xl font-bold italic"
            style={{ color: "#e53238" }}
          >
            e
          </span>
          <span
            className="text-3xl font-bold italic"
            style={{ color: "#0064d2" }}
          >
            b
          </span>
          <span
            className="text-3xl font-bold italic"
            style={{ color: "#f5af02" }}
          >
            a
          </span>
          <span
            className="text-3xl font-bold italic"
            style={{ color: "#86b817" }}
          >
            y
          </span>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          User Agreement
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Effective date: January 1, 2024
        </p>

        {[
          {
            title: "1. Introduction",
            content:
              "Welcome to eBay. This User Agreement ('Agreement') governs your use of eBay's services. By accessing or using our services, you agree to be bound by this Agreement.",
          },
          {
            title: "2. About eBay",
            content:
              "eBay is a marketplace that allows users to offer, sell, and buy products and services. eBay does not own the products sold on the platform. We are not involved in the actual transaction between buyers and sellers.",
          },
          {
            title: "3. Using eBay",
            content:
              "To use eBay, you must register for an account. You agree to provide accurate and complete information when creating your account and to keep this information up to date.",
          },
          {
            title: "4. Buying",
            content:
              "When you purchase an item, you agree to pay for it. You are entering into a legally binding contract with the seller when you commit to buy an item.",
          },
          {
            title: "5. Selling",
            content:
              "When you list an item for sale, you agree to sell it at the listed price. You are responsible for accurately describing your items and for fulfilling orders.",
          },
          {
            title: "6. Fees",
            content:
              "eBay charges fees for certain services. These fees are outlined in our fee schedule, which may be updated from time to time.",
          },
          {
            title: "7. Prohibited Items",
            content:
              "Certain items are prohibited from being listed on eBay. These include illegal items, counterfeit goods, and items that violate intellectual property rights.",
          },
          {
            title: "8. Privacy",
            content:
              "Your privacy is important to us. Please review our User Privacy Notice to understand how we collect, use, and share information about you.",
          },
          {
            title: "9. Liability",
            content:
              "eBay is not liable for any damages arising from your use of our services. Our liability is limited to the maximum extent permitted by law.",
          },
          {
            title: "10. Changes to this Agreement",
            content:
              "We may update this Agreement from time to time. We will notify you of significant changes by posting a notice on our website or sending you an email.",
          },
        ].map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {section.title}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}

        <div className="mt-8 p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
          For questions about this agreement, please{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">
            contact us
          </span>
          .
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        Copyright © 1995-2026 eBay Inc. All Rights Reserved.
      </footer>
    </div>
  );
}

export default UserAgreement;
