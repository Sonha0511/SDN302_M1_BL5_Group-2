import API from "./api";

export const getDisputes = () => API.get("/disputes");
export const getDisputeById = (id) => API.get(`/disputes/${id}`);
export const createDispute = (payload) => API.post("/disputes", payload);
export const updateDispute = (id, payload) =>
  API.patch(`/disputes/${id}`, payload);

// Shared copy so the seller hub, the buyer list, and the detail page all read
// the same way.
export const REASON_LABELS = {
  NOT_RECEIVED: "Item not received",
  WRONG_ITEM: "Wrong item sent",
  DAMAGED: "Arrived damaged",
  NOT_AS_DESCRIBED: "Doesn't match description",
  FAKE_COUNTERFEIT: "Counterfeit item",
  MISSING_PARTS: "Missing parts or accessories",
  LATE_DELIVERY: "Arrived late",
  REFUND_NOT_RECEIVED: "Refund not received",
  OTHER: "Other reason",
};

export const STATUS_LABELS = {
  OPEN: "Action needed",
  SELLER_RESPONDED: "Waiting for buyer",
  ESCALATED: "eBay asked to step in",
  UNDER_REVIEW: "Under review by eBay",
  RESOLVED_REFUND: "Closed - refunded",
  RESOLVED_REPLACE: "Closed - replaced",
  RESOLVED_REJECTED: "Closed - declined",
  CLOSED: "Closed",
};

// eBay leans on a small palette: red for "you must act", blue for in progress,
// green for a good outcome, grey for anything already finished.
export const STATUS_STYLES = {
  OPEN: "bg-red-50 text-red-700 ring-red-200",
  SELLER_RESPONDED: "bg-blue-50 text-blue-700 ring-blue-200",
  ESCALATED: "bg-amber-50 text-amber-800 ring-amber-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-800 ring-amber-200",
  RESOLVED_REFUND: "bg-green-50 text-green-700 ring-green-200",
  RESOLVED_REPLACE: "bg-green-50 text-green-700 ring-green-200",
  RESOLVED_REJECTED: "bg-gray-100 text-gray-700 ring-gray-300",
  CLOSED: "bg-gray-100 text-gray-700 ring-gray-300",
};

export const PRIORITY_STYLES = {
  HIGH: "bg-red-600 text-white",
  MEDIUM: "bg-amber-500 text-white",
  LOW: "bg-gray-400 text-white",
};

export const CLOSED_STATUSES = [
  "RESOLVED_REFUND",
  "RESOLVED_REPLACE",
  "RESOLVED_REJECTED",
  "CLOSED",
];

export const formatPrice = (value = 0) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

// eBay gives sellers 3 business days to respond before a case can be escalated.
export const responseDueIn = (createdAt) => {
  const deadline = new Date(createdAt).getTime() + 3 * 24 * 60 * 60 * 1000;
  const hoursLeft = Math.round((deadline - Date.now()) / (60 * 60 * 1000));
  if (hoursLeft <= 0) return { overdue: true, label: "Response overdue" };
  if (hoursLeft < 24)
    return { overdue: false, label: `${hoursLeft}h left to respond` };
  return {
    overdue: false,
    label: `${Math.round(hoursLeft / 24)}d left to respond`,
  };
};
