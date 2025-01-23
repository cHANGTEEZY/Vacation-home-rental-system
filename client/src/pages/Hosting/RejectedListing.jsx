import "./RejectedListing.css";

import Slider from "react-slick";
import { HousePlus, Trash, Cog } from "lucide-react";
import { formatPrice } from "../../utils/formatPrice";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const RejectedListing = ({
  rejectedListings,
  rejectedListingData,
  onDelete,
  onUpdate,
  sliderSettings,
  setPath,
}) => {
  const [rejectionMessages, setRejectionMessages] = useState({});
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const redirect = useNavigate();

  const token = localStorage.getItem("token");
  const BASE_URL = "http://localhost:3000";

  useEffect(() => {
    if (!token) {
      redirect("/");
      return;
    }
  }, [token, redirect]);

  const getRejectionMessage = async (propertyId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/become-a-host/listing/get-rejected-message/${propertyId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
        return null;
      }
      return data.message;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  };

  useEffect(() => {
    const fetchRejectionMessages = async () => {
      if (rejectedListingData && rejectedListingData.length > 0) {
        const messages = {};
        for (const listing of rejectedListingData) {
          const message = await getRejectionMessage(
            listing.pending_property_id
          );
          if (message) {
            messages[listing.pending_property_id] = message;
          }
        }
        setRejectionMessages(messages);
      }
    };

    fetchRejectionMessages();
  }, [rejectedListingData]);

  const handleSubmitForReview = async (propertyId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/become-a-host/listing/submit-review/${propertyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        return toast.error(data.message);
      }
      toast.success(data.message);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleShowMessage = (propertyId) => {
    setSelectedMessage(rejectionMessages[propertyId]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMessage(null);
  };

  return (
    <div className="show-listings">
      {rejectedListings && rejectedListingData.length > 0 ? (
        <div className="listing-card-container">
          {rejectedListingData.map((listing, index) => (
            <div key={index} className="listing-card">
              <h1>Property {index + 1}</h1>
              <Trash
                className="delete-listing"
                onClick={() => {
                  onDelete(listing.pending_property_id);
                  setPath("pendingPath");
                }}
                size={35}
              />
              <Cog
                className="update-listing"
                onClick={() => {
                  onUpdate(listing, "pendingPath");
                  setPath("pendingPath");
                }}
                size={35}
              />
              <Slider {...sliderSettings}>
                {listing.imageUrls.map((image, imgIndex) => (
                  <div key={imgIndex} className="listing-card-image">
                    <img src={image} alt={`Property image ${imgIndex + 1}`} />
                  </div>
                ))}
              </Slider>
              <div className="listing-card-detail">
                <h3>{listing.title}</h3>
                <p>
                  <span className="listing-card-detail-head">Type: </span>
                  {listing.propertyType}
                </p>
                <p>
                  <span className="listing-card-detail-head">Region: </span>
                  {listing.propertyRegion}
                </p>
                <p>
                  <span className="listing-card-detail-head">Location: </span>
                  {listing.approximateLocation}
                </p>
                <p>
                  <span className="listing-card-detail-head">Price: </span> Rs{" "}
                  {formatPrice(listing.price)} night
                </p>
                <p>
                  <span className="listing-card-detail-head">
                    Guest allowed:{" "}
                  </span>
                  {listing.guests}
                </p>
                <p>
                  <span className="listing-card-detail-head">Bedrooms: </span>
                  {listing.bedrooms}
                </p>
                <p>
                  <span className="listing-card-detail-head">Beds: </span>
                  {listing.beds}
                </p>
                <p>
                  <span className="listing-card-detail-head">Bathroom: </span>
                  {listing.bathrooms}
                </p>
                <p>
                  <span className="listing-card-detail-head">Kitchen: </span>
                  {listing.kitchens}
                </p>
                <p>
                  <span className="listing-card-detail-head">Amenities: </span>
                  {listing.amenities + ""}
                </p>
                <div className="pending-propert-button-divs">
                  <button
                    className="admin-message-button"
                    onClick={() =>
                      handleShowMessage(listing.pending_property_id)
                    }
                  >
                    Show message
                  </button>
                  <button
                    className="submit-for-review"
                    onClick={() =>
                      handleSubmitForReview(listing.pending_property_id)
                    }
                  >
                    Submit for review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="nothing-to-do">
          <div className="nothing-to-do-inner-div">
            <HousePlus size={40} />
            <p>You don&apos;t have any rejected listings.</p>
          </div>
        </div>
      )}

      {showModal && (
        <div className="rejected-message-popup-modal">
          <div className="rejected-modal-content">
            <h2>Rejection Message</h2>
            <p>{selectedMessage}</p>
            <button className="rejected-close-modal" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RejectedListing;
