import React from "react";
import { Link } from "react-router-dom";

function PrivacyNotice() {
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
          User Privacy Notice
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Effective date: January 1, 2024
        </p>

        {[
          {
            title: "1. Information We Collect",
            content:
              "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This includes your name, email address, password, and payment information.",
          },
          {
            title: "2. How We Use Your Information",
            content:
              "We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.",
          },
          {
            title: "3. Information Sharing",
            content:
              "We do not share your personal information with third parties except as described in this policy. We may share your information with vendors and service providers that perform services on our behalf.",
          },
          {
            title: "4. Data Security",
            content:
              "We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.",
          },
          {
            title: "5. Cookies",
            content:
              "We use cookies and similar tracking technologies to track activity on our services and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.",
          },
          {
            title: "6. Your Rights",
            content:
              "You have the right to access, update, or delete your personal information. You can do this by logging into your account settings or contacting us directly.",
          },
          {
            title: "7. Children's Privacy",
            content:
              "Our services are not directed to children under the age of 18. We do not knowingly collect personal information from children under 18.",
          },
          {
            title: "8. Changes to This Policy",
            content:
              "We may update this Privacy Notice from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.",
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
          For questions about this privacy notice, please{" "}
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

export default PrivacyNotice;
