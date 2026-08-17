import API from "./api"; // Kế thừa cấu hình axios gốc của nhóm

export const getMyListings = () => API.get("/seller/listings");
export const createListing = (formData) =>
  API.post("/seller/listings", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateListing = (id, formData) =>
  API.put(`/seller/listings/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteListing = (id) => API.delete(`/seller/listings/${id}`);
export const getMyOrders = () => API.get("/seller/orders");
export const updateOrderStatus = (id, status) =>
  API.patch(`/seller/orders/${id}/status`, { status });
export const toggleListing = (id) => API.patch(`/seller/listings/${id}/toggle`);
