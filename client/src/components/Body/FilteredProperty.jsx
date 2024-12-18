import "./FilteredProperty.css";
import Carousel from "../ui/Carousel/Carousel";
import { CircleChevronRight, CircleChevronLeft, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../../utils/formatPrice";

import { useFilteredData } from "../../context/FilteredDataContext";

const FilteredProperty = () => {
  const { filteredData, searchState } = useFilteredData();
  console.log("Filtered data", filteredData);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    <section className="filtered-property-section">
      {searchState && (
        <>
          <h1 className="home-h-one">Filtered Property</h1>
          <div className="filtered-property-grid">
            {filteredData.length > 0 &&
              filteredData.map((property) => (
                <div
                  key={property.id}
                  className="card"
                  onClick={(e) => handleCardClick(e, property.id)}
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
                    {property.image_urls?.map((image, index) => (
                      <div key={index} className="image-div">
                        <img
                          src={image}
                          alt={`Property ${index}`}
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </Carousel>
                  <div className="card-details">
                    <h2>{property.title}</h2>
                    <p>{property.approximateLocation}</p>
                    <p>{property.description}</p>
                    <span>
                      <strong>Rs {formatPrice(property.price)}</strong> per
                      night
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </section>
  );
};

export default FilteredProperty;
