import React from "react";
import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6">
      {/* Logo */}
      <div>
        <span
          className="text-5xl font-bold italic"
          style={{ color: "#e53238" }}
        >
          e
        </span>
        <span
          className="text-5xl font-bold italic"
          style={{ color: "#0064d2" }}
        >
          b
        </span>
        <span
          className="text-5xl font-bold italic"
          style={{ color: "#f5af02" }}
        >
          a
        </span>
        <span
          className="text-5xl font-bold italic"
          style={{ color: "#86b817" }}
        >
          y
        </span>
      </div>

      {/* Icon */}
      <div className="text-7xl">🚧</div>

      {/* Text */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          This page is under development
        </h1>
        <p className="text-gray-500 text-sm">
          We're working on it. Check back soon!
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition"
        >
          Go back
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}

export default NotFound;
