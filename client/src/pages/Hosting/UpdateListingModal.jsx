import { useState } from "react";
import "./UpdateListingModal.css";

const UpdateListingModal = ({ listing, onClose, onSubmit }) => {
  const [updatedListing, setUpdatedListing] = useState(listing);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedListing((prev) => ({ ...prev, [name]: value }));
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
              value={updatedListing.property_id}
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
            <input
              id="propertyType"
              name="propertyType"
              value={updatedListing.propertyType}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="propertyRegion">Property Region</label>
            <input
              id="propertyRegion"
              name="propertyRegion"
              value={updatedListing.propertyRegion}
              onChange={handleChange}
            />
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
          <div className="form-group">
            <label htmlFor="amenities">Amenities</label>
            <input
              type="text"
              id="amenities"
              name="amenities"
              value={updatedListing.amenities}
              onChange={handleChange}
            />
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
