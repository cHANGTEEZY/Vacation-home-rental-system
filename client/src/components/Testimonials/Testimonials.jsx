import { useEffect, useState } from "react";
import { User } from "lucide-react";
import StarRating from "../Rating Star/Star";
import { useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import "./Testimonials.css";

const Testimonials = () => {
  const [reviewData, setReviewData] = useState(null);
  const { id } = useParams();
  console.log(reviewData);

  const getReviews = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/review-property/${id}`
      );
      const data = await response.json();
      console.log(data, "asd ");
      if (response.ok) {
        if (!reviewData) {
          setReviewData(data.message);
        }
      } else {
        console.log("Error getting review data");
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    getReviews();
  }, [id]);

  return (
    <section className="testimonial-wrapper">
      {reviewData ? (
        reviewData.map((review) => (
          <div className="testimonial" key={review.user_name}>
            <div className="testimonial-top">
              <span className="testimonial-user-profile">
                <User size={50} strokeWidth={1.3} />
              </span>
              <span className="testimonial-user-name">{review.user_name}</span>
            </div>
            <div className="testimonial-mid">
              <StarRating
                className="testimonial-star-rating"
                value={review.rating}
                size={15}
                readOnly
              />
              <span className="testimonial-date">
                {formatDistanceToNow(new Date(review.review_date_time), {
                  addSuffix: true,
                })}
              </span>{" "}
            </div>
            <div className="testimonial-bottom">
              <span className="testimonial-message">
                {review.review_message}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="no-review-div">
          There is no review for this property.
        </div>
      )}
    </section>
  );
};

export default Testimonials;
