import { useEffect, useState } from "react";
import Header from "../../components/Header/Header";
import "./PropertyPayment.css";
import { differenceInDays, format } from "date-fns";
import { useLocation, useParams } from "react-router-dom";
import { formatPrice } from "../../utils/formatPrice.js";
import Paypal from "../../components/Paypal/Paypal.jsx";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import goBack from "../../utils/goBackAPage.js";

const PropertyPayment = () => {
  const { id } = useParams();
  const location = useLocation();

  // Extract query parameters
  const queryParams = new URLSearchParams(location.search);
  const guests = queryParams.get("totalGuests");
  const bookingStartDate = queryParams.get("startDate");
  const bookingEndDate = queryParams.get("endDate");
  const propertyImage = decodeURIComponent(queryParams.get("propertyImage"));
  const propertyTitle = decodeURIComponent(queryParams.get("propertyTitle"));
  const propertyLocation = decodeURIComponent(
    queryParams.get("propertyLocation")
  );
  const propertyPrice = parseFloat(queryParams.get("propertyPrice"));

  // Parse the booking dates
  const parsedStartDate = new Date(bookingStartDate);
  const parsedEndDate = new Date(bookingEndDate);

  // Initialize state
  const [totalGuests, setTotalGuests] = useState(parseInt(guests) || 1);
  const [isPaid, setIsPaid] = useState(false);
  const [isPropertyBooked, setIsPropertyBooked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate total stay and costs
  const totalStay = differenceInDays(parsedEndDate, parsedStartDate);
  const cleaningFee = 100 * totalGuests;
  const serviceFee = 500 * totalStay;
  const totalCost = cleaningFee + serviceFee + propertyPrice * (totalStay );

  const payLoad = {
    bookingStartDate: format(parsedStartDate, "yyyy-MM-dd"),
    bookingEndDate: format(parsedEndDate, "yyyy-MM-dd"),
    totalGuests: totalGuests,
    totalStay: totalStay,
    bookedPropertyId: id,
    totalCost: totalCost,
    bookingStatus: "Booked",
  };
  console.log(payLoad.bookingStartDate);

  const handlePaymentSuccess = () => {
    setIsPaid(true);
    setLoading(true);
  };

  const handleBooking = async () => {
    if (!isPaid) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:3000/handle-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payLoad),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setIsPropertyBooked(true);
      } else {
        toast.error(data.message || "Booking failed. Please try again.");
      }
    } catch (error) {
      console.error(error.message);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPaid) {
      handleBooking();
    }
  }, [isPaid]);

  if (loading) {
    return <p>Processing payment...</p>; // You could add a spinner here
  }

  return (
    <section>
      <Header
        showSearch={false}
        showNavAccountManagement={false}
        showSetupButton={false}
        showPropertyOptions={false}
      />
      <div className="confirm-and-pay-container">
        <h1 className="confirm-and-pay-header">Confirm and pay</h1>

        <div className="confirm-trip-details">
          <span className="go-back" onClick={goBack}>
            <ArrowLeft />
          </span>
          <div className="confirm-details-card">
            <div className="confirm-details-card-top">
              <div className="confirm-details-card-image">
                <img src={propertyImage} alt="property" />
              </div>
              <div className="confirm-details-card-description">
                <p className="confirm-details-card-description-title">
                  {propertyTitle}
                </p>
                <p>Property in {propertyLocation}</p>
              </div>
            </div>
            <div className="confirm-details-card-bottom">
              <h2 className="confirm-details-card-bottom-title">
                Price details
              </h2>
              <div className="booking-total-cost-estimate">
                <span>
                  <p className="cost-type">
                    Rs {formatPrice(propertyPrice)} X {totalStay } nights
                  </p>
                  <p className="total-cost-for-type">
                    Rs {formatPrice(propertyPrice * (totalStay ))}
                  </p>
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
          <div className="paypal-payment">
            <Paypal
              amount={totalCost}
              propertyId={id}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyPayment;
