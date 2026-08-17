import React from "react";

function StarRating({
  value = 0,
  size = "sm",
  interactive = false,
  onChange,
  className = "",
}) {
  const roundedValue = Math.round(Number(value) || 0);
  const starSize =
    size === "lg" ? "text-3xl" : size === "md" ? "text-lg" : "text-sm";

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= roundedValue;
        const classNames = `${starSize} leading-none transition ${
          filled ? "text-amber-400" : "text-gray-300"
        }`;

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              className={`${classNames} rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:text-amber-400`}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              {"\u2605"}
            </button>
          );
        }

        return (
          <span key={star} className={classNames}>
            {"\u2605"}
          </span>
        );
      })}
    </div>
  );
}

export default StarRating;
