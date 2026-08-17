import React from "react";

export const formatPositiveFeedback = (reputation) => {
  if (!reputation || !reputation.totalReviews) return "No feedback yet";
  return `${reputation.positiveFeedbackPercent}% positive feedback`;
};

function SellerReputation({ reputation, compact = false, badgeOnly = false }) {
  if (!reputation) return null;
  if (badgeOnly && !reputation.badge) return null;

  if (badgeOnly) {
    return (
      <span className="inline-flex w-fit items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        {reputation.badge}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
      <span className="text-gray-600">{formatPositiveFeedback(reputation)}</span>
      {reputation.totalReviews > 0 && (
        <span className="text-gray-400">({reputation.totalReviews})</span>
      )}
      {reputation.badge && (
        <span
          className={`font-semibold rounded-full border px-2 py-0.5 ${
            compact
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-blue-50 text-blue-700 border-blue-100"
          }`}
        >
          {reputation.badge}
        </span>
      )}
    </div>
  );
}

export default SellerReputation;
