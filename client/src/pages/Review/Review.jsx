import { useParams, useLocation } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./Review.css";
import StarRating from "../../components/Rating Star/Star";
import { useState, useRef } from "react";
import { toast } from "react-toastify";

const Review = () => {
  const { propertyId } = useParams();
  const location = useLocation();
  const paramQuery = new URLSearchParams(location.search);
  const propertyImage = paramQuery.get("propertyImage");
  const propertyTitle = paramQuery.get("propertyTitle");

  const [rating, setRating] = useState(0);
  const textRef = useRef(null);

  const handleRating = (ratingValue) => {
    setRating(ratingValue);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    const message = textRef.current.value;

    if (rating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    if (!message.trim()) {
      toast.error("Please provide a review message");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/review-property/${propertyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message, rating }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setRating(0);
        textRef.current.value = "";
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error.message);
      toast.error("An error occurred while submitting the review");
    }
  };

  return (
    <section className="review-section">
      <Header showSearch={false} />
      <div className="review-section-header-div">
        <h1 className="review-section-header">Rate and Review the property</h1>
        <p>
          Help others by rating and reviewing your experience with this
          property. Your feedback is valuable in guiding future guests!
        </p>
      </div>

      <div className="review-main-section">
        <div className="review-property">
          <img src={propertyImage} alt="Property" />
          <p>{propertyTitle}</p>
        </div>

        <div className="review-div">
          <h1 className="review-div-header">Give a rating and Review</h1>
          <StarRating value={rating} onRatingChange={handleRating} />
          <h3 className="review-text-area-header">Write a review</h3>

          <textarea
            ref={textRef}
            className="write-a-review-message"
            placeholder="Review message"
          />
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>

      <Footer />
    </section>
  );
};

export default Review;
