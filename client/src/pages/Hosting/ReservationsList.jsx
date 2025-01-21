import { ClipboardCheck } from "lucide-react";
import { formatDate } from "../../utils/formatDate";
import { formatPrice } from "../../utils/formatPrice";

const ReservationsList = ({ bookedProperties, onMessageClient }) => {
  return (
    <div className="show-reservations">
      {bookedProperties.length > 0 ? (
        bookedProperties.map((property) => (
          <div key={property.bookingId}>
            <div className="booked-grid">
              {property.propertyDetails.imageUrls.map((image, index) => (
                <div className="property-image-div-grid-item" key={index}>
                  <img src={image} alt="" />
                </div>
              ))}
            </div>
            <div className="host-booked-properties-details">
              <h3>{property.propertyDetails.title}</h3>
              <p>
                Booking Dates: {formatDate(property.bookingStartDate)} to{" "}
                {formatDate(property.bookingEndDate)}
              </p>
              <p>Total Price: Rs {formatPrice(property.totalPrice)}</p>
              <p>Guests: {property.totalGuests}</p>
              <p>Type: {property.propertyDetails.propertyType}</p>
              <p>Location: {property.propertyDetails.approximateLocation}</p>
              <button
                onClick={() => onMessageClient(property.clientId)}
                className="message-client-button"
              >
                Message Client
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="nothing-to-do">
          <div className="nothing-to-do-inner-div">
            <ClipboardCheck size={40} />
            <p>You don&apos;t have any properties booked.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsList;
