import { useEffect, useState } from "react";
import { ratingWingLeft } from "../../assets/Index";
import { ratingWingRight } from "../../assets/Index";
import "./PropertyReviewDesc.css";

const PropertyReviewDesc = ({
  showReviewBox = true,
  showTestimonialHeader = true,
  id,
}) => {
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const getRatingsAndReviews = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/review-property/${id}`
        );
        const data = await response.json();
        if (response.ok) {
          setTotalReviews(data.totalReviews);
          setAverageRating(data.averageRating);
        } else {
          console.log(data.message);
        }
      } catch (error) {
        console.error(error.message);
        throw new error();
      }
    };
    if (id) {
      getRatingsAndReviews();
    }
  }, [id]);

  return (
    <>
      {showReviewBox && (
        <div className="property-review-box">
          <div className="wing-image-div">
            <img src={ratingWingLeft} alt="" />
            <p>Guest favourite</p>
            <img src={ratingWingRight} alt="" />
          </div>
          <p>One of the most loved homes on staynest, according to guests</p>
          <h4>{averageRating}</h4>
          <p>{totalReviews} reviews</p>
        </div>
      )}
      {showTestimonialHeader && (
        <div className="testimonial-header">
          <img src={ratingWingLeft} alt="" />
          <p>{averageRating}</p>
          <img src={ratingWingRight} alt="" />
        </div>
      )}
    </>
  );
};

export default PropertyReviewDesc;
