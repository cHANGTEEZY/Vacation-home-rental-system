import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import { useState, useEffect, useRef } from "react";
import {
  Share,
  ChevronDown,
  ChevronUp,
  UserRound,
  Calendar,
} from "lucide-react";
import {
  ac,
  bathTub,
  bonfire,
  fireExtinguisher,
  firstAidKit,
  freeParking,
  laundryMachine,
  television,
  wifi,
  swimmingpool,
} from "../../assets/Index";
import "./PropertyBooking.css";
import "./PropertyBookingTestimonialLocation.css";
import { formatPrice } from "../../utils/formatPrice";
import DateRangePickerComp from "../../components/ui/Calendar/DateRangePickerComp";
import { addDays, format } from "date-fns";
import AddGuest from "../../components/ui/Guest/AddGuest";
import { differenceInDays } from "date-fns";
import timeAgo from "../../utils/timeAgo";
import MapBox from "../../components/Map/MapBox";
import Footer from "../../components/Footer/Footer";
import Testimonials from "../../components/Testimonials/Testimonials";
import HostDetails from "../../components/Host/HostDetails";
import PropertyReviewDesc from "../../components/Review&Ratings/PropertyReviewDesc";
import Wishlist from "./Wishlist";
import { toast } from "react-toastify";

const PropertyBooking = () => {
  const { id } = useParams();
  const [propertyDetail, setPropertyDetail] = useState(null);
  const [totalGuests, setTotalGuests] = useState(1);

  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      key: "selection",
    },
  ]);

  const formattedStartDate = format(range[0].startDate, "MMM d, yyyy");
  const formattedEndDate = format(range[0].endDate, "MMM d, yyyy");

  const [showBookingNav, setShowBookingNav] = useState(false);
  const [showBookingNavButton, setShowBookingNavButton] = useState(false);

  useEffect(() => {
    function showNav() {
      const imageDiv = document.getElementById("property-image");
      if (imageDiv) {
        const rect = imageDiv.getBoundingClientRect();
        const height = rect.height;
        const isDivOutOfView = rect.bottom < height;
        setShowBookingNav(isDivOutOfView);
      }
    }

    function showNavButton() {
      const bookButton = document.getElementById("book-button");

      if (bookButton) {
        const rect = bookButton.getBoundingClientRect();
        const height = rect.height;
        const isButtonOutOfView = rect.bottom < height;
        setShowBookingNavButton(isButtonOutOfView);
      }
    }

    function callFunctions() {
      showNav();
      showNavButton();
    }
    callFunctions();
    window.addEventListener("scroll", callFunctions);

    return () => {
      window.removeEventListener("scroll", callFunctions);
    };
  }, []);

  const totalStay = differenceInDays(range[0].endDate, range[0].startDate) + 1;
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const datePickerRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const guestPickerRef = useRef(null);
  const guestButtonRef = useRef(null);

  const getPropertyDetail = async () => {
    const token = localStorage.getItem("token");
    const propertyId = id;
    if (token) {
      try {
        const response = await fetch(
          `http://localhost:3000/get-property-listings/${propertyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem(
            `cachedPropertyBookingData${id}`,
            JSON.stringify(data)
          );
          setPropertyDetail(Array.isArray(data) ? data[0] : data);
        } else {
          console.log(data.message);
        }
      } catch (err) {
        console.error(err.message);
      }
    }
  };

  const checkCachedData = () => {
    const propertyBookingData = localStorage.getItem(
      `cachedPropertyBookingData${id}`
    );
    if (propertyBookingData) {
      const cachedData = JSON.parse(propertyBookingData);
      setPropertyDetail(Array.isArray(cachedData) ? cachedData[0] : cachedData);
    } else {
      getPropertyDetail();
    }
  };

  const [bookedDates, setBookedDates] = useState([]);

  const getBookedDates = async () => {
    const propertyId = id;

    if (!propertyId) return;

    try {
      const response = await fetch(
        `http://localhost:3000/get-property-booked-date/${propertyId}`
      );
      const data = await response.json();

      if (response.ok) {
        const allDisabledDates = data.message.flatMap((booking) => {
          const start = new Date(booking.booking_start_date);
          const end = new Date(booking.booking_end_date);

          // Create an array of all dates between start and end (inclusive)
          const dates = [];
          let currentDate = new Date(start);

          while (currentDate <= end) {
            dates.push(new Date(currentDate)); // Push a copy of the current date
            currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
          }

          return dates; // Return the array of disabled dates for this booking
        });

        setBookedDates(allDisabledDates); // Set the flattened array of disabled dates
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const token = localStorage.getItem("token");

  const redirect = useNavigate();
  useEffect(() => {
    if (!token) {
      toast.error("Unauthorized");
      redirect("/");
    }
  }, [token]);

  useEffect(() => {
    checkCachedData();
    getBookedDates();
  }, [id]);

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const onDateSelect = (selectedRange) => {
    setRange(selectedRange);
  };

  const toggleGuestPicker = () => {
    setShowGuestPicker(!showGuestPicker);
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker]);

  //close guest picker when clicking outside
  useEffect(() => {
    const handleClickOutsideGuestPicker = (event) => {
      if (
        guestPickerRef.current &&
        !guestPickerRef.current.contains(event.target) &&
        guestButtonRef.current &&
        !guestButtonRef.current.contains(event.target)
      ) {
        setShowGuestPicker(false);
      }
    };

    if (showGuestPicker) {
      document.addEventListener("mousedown", handleClickOutsideGuestPicker);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideGuestPicker);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideGuestPicker);
    };
  }, [showGuestPicker]);
  if (!propertyDetail) {
    return <p>Loading...</p>;
  }
  const stayCost = propertyDetail.price * totalStay;
  const cleaningFee = 100 * totalGuests;
  const serviceFee = 500 * totalStay;

  const totalCost = stayCost + cleaningFee + serviceFee;

  const aminitiesIcons = {
    Wifi: wifi,
    TV: television,
    "Fire pit": bonfire,
    "BBQ grill": fireExtinguisher,
    "First aid kit": firstAidKit,
    "Free parking on premises": freeParking,
    "Bath tub": bathTub,
    "Air conditioning": ac,
    "Washing Machine": laundryMachine,
    "Fire Extinguisher": fireExtinguisher,
  };
  const renderAmenities = () => {
    if (!propertyDetail || !propertyDetail.amenities) {
      return <p>No amenities information available.</p>;
    }

    let amenitiesList;
    try {
      amenitiesList = JSON.parse(propertyDetail.amenities);
    } catch (error) {
      console.error("Error parsing amenities:", error);
      amenitiesList = propertyDetail.amenities;
    }

    if (!Array.isArray(amenitiesList)) {
      console.error("Amenities is not an array:", amenitiesList);
      return <p>Error loading amenities.</p>;
    }

    return (
      <ul className="amenity-list-icons-grid">
        {amenitiesList.map((item, index) => {
          const icon = aminitiesIcons[item];
          return (
            <li key={index} className="amenity-list-icons">
              <img src={icon} />
              <p>{item}</p>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <section className="property-booking-section">
      <Header showSearch={false} showPropertyOptions={false} isSticky={false} />

      <div
        className={`show-booking-nav-container ${
          showBookingNav ? "show-nav" : ""
        }`}
      >
        <div className="show-booking-button-nav">
          <ul>
            <li>
              <a href="#property-image">Photos</a>
            </li>
            <li>
              <a href="#amenities"> Amenities</a>
            </li>
            <li>
              <a href="#reviews">Reviews</a>
            </li>
            <li>
              <a href="#location">Location</a>
            </li>
          </ul>
          {showBookingNavButton && (
            <span id="show-booking-nav-span">
              <p>Rs {formatPrice(propertyDetail.price)} night</p>
              <Link
                to={`/property/booking/${id}?totalGuests=${totalGuests}&startDate=${formattedStartDate}&endDate=${formattedEndDate}&propertyImage=${encodeURIComponent(
                  propertyDetail.imageUrls[0]
                )}&propertyTitle=${encodeURIComponent(
                  propertyDetail.title
                )}&propertyLocation=${encodeURIComponent(
                  propertyDetail.approximateLocation
                )}&propertyPrice=${
                  propertyDetail.price
                }&totalPrice=${totalCost}`}
              >
                <button>Reserve</button>
              </Link>
            </span>
          )}
        </div>
      </div>

      <div className="property-booking-container">
        <div className="property-header">
          <div className="property-header-left">
            <h1>{propertyDetail.title}</h1>
          </div>
          <div className="property-header-right">
            <button>
              <Share /> Share
            </button>
            <Wishlist id={id} />
          </div>
        </div>
        <div className="property-image-grid-container" id="property-image">
          {propertyDetail.imageUrls && propertyDetail.imageUrls.length > 0 ? (
            propertyDetail.imageUrls.map((image, index) => (
              <div key={index} className="property-image-div-grid-item">
                <img
                  src={image}
                  alt={`Property ${index + 1}`}
                  loading="lazy"
                  onError={(e) => {
                    console.error(`Error loading image ${index + 1}:`, e);
                  }}
                />
              </div>
            ))
          ) : (
            <p>No images available for this property.</p>
          )}
        </div>
        <div className="property-details-and-booking-container">
          <div className="property-details-and-booking-left">
            <div className="property-details-and-booking-left-subtitle">
              <h2>Property in {propertyDetail.approximateLocation}</h2>
              <ul>
                <li>{propertyDetail.guests} guests</li>
                <li>{propertyDetail.bedrooms} bedroom</li>
                <li>{propertyDetail.beds} beds</li>
                <li>{propertyDetail.bathrooms} baths</li>
              </ul>
            </div>

            <div className="host-detail">
              <span className="host-image-circle">
                <a href="#host-detail">
                  <UserRound />
                </a>
              </span>
              <div>
                <HostDetails
                  showHostDetails={false}
                  showHostName={true}
                  id={id}
                />
                <p>Nesting created {timeAgo(propertyDetail.createdAt)}</p>
              </div>
            </div>

            <PropertyReviewDesc id={id} showTestimonialHeader={false} />

            <div className="featured-property-detail">
              <div>
                <span className="featured-property-detail-icon">
                  <Calendar size={34} strokeWidth={1.5} />
                </span>
                <div className="featured-property-detail-descriptions">
                  <h3>Free cancellation before 1 week of booking date</h3>
                  <p>Get a full refund if you change your mind.</p>
                </div>
              </div>
              {propertyDetail.swimmingPool ? (
                <div>
                  <span className="featured-property-detail-icon">
                    <img src={swimmingpool} alt="swimmingpool" />
                  </span>
                  <div className="featured-property-detail-descriptions">
                    <h3>Dive right in</h3>
                    This is one of the few places in the area with a pool.
                    <p></p>
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
            <div className="property-amenities-lists" id="amenities">
              <h1>What this place has to offer</h1>
              {renderAmenities()}
            </div>
          </div>
          <div className="property-details-and-booking-right">
            <div className="booking-card">
              <div className="booking-card-price-header">
                <h1> NPR {formatPrice(propertyDetail.price)} </h1>
                <span>night</span>
              </div>
              <div className="card-book-date">
                <span
                  className="card-book-button first-card-book-button"
                  onClick={toggleDatePicker}
                  ref={toggleButtonRef} // Ref for the button
                >
                  <h3>Check in</h3>
                  <p>{format(range[0].startDate, "MMM d, yyyy")}</p>{" "}
                  {/* Display formatted start date */}
                </span>
                <span
                  className="card-book-button second-card-book-button"
                  onClick={toggleDatePicker}
                  ref={toggleButtonRef} // Ref for the button
                >
                  <h3>Check out</h3>
                  <p>{format(range[0].endDate, "MMM d, yyyy")}</p>{" "}
                  {/* Display formatted end date */}
                </span>
                {showDatePicker && (
                  <div className="booking-date-picker" ref={datePickerRef}>
                    <DateRangePickerComp
                      range={range}
                      setRange={onDateSelect}
                      bookedDates={bookedDates}
                      disablePreviousDates={true}
                    />
                  </div>
                )}
              </div>

              <div
                className="card-book-guest"
                onClick={toggleGuestPicker}
                ref={guestButtonRef}
              >
                <div>
                  <div>
                    <h3>Guests</h3>
                    <p>
                      {totalGuests} {totalGuests === 1 ? "guest" : "guests"}
                    </p>
                  </div>
                  {toggleGuestPicker ? <ChevronDown /> : <ChevronUp />}
                </div>

                {showGuestPicker && (
                  <>
                    <div className="add-guest-picker" ref={guestPickerRef}>
                      <div onClick={(e) => e.stopPropagation()}>
                        <AddGuest
                          setTotalGuest={setTotalGuests}
                          maxGuestsAllowed={propertyDetail.guests}
                          initialGuests={totalGuests}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="book-button" id="book-button">
                <Link
                  to={`/property/booking/${id}?totalGuests=${totalGuests}&startDate=${formattedStartDate}&endDate=${formattedEndDate}&propertyImage=${encodeURIComponent(
                    propertyDetail.imageUrls[0]
                  )}&propertyTitle=${encodeURIComponent(
                    propertyDetail.title
                  )}&propertyLocation=${encodeURIComponent(
                    propertyDetail.approximateLocation
                  )}&propertyPrice=${
                    propertyDetail.price
                  }&totalPrice=${totalCost}`}
                >
                  <button>Reserve</button>
                </Link>
                <p>You won&apos;t be charged yet</p>
              </div>

              <div className="booking-total-cost-estimate">
                <span>
                  <p className="cost-type">
                    Rs {formatPrice(propertyDetail.price)} X {totalStay} nights
                  </p>
                  <p className="total-cost-for-type">Rs {stayCost}</p>
                </span>
                <span>
                  <p className="cost-type">Cleaning fee</p>
                  <p className="total-cost-for-type">
                    Rs {formatPrice(cleaningFee)}
                  </p>
                </span>
                <span>
                  <p className="cost-type">Nestify service fee</p>
                  <p className="total-cost-for-type">
                    Rs {formatPrice(serviceFee)}
                  </p>
                </span>
              </div>
              <div className="booking-total-with-taxes">
                <span>
                  <p className="booking-total-type">Total with taxes</p>
                  <p className="booking-total-price">
                    Rs {formatPrice(totalCost)}
                  </p>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="property-testimonials" id="reviews">
          <PropertyReviewDesc
            showReviewBox={false}
            showTestimonialHeader={true}
            id={id}
          />
          <div className="show-reviews">
            <Testimonials />
          </div>
        </div>
        <div className="property-location-div" id="location">
          <h1 className="property-location-title">Where you&apos;ll be</h1>
          <p className="property-approximate-location">
            {propertyDetail.approximateLocation}
          </p>
          <MapBox
            showLatitude={false}
            showLongitude={false}
            showSearchLocation={false}
            initialLatitude={propertyDetail.latitude}
            initialLongitude={propertyDetail.longitude}
            showPopup={true}
          />
        </div>
        <div id="host-detail">
          <HostDetails id={id} />
        </div>
      </div>

      <Footer />
    </section>
  );
};

export default PropertyBooking;
