import React, { useState } from "react";
import personalRegisterImg from "../../assets/images/personal-register.png";
import businessRegisterImg from "../../assets/images/bussiness-register.png";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Register() {
  const [accountType, setAccountType] = useState("personal");
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Personal fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Business fields
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPassword, setBusinessPassword] = useState("");
  const [buyingOnly, setBuyingOnly] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const payload =
        accountType === "personal"
          ? {
              name: `${firstName} ${lastName}`.trim(),
              username: email.split("@")[0],
              email,
              password,
              role: "buyer",
            }
          : {
              name: businessName,
              username: businessEmail.split("@")[0],
              email: businessEmail,
              password: businessPassword,
              role: buyingOnly ? "buyer" : "seller",
            };

      const res = await api.post("/auth/register", payload);
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-gray-200">
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
        <span className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </span>
      </header>

      {/* Body */}
      <div className="flex flex-1">
        {/* Left image */}
        <div className="hidden md:flex w-1/2 p-8 items-center justify-end">
          <div className="w-90 h-[700px] rounded-2xl overflow-hidden shadow-lg">
            <img
              src={
                accountType === "personal"
                  ? personalRegisterImg
                  : businessRegisterImg
              }
              alt="register"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right form */}
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-semibold text-gray-900 mb-6">
              Create an account
            </h1>

            {/* Toggle Personal / Business */}
            <div className="flex border border-gray-300 rounded-full overflow-hidden mb-6">
              <button
                onClick={() => setAccountType("personal")}
                className={`flex-1 py-2 text-sm font-semibold transition ${
                  accountType === "personal"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => setAccountType("business")}
                className={`flex-1 py-2 text-sm font-semibold transition ${
                  accountType === "business"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                Business
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Personal Form */}
            {accountType === "personal" && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  By selecting Create personal account, you agree to our{" "}
                  <Link
                    to="/user-agreement"
                    className="text-blue-600 cursor-pointer hover:underline"
                  >
                    User Agreement
                  </Link>{" "}
                  and acknowledge reading our{" "}
                  <Link
                    to="/privacy-notice"
                    className="text-blue-600 cursor-pointer hover:underline"
                  >
                    User Privacy Notice
                  </Link>
                  .
                </p>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-full text-sm font-semibold transition"
                >
                  {loading ? "Creating..." : "Create personal account"}
                </button>

                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">
                    or continue with
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button className="w-full border border-gray-300 rounded-full py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="staySignedIn"
                    checked={staySignedIn}
                    onChange={(e) => setStaySignedIn(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <label
                    htmlFor="staySignedIn"
                    className="text-sm text-gray-700"
                  >
                    Stay signed in
                  </label>
                </div>
              </div>
            )}

            {/* Business Form */}
            {accountType === "business" && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-600">
                  Continue to register as a{" "}
                  <span className="font-semibold">business or nonprofit</span>,
                  or if you plan to sell a large number of goods.
                </p>
                <input
                  type="text"
                  placeholder="Business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Business email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={businessPassword}
                    onChange={(e) => setBusinessPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                </div>

                <select className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 text-gray-500">
                  <option value="">Where is your business registered?</option>
                  <option>Vietnam</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Singapore</option>
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="buyingOnly"
                    checked={buyingOnly}
                    onChange={(e) => setBuyingOnly(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="buyingOnly" className="text-sm text-gray-700">
                    I'm only interested in buying on eBay for now
                  </label>
                </div>

                <p className="text-xs text-gray-500">
                  By selecting Create business account, you agree to our{" "}
                  <span className="text-blue-600 cursor-pointer hover:underline">
                    User Agreement
                  </span>{" "}
                  and acknowledge reading our{" "}
                  <span className="text-blue-600 cursor-pointer hover:underline">
                    User Privacy Notice
                  </span>
                  .
                </p>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-full text-sm font-semibold transition"
                >
                  {loading ? "Creating..." : "Create business account"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        Copyright © 1995-2026 eBay Inc. All Rights Reserved. Accessibility, User
        Agreement, Privacy, Consumer Health Data, Payments Terms of Use,
        Cookies, CA Privacy Notice, Your Privacy Choices and AdChoice
      </footer>
    </div>
  );
}

export default Register;
