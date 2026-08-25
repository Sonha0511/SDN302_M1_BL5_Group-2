import API from "./api"; // Kế thừa cấu hình axios gốc của nhóm

export const getMyListings = () => API.get("/seller/listings");
export const createListing = (formData) =>
  API.post("/seller/listings", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const findListingMatches = (search) =>
  API.get("/listings", { params: { search, limit: 6, page: 1 } });
export const updateListing = (id, formData) =>
  API.put(`/seller/listings/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteListing = (id) => API.delete(`/seller/listings/${id}`);
export const getMyOrders = () => API.get("/seller/orders");
export const updateOrderStatus = (id, status) =>
  API.patch(`/seller/orders/${id}/status`, { status });
export const confirmOrder = (id) => API.patch(`/seller/orders/${id}/confirm`);
export const toggleListing = (id) => API.patch(`/seller/listings/${id}/toggle`);
export const getMySellerReviews = () => API.get("/reviews/seller/me");
export const respondToReview = (id, comment) =>
  API.post(`/reviews/${id}/seller-response`, { comment });
