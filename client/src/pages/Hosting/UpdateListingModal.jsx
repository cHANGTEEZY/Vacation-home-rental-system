import { useState, useEffect } from "react";
import "./UpdateListingModal.css";
import { propertyAmenities } from "../../data/propertyDetail";
import { realEstateModels } from "../../data/propertyDetail";
import { mapData } from "../../data/map";

const UpdateListingModal = ({ listing, onClose, onSubmit }) => {
  const [updatedListing, setUpdatedListing] = useState(listing);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  useEffect(() => {
    const initialAmenities = Array.isArray(listing.amenities)
      ? listing.amenities
      : [];
    setSelectedAmenities(initialAmenities);
  }, [listing.amenities]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedListing((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities((prev) => {
      const newSelection = prev.includes(amenity.title)
        ? prev.filter((a) => a !== amenity.title)
        : [...prev, amenity.title];

      setUpdatedListing((prev) => ({
        ...prev,
        amenities: newSelection,
      }));

      return newSelection;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(updatedListing);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Update Listing</h2>
        <p>
          Make changes to your listing here. Click save when you&apos;re done.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="id">Property Id</label>
            <input
              id="id"
              name="id"
              value={
                updatedListing.property_id || updatedListing.pending_property_id
              }
              onChange={handleChange}
              readOnly
            />
          </div>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              value={updatedListing.title}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              id="price"
              name="price"
              type="number"
              value={updatedListing.price}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="propertyType">Property Type</label>
            <select
              id="propertyType"
              name="propertyType"
              value={updatedListing.propertyType}
              onChange={handleChange}
            >
              {realEstateModels.map((model) => (
                <option key={model.title} value={model.title}>
                  {model.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="propertyRegion">Property Region</label>
            <select
              id="propertyRegion"
              name="propertyRegion"
              value={updatedListing.propertyRegion}
              onChange={handleChange}
              required
            >
              {mapData.map((region) => (
                <option key={region.title} value={region.title}>
                  {region.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="approximateLocation">Approximate Location</label>
            <input
              id="approximateLocation"
              name="approximateLocation"
              value={updatedListing.approximateLocation}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="guests">Guests Allowed</label>
            <input
              id="guests"
              name="guests"
              type="number"
              value={updatedListing.guests}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="bedrooms">Bedrooms</label>
            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              value={updatedListing.bedrooms}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="beds">Beds</label>
            <input
              id="beds"
              name="beds"
              type="number"
              value={updatedListing.beds}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="bathrooms">Bathrooms</label>
            <input
              id="bathrooms"
              name="bathrooms"
              type="number"
              value={updatedListing.bathrooms}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="bathrooms">Kitchens</label>
            <input
              id="kitchens"
              name="kitchens"
              type="number"
              value={updatedListing.kitchens}
              onChange={handleChange}
            />
          </div>
          <div className="form-group amenities-group">
            <label>Amenities</label>
            <div className="amenities-grid">
              {propertyAmenities.map((amenity) => {
                const Icon = amenity.icons;
                const isSelected = selectedAmenities.includes(amenity.title);

                return (
                  <div
                    key={amenity.id}
                    className={`amenity-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleAmenityToggle(amenity)}
                  >
                    <Icon size={20} />
                    <span>{amenity.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="selected-amenities">
            <label>Selected Amenities:</label>
            <div className="selected-tags">
              {selectedAmenities.map((amenity, index) => (
                <span key={index} className="amenity-tag">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="save-button">
              Save changes
            </button>
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateListingModal;
