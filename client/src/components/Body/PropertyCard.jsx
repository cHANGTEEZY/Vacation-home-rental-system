import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleChevronRight, CircleChevronLeft, Heart } from "lucide-react";
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

  // const checkCachedProperties = () => {
  //   const cachedData = localStorage.getItem("propertyDetails");
  //   if (cachedData) {
  //     setPropertyDetails(JSON.parse(cachedData));
  //   } else {
  //     getProperties();
  //   }
  // };

  useEffect(() => {
    getProperties();
  }, []);

  const handleCardClick = (e, propertyId) => {
    // Prevent default behavior for all clicks within the card
    e.preventDefault();

    // Check if the click is on the carousel navigation buttons
    if (e.target.closest(".navigate-button")) {
      // Do nothing for carousel navigation clicks
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
            <Heart className="favourite-button card-button" />
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
        <p>No properties available.</p>
      )}
    </>
  );
};

export default PropertyCard;
