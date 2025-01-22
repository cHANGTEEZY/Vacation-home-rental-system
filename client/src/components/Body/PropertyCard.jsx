import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleChevronRight, CircleChevronLeft } from "lucide-react";
import Carousel from "../ui/Carousel/Carousel";
import { formatPrice } from "../../utils/formatPrice";
import "./PropertyCard.css";

const PropertyCard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState([]);
  console.log(propertyDetails);
  const redirect = useNavigate();

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    draggable: false,
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const getProperties = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/get-property-listings"
      );
      const data = await response.json();
      if (response.ok) {
        setPropertyDetails(data);
      } else {
        console.log("Error retrieving details");
        console.log(data.message);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    getProperties();
  }, []);

  const handleCardClick = (e, propertyId) => {
    e.preventDefault();
    if (e.target.closest(".navigate-button")) {
      return;
    }

    if (!isLoggedIn) {
      redirect("/login");
    } else {
      window.open(`/property/${propertyId}`, "_blank");
    }
  };

  return (
    <>
      {propertyDetails.length > 0 ? (
        propertyDetails.map((property) => (
          <div
            key={property.property_id}
            className="card"
            onClick={(e) => handleCardClick(e, property.property_id)}
          >
            <Carousel
              settings={settings}
              customArrows={{
                left: (
                  <CircleChevronLeft className="navigate-button left-arrow card-button" />
                ),
                right: (
                  <CircleChevronRight className="navigate-button right-arrow card-button" />
                ),
              }}
            >
              {property.imageUrls?.map((image, index) => (
                <div key={index} className="image-div">
                  <img src={image} alt={`Property ${index}`} loading="lazy" />
                </div>
              ))}
            </Carousel>
            <div className="card-details">
              <h2>{property.title}</h2>
              <p>{property.approximateLocation}</p>
              <p>{property.description}</p>
              <span>
                <strong>Rs {formatPrice(property.price)}</strong> per night
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="listed-properties-error-msg">No properties available.</p>
      )}
    </>
  );
};

export default PropertyCard;
