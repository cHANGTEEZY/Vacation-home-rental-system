import "./PropertyOptions.css";

import { useState } from "react";
import { MapPin, DollarSign, Home, Star } from "lucide-react";
import FilterIcon from "./FilterIcon";
import StarRating from "../Rating Star/Star";
import { formatPrice } from "../../utils/formatPrice";
import { variety } from "../../data/variety";
import { toast } from "react-toastify";
import { useFilteredData } from "../../context/FilteredDataContext";

const filters = [
  { icon: Home, label: "Type" },
  { icon: MapPin, label: "Distance" },
  { icon: DollarSign, label: "Price" },
  { icon: Star, label: "Rating" },
];

const PropertyOptions = () => {
  const { setFilteredData, setSearchState } = useFilteredData();
  const [activeFilter, setActiveFilter] = useState(null);
  const [price, setPrice] = useState([0, 100000]);
  const [type, setType] = useState("Tent");
  const [rating, setRating] = useState(3);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedDistanceOption, setSelectedDistanceOption] = useState(null);
  const [userLatitude, setUserLatitude] = useState();
  const [userLongitude, setUserLongitude] = useState();

  const handleFilterClick = (index) => {
    setActiveFilter(activeFilter === index ? null : index);
    setDialogOpen(true);
  };

  const handlePriceChange = (event) => {
    setPrice([parseInt(event.target.value), price[1]]);
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setDialogOpen(false);
    setActiveFilter(null);
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    setDialogOpen(false);
    setActiveFilter(null);
  };

  const handleDistanceOptionSelect = (option) => {
    setSelectedDistanceOption(option);
    const locationData = navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;
        setUserLatitude(lat);
        setUserLongitude(long);
      }
    );
    setDialogOpen(false);
    setActiveFilter(null);
  };

  const handlePriceSelect = () => {
    setDialogOpen(false);
    setActiveFilter(null);
  };

  const printFilter = async () => {
    const formData = {
      minPrice: price[0],
      maxPrice: price[1],
      propertyType: type,
      rating,
      distance: selectedDistanceOption,
      userLatitude,
      userLongitude,
    };
    console.log("Formdata is ", formData);
    try {
      const response = await fetch("http://localhost:3000/filter/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
        return;
      }
      toast.info(data.message);
      setFilteredData(data.properties);
      setSearchState(true);
    } catch (error) {
      throw new Error("Something went wrong", error.message);
    }
  };

  return (
    <div className="property-options">
      <div className="filter-icons">
        {filters.map((filter, index) => (
          <FilterIcon
            key={index}
            icon={filter.icon}
            label={filter.label}
            isActive={activeFilter === index}
            onClick={() => handleFilterClick(index)}
          />
        ))}
        <div className="bar-seperator"></div>
        <button className="apply-filters" onClick={() => printFilter()}>
          Apply Filters
        </button>
      </div>

      {isDialogOpen && activeFilter === 0 && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h2>Select Type</h2>
            <ul className="type-options">
              {variety.map((item) => (
                <li
                  key={item.filterTitle}
                  onClick={() => handleTypeChange(item.filterTitle)}
                  className={type === item.filterTitle ? "selected" : ""}
                >
                  {item.filterTitle !== "Hotel" &&
                  item.filterTitle !== "Cottage" &&
                  item.filterTitle !== "Any" ? (
                    <span>
                      <item.filterIcon /> {item.filterTitle}
                    </span>
                  ) : (
                    <span>
                      <img
                        src={item.filterIcon}
                        alt={item.filterTitle}
                        style={{ width: 24, height: 24 }}
                      />
                      {item.filterTitle}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isDialogOpen && activeFilter === 1 && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h2>Select Distance Option</h2>
            <ul className="distance-options">
              <li onClick={() => handleDistanceOptionSelect("Nearest")}>
                Nearest
              </li>
              <li onClick={() => handleDistanceOptionSelect("Furthest")}>
                Furthest
              </li>
            </ul>
          </div>
        </div>
      )}

      {isDialogOpen && activeFilter === 2 && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h2>Select Price Range</h2>
            <input
              type="range"
              min="0"
              max="100000"
              value={price[0]}
              onChange={handlePriceChange}
              className="price-range-slider"
            />
            <div className="range-values">
              <span>Rs{formatPrice(price[0])} </span>
              <span>Rs{formatPrice(price[1])} </span>
            </div>
            <button onClick={handlePriceSelect} className="price-apply">
              Apply Price
            </button>
          </div>
        </div>
      )}

      {isDialogOpen && activeFilter === 3 && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h2>Select Rating</h2>
            <StarRating
              selectedRating={rating}
              onRatingChange={handleRatingChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyOptions;
