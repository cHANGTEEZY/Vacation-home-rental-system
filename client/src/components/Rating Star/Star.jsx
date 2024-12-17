import { useEffect, useState } from "react";
import "./Star.css";

const StarRating = ({
  value = 0,
  size = 25,
  readOnly = false,
  onRatingChange,
}) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    setRating(value);
  }, [value]);

  const handleRatingClick = (ratingValue) => {
    if (!readOnly) {
      setRating(ratingValue);
      if (onRatingChange) {
        onRatingChange(ratingValue);
      }
    }
  };

  return (
    <div className="star-rating-div">
      <div className="star-rating">
        {[...Array(5)].map((star, index) => {
          const ratingValue = index + 1;

          return (
            <label key={index}>
              <input
                type="radio"
                name="rating"
                value={ratingValue}
                onClick={() => handleRatingClick(ratingValue)}
                style={{ display: "none" }}
              />
              <svg
                className="star"
                onMouseEnter={() => {
                  if (!readOnly) setHover(ratingValue);
                }}
                onMouseLeave={() => {
                  if (!readOnly) setHover(0);
                }}
                fill={ratingValue <= (hover || rating) ? "#000" : "#e4e5e9"}
                height={`${size}px`}
                width={`${size}px`}
                viewBox="0 0 25 25"
              >
                <path d="M12 .587l3.668 7.425 8.332 1.209-6.036 5.887 1.427 8.315L12 18.897l-7.391 3.926 1.427-8.315L0 9.221l8.332-1.209L12 .587z" />
              </svg>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default StarRating;
