import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ImagePlus, Image, CircleX } from "lucide-react";
import {
  propertyDetail,
  propertyAmenities,
  realEstateModels,
} from "../../data/propertyDetail";
// import "./Listing.css";
import "./ListingTest.css";
import MapBox from "../../components/Map/MapBox";
import logo from "../../assets/images/Logo/StayNest.png";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const Listing = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [realEstateSelected, setRealEstateSelected] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listingData, setListingData] = useState({
    propertyImages: [],
    propertyType: "",
    propertyRegion: "",
    location: {
      latitude: null,
      longitude: null,
    },
    details: {},
    amenities: [],
  });

  const handleLocationChange = (lat, lng) => {
    if (!isNaN(lat) && !isNaN(lng)) {
      setListingData((prevData) => ({
        ...prevData,
        location: {
          latitude: lat,
          longitude: lng,
        },
      }));
    } else {
      console.error("Invalid coordinates:", lat, lng);
    }
  };

  const handleLocationChangeDebounced = debounce(handleLocationChange, 500);

  const createImage = (e) => {
    e.preventDefault();
    if (images.length < 5) {
      setImages([...images, null]);
    } else {
      toast.warning("Maximum 5 images allowed");
    }
  };

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const updatedImages = [...images];
      updatedImages[index] = file;
      setImages(updatedImages);
    }
  };

  const handleImageRemove = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };

  const handleRealEstateSelect = (title) => {
    setRealEstateSelected(title);
    setListingData((prevData) => ({
      ...prevData,
      propertyType: title,
    }));
  };

  const toggleAmenity = (title) => {
    setAmenities((prevAmenities) => {
      if (prevAmenities.includes(title)) {
        return prevAmenities.filter((amenity) => amenity !== title);
      } else {
        return [...prevAmenities, title];
      }
    });
  };

  const handleInputChange = (id, value) => {
    setListingData((prevData) => ({
      ...prevData,
      details: {
        ...prevData.details,
        [id]: value,
      },
    }));
  };

  const handleRegionChange = (region) => {
    setListingData((prevdata) => ({
      ...prevdata,
      propertyRegion: region,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Check if all images are actually uploaded (not just slots created)
    const validImages = images.filter((img) => img !== null);

    // Validation checks
    const validationErrors = [];

    if (validImages.length < 5) {
      validationErrors.push("Please upload exactly 5 images");
    }

    if (!listingData.propertyType) {
      validationErrors.push("Please select a property type");
    }

    if (!listingData.propertyRegion) {
      validationErrors.push("Please select a region");
    }

    if (amenities.length === 0) {
      validationErrors.push("Please select at least one amenity");
    }

    if (!listingData.location.latitude || !listingData.location.longitude) {
      validationErrors.push("Please set the property location on the map");
    }

    // Check if all required property details are filled
    const requiredDetails = propertyDetail.map((detail) => detail.title);
    const missingDetails = requiredDetails.filter(
      (detail) => !listingData.details[detail]
    );

    if (missingDetails.length > 0) {
      validationErrors.push(
        `Please fill in all required property details: ${missingDetails.join(
          ", "
        )}`
      );
    }

    // If there are any validation errors, show them and return
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();

    validImages.forEach((image) => {
      formData.append("propertyImages", image);
    });

    formData.append("propertyType", listingData.propertyType);
    formData.append("location[latitude]", listingData.location.latitude);
    formData.append("location[longitude]", listingData.location.longitude);
    formData.append("amenities", JSON.stringify(amenities));
    formData.append("details", JSON.stringify(listingData.details));
    formData.append("propertyRegion", listingData.propertyRegion);

    const token = localStorage.getItem("token");

    if (token) {
      try {
        const response = await fetch(
          "http://localhost:3000/become-a-host/listing",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (response.ok) {
          toast.success("Listing created successfully");

          // Clear all states after successful submission
          setImages([]);
          setRealEstateSelected(null);
          setAmenities([]);
          setListingData({
            propertyImages: [],
            propertyType: "",
            propertyRegion: "",
            location: { latitude: null, longitude: null },
            details: {},
            amenities: [],
          });

          setTimeout(() => {
            navigate("/account-settings/nestify/listings");
          }, 3000);
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || "Error creating listing");
        }
      } catch (err) {
        toast.error("Listing error: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (image) URL.revokeObjectURL(image);
      });
    };
  }, [images]);

  useEffect(() => {
    let token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized");
      return navigate("/");
    }
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleNavigate = (link) => {
    navigate(link);
  };

  return (
    <>
      <header className="listing-header">
        <img src={logo} alt="logo" onClick={() => handleNavigate("/")} />
        <button onClick={() => navigate("/account-settings/nestify/listings")}>
          Exit
        </button>
      </header>
      <section className="create-a-listing-section">
        <div className="create-listing-header">
          <h1>Create a Listing</h1>
        </div>
        <form
          className="listing-form"
          onSubmit={handleFormSubmit}
          onKeyDown={handleKeyPress}
        >
          {/* Images section */}
          <div className="listing-form-group">
            <div className="listing-form-header">
              <h2>Showcase Your Home</h2>
            </div>
            <div className="listing-image-section">
              {images.map((image, index) => (
                <div className="image-input" key={index}>
                  {image ? (
                    <>
                      <img src={URL.createObjectURL(image)} alt="uploaded" />
                      <span
                        className="remove-image"
                        onClick={() => handleImageRemove(index)}
                      >
                        <CircleX strokeWidth={2} size={20} />
                      </span>
                    </>
                  ) : (
                    <div className="placeholder">
                      <span>
                        <Image strokeWidth={1} size={40} />
                      </span>
                      <span>Insert an image of your house</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, index)}
                  />
                </div>
              ))}
              <div className="listing-image-button">
                {images.length < 5 && (
                  <button className="create-image-input" onClick={createImage}>
                    <ImagePlus size={60} strokeWidth={1} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Property type section */}
          <div className="listing-form-group">
            <div className="listing-form-header">
              <h2>Which of these best describes your place?</h2>
            </div>
            <div className="listing-property-type-section">
              {realEstateModels.map((model) => (
                <div
                  key={model.id}
                  className={`property-type-card ${
                    realEstateSelected === model.title ? "listing-selected" : ""
                  }`}
                  onClick={() => handleRealEstateSelect(model.title)}
                >
                  <img src={model.icon} alt={model.title} />
                  <p>{model.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Region selection section */}
          <div className="listing-form-group">
            <div className="listing-form-header">
              <h2>Which region does your place locate at?</h2>
            </div>
            <div className="property-region-section">
              <select
                name="region"
                id="region"
                onChange={(e) => handleRegionChange(e.target.value)}
                value={listingData.propertyRegion}
              >
                <option value="">Select a region</option>
                <option value="Bagmati">Bagmati</option>
                <option value="Madhesh">Madhesh</option>
                <option value="Koshi">Koshi</option>
                <option value="Karnali">Karnali</option>
                <option value="Gandaki">Gandaki</option>
                <option value="Lumbini">Lumbini</option>
                <option value="Sudurpaschim">Sudurpaschim</option>
              </select>
            </div>
          </div>

          {/* Property details section */}
          <div className="listing-form-group">
            <div className="listing-form-header">
              <h2>Share details about your place</h2>
            </div>
            <h3 className="listing-detail-section-header">Basic details</h3>
            <div className="property-features-detail-section">
              {propertyDetail.map((item) => (
                <div key={item.id} className="property-feature-detail-div">
                  <h3>
                    {item.title} <span className="required-asterisk">*</span>
                  </h3>
                  <input
                    type={item.type}
                    placeholder={item.placeHolder}
                    onChange={(e) =>
                      handleInputChange(item.title, e.target.value)
                    }
                    value={listingData.details[item.title] || ""}
                  />
                </div>
              ))}
            </div>

            {/* Property amenities section */}
            <h3 className="listing-detail-section-header">
              Tell guests what your place has to offer
            </h3>

            <div className="property-amenities-section">
              {propertyAmenities.map((item) => (
                <div
                  key={item.id}
                  className={`property-amenities-card ${
                    amenities.includes(item.title) ? "amenity-selected" : ""
                  }`}
                  onClick={() => toggleAmenity(item.title)}
                >
                  <item.icons size={40} strokeWidth={1.8} />
                  <p>{item.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Map and location input */}
          <div className="listing-form-group">
            <div className="listing-form-header">
              <h2>Where is your place located?</h2>
            </div>
            <MapBox
              onLocationChange={handleLocationChange}
              initialLatitude={listingData.location.latitude || 0}
              initialLongitude={listingData.location.longitude || 0}
            />
            <div className="location-inputs">
              <input
                type="number"
                placeholder="Latitude"
                value={listingData.location.latitude || ""}
                onChange={(e) =>
                  handleLocationChangeDebounced(
                    parseFloat(e.target.value),
                    listingData.location.longitude
                  )
                }
              />
              <input
                type="number"
                placeholder="Longitude"
                value={listingData.location.longitude || ""}
                onChange={(e) =>
                  handleLocationChangeDebounced(
                    listingData.location.latitude,
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
          </div>

          {/* Submit button */}
          <div className="listing-form-submit">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Listing..." : "Submit Listing"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
};

export default Listing;
