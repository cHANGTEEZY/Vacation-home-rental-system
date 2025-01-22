import { Link } from "react-router-dom";
import { HousePlus, Trash, Cog } from "lucide-react";
import Slider from "react-slick";
import { formatPrice } from "../../utils/formatPrice";

const ListingsList = ({
  listings,
  listingData,
  onDelete,
  onUpdate,
  sliderSettings,
  setPath,
}) => {
  return (
    <div className="show-listings">
      {listings && listingData.length > 0 ? (
        <div className="listing-card-container">
          {listingData.map((listing, index) => (
            <div key={index} className="listing-card">
              <h1>Property {index + 1}</h1>
              <Trash
                className="delete-listing"
                onClick={() => {
                  onDelete(listing.property_id);
                  setPath("listingPath");
                }}
                size={35}
              />
              <Cog
                className="update-listing"
                onClick={() => {
                  setPath("listingPath");
                  onUpdate(listing);
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
                  </span>{" "}
                  {listing.guests}
                </p>
                <p>
                  <span className="listing-card-detail-head">Bedrooms: </span>{" "}
                  {listing.bedrooms}
                </p>
                <p>
                  <span className="listing-card-detail-head">Beds: </span>{" "}
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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="nothing-to-do">
          <div className="nothing-to-do-inner-div">
            <HousePlus size={40} />
            <p>You don&apos;t have any listing created.</p>
            <Link to="/become-a-host">
              <button className="create-a-listing-button">Create now</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsList;
