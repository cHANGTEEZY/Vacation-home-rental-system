import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/ui/BreadCrumb/BreadCrumb";
import Header from "../../components/Header/Header";
import { toast } from "react-toastify";
import "./Booking.css";
import { Trash } from "lucide-react";
import { Link } from "react-router-dom";

export default function Booking() {
  const [bookingData, setBookingData] = useState([]);
  const [propertyDetails, setPropertyDetails] = useState([]);
  const [reviewAvailable, setReviewAvailable] = useState(false);

  const navigate = useNavigate();

  const handleNavigate = (link) => {
    navigate(`/${link}`);
  };

  const getBookingDetails = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(
        "http://localhost:3000/get-booking-details",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setBookingData(data.bookedPropertyDetail);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const getPropertyDetails = async () => {
    if (bookingData.length === 0) return;

    const propertyIds = bookingData
      .map((booking) => booking.propertyId)
      .join(",");

    try {
      const response = await fetch(
        `http://localhost:3000/get-property-listings/multiple/${propertyIds}`
      );

      const data = await response.json();
      if (response.ok) {
        setPropertyDetails(data);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error fetching property details:", error.message);
    }
  };

  const checkIfBookingIsCancellable = async (bookingStartDate, bookingId) => {
    const currentDate = new Date();
    const bookingStart = new Date(bookingStartDate);
    const differenceInTime = bookingStart - currentDate;
    const differenceInDays = Math.ceil(
      differenceInTime / (1000 * 60 * 60 * 24)
    );

    if (differenceInDays >= 7) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:3000/get-booking-details/${bookingId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          toast.success(data.message);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        throw new error();
      }
    } else {
      toast.error("Booking cant be cancelled before 7 days");
    }
  };

  const checkIfPropertyIsReviewable = () => {
    const bookingEndDate = new Date(bookingData.bookingEndDate);
    const currentDate = new Date();

    if (currentDate > bookingEndDate) {
      setReviewAvailable(true);
    }
  };

  const checkIfBookingHasMatured = async () => {
    const bookingIds = bookingData.map((item) => item.bookingId);

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        "http://localhost:3000/get-booking-details",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingIds }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        console.log(data.message);
      } else {
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Something went wrong", error);
      throw new Error("Something went wrong");
    }
  };

  useEffect(() => {
    if (bookingData.length > 0) {
      getPropertyDetails();
      checkIfPropertyIsReviewable();
      checkIfBookingHasMatured();
    }
  }, [bookingData]);

  useEffect(() => {
    getBookingDetails();
  }, []);

  return (
    <>
      <Header showPropertyOptions={false} showSearch={false} />
      <section className="booking-component-container">
        <Breadcrumb />
        <div className="booking-component-header">
          <h1>Booking</h1>
        </div>
        <div className="booking-content-container">
          {bookingData.length === 0 ? (
            <>
              <div className="booking-data">
                <h2>No trips booked...yet!</h2>
                <p>
                  Time to dust off your bags and start planning your next
                  adventure
                </p>
                <button onClick={() => handleNavigate("")}>
                  Start Searching
                </button>
              </div>
              <p className="cant-find-booking">
                Can&apos;t find your reservation here?{" "}
                <span> Visit the Help Center </span>
              </p>
            </>
          ) : (
            <div className="booked-property-container">
              {propertyDetails.map((property, index) => {
                // Find the corresponding booking for this property
                const booking = bookingData.find(
                  (item) => item.propertyId === property.id
                );

                return (
                  <div key={index} className="booked-property-div">
                    <button
                      className={`delete-booking-list `}
                      onClick={() =>
                        checkIfBookingIsCancellable(
                          booking.bookingStartDate,
                          booking.bookingId
                        )
                      }
                    >
                      <Trash size={40} strokeWidth={1.5} />
                    </button>

                    <h1 className="booked-property-title">
                      Booking {index + 1}
                    </h1>
                    <div className="booked-property-image-grid-container">
                      {property.imageUrls &&
                        property.imageUrls.map((image, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="property-image-div-grid-item"
                          >
                            <img
                              src={image}
                              alt={`Property ${imgIndex + 1}`}
                              loading="lazy"
                              onError={(e) => {
                                console.error(
                                  `Error loading image ${imgIndex + 1}:`,
                                  e
                                );
                              }}
                            />
                          </div>
                        ))}
                    </div>
                    <div className="property-details">
                      <h2>{property.title}</h2>
                      <p>
                        Type: <span>{property.propertyType}</span>
                      </p>
                      <p>
                        Location: <span>{property.approximateLocation}</span>
                      </p>
                      {booking && (
                        <>
                          <p>
                            Check In:{" "}
                            {new Date(
                              booking.bookingStartDate
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p>
                            Check Out:{" "}
                            {new Date(
                              booking.bookingEndDate
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </>
                      )}
                      <Link
                        to={`/property-review/${
                          booking.propertyId
                        }?propertyImage=${encodeURIComponent(
                          property.imageUrls[0]
                        )}&propertyTitle=${property.title}`}
                      >
                        <button
                          className={`give-review-button ${
                            reviewAvailable ? "reviewable" : "not-reviewable"
                          }`}
                          disabled={!reviewAvailable}
                        >
                          Give Review
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
