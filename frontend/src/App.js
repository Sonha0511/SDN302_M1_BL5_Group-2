import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import UserAgreement from "./pages/UserAgreement";
import PrivacyNotice from "./pages/PrivacyNotice";
import ProductListing from "./pages/listing/ProductListing";
import ProductDetail from "./pages/listing/ProductDetail";
import Checkout from "./pages/listing/Checkout";
import ReviewOrder from "./pages/listing/ReviewOrder";
import NotFound from "./pages/NotFound";
import Messages from "./pages/chat/Messages";
import SellerListings from "./pages/SellerListings";
import SellerInventory from "./pages/SellerInventory";
import SellerEditListing from "./pages/SellerEditListing";
import SellerProfile from "./pages/SellerProfile";
import Sell from "./pages/Sell";
import SellStart from "./pages/SellStart";
import SellerOrders from "./pages/SellerOrders";
import SellerMarketing from "./pages/SellerMarketing";
import SellerOverview from "./pages/SellerOverview";
import SellerRegisterNotice from "./pages/seller/SellerRegisterNotice";
import MyOrders from "./pages/orders/MyOrders";
import OrderDetail from "./pages/orders/OrderDetail";
import CreateDispute from "./pages/dispute/CreateDispute";
import DisputeList from "./pages/dispute/DisputeList";
import DisputeDetail from "./pages/dispute/DisputeDetail";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user-agreement" element={<UserAgreement />} />
          <Route path="/privacy-notice" element={<PrivacyNotice />} />
          <Route path="/listings" element={<ProductListing />} />
          <Route path="/listing/:id" element={<ProductDetail />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/review/:orderId" element={<ReviewOrder />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/sell/start" element={<SellStart />} />
          <Route path="/seller/register-notice" element={<SellerRegisterNotice />} />
          <Route path="/become-seller" element={<SellerRegisterNotice />} />
          <Route path="/seller/listings" element={<SellerListings />} />
          <Route path="/seller/overview" element={<SellerOverview />} />
          <Route path="/seller/inventory" element={<SellerInventory />} />
          <Route path="/seller/listings/:id/edit" element={<SellerEditListing />} />
          <Route path="/seller/marketing" element={<SellerMarketing />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/:id" element={<SellerProfile />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/disputes/create/:orderId" element={<CreateDispute />} />
          <Route path="/disputes/my" element={<DisputeList />} />
          <Route path="/disputes/:id" element={<DisputeDetail />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
