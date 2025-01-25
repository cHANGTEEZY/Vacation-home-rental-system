import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./HostingSetup.css";

import ReservationsList from "./ReservationsList";
import ListingsList from "./ShowListings";

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import getUserName from "../../utils/getUserName";
import UpdateListingModal from "./UpdateListingModal";
import RejectedListing from "./RejectedListing";

const HostingSetup = () => {
  const [name, setName] = useState("");
  const [listings, setListings] = useState(false);
  const [listingData, setListingData] = useState([]);
  const [rejectedListings, setRejectedListings] = useState(false);
  const [rejectedData, setRejectedData] = useState([]);
  const [bookedProperties, setBookedProperties] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [path, setPath] = useState("");
  console.log("path is ", path);

  const [listedButtonClicked, setListedButtonClicked] = useState("listed");
  const navigate = useNavigate();
  useEffect(() => {
    getUserName(setName, navigate);
  }, [navigate]);

  const fetchListingData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/become-a-host/listing",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Response status", response.status);
      const data = await response.json();

      if (response.ok) {
        setListings(true);
        setListingData(data);
      } else {
        console.log("Error fetching listing data");
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  const fetchRejectedListingData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/become-a-host/listing/rejected-properties",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Response status", response.status);
      const data = await response.json();

      if (response.ok) {
        setRejectedListings(true);
        setRejectedData(data);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    fetchRejectedListingData();
  }, []);
  useEffect(() => {
    const fetchBookedProperties = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:3000/become-a-host/listing/booked-properties",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setBookedProperties(data);
        } else {
          console.error(
            "Failed to fetch booked properties:",
            response.statusText
          );
        }
      } catch (error) {
        console.error("Error fetching booked properties:", error);
      }
    };

    fetchBookedProperties();
  }, []);

  const sendMessage = (clientId) => {};

  const checkCachedData = () => {
    const cachedData = localStorage.getItem("cachedListings");
    if (cachedData) {
      setListingData(JSON.parse(cachedData));
    } else {
      fetchListingData();
    }
  };

  useEffect(() => {
    checkCachedData();
  }, []);

  const handleListedButtonClick = (button) => {
    setListedButtonClicked(button);
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    arrows: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  const handleDelete = async (id) => {
    const confirmed = confirm("Do you want to delete this property.");

    if (!confirmed) {
      return toast.success("Cancelled delete");
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const listingPath = "http://localhost:3000/become-a-host/listing";
    const pendingPath =
      "http://localhost:3000/become-a-host/listing/pending-property";

    try {
      const response = await fetch(
        path === "listingPath" ? listingPath : pendingPath,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        const message = data.message;
        toast.success(message);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const message = data;
        toast.error(message.message);
        toast.error(message.errorMessage);
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  const handleUpdate = (listing) => {
    setSelectedListing(listing);
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async (updatedData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      const listingPath = "http://localhost:3000/become-a-host/listing";
      const pendingPath =
        "http://localhost:3000/become-a-host/listing/pending-property";

      const response = await fetch(
        path === "listingPath" ? listingPath : pendingPath,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "listing updated successfully");
        setShowUpdateModal(false);
        fetchListingData();
      } else {
        toast.error(data.message || "Error updating listing");
      }
    } catch (err) {
      console.log(err.message);
      toast.error("Error updating listing");
    }
  };

  return (
    <>
      <Header showPropertyOptions={false} showSearch={false} />
      <section className="realestate-hosting-wrapper">
        <div className="hosting-header">
          <h1>Welcome back, {name}</h1>
          <Link to="/become-a-host">
            <button className="create-a-listing-button">
              Create a Listing
            </button>
          </Link>
        </div>

        <div className="hosting-status-description">
          <h2>Your reservations</h2>
          <ReservationsList
            bookedProperties={bookedProperties}
            onMessageClient={sendMessage}
          />
        </div>

        <div className="listing-status-description">
          <h2>Your listings</h2>
          <div className="listing-buttons">
            <button
              onClick={() => handleListedButtonClick("listed")}
              className={`${listedButtonClicked === "listed" ? "active" : ""}`}
            >
              Listed Properties
            </button>
            <button
              onClick={() => handleListedButtonClick("rejected")}
              className={`${
                listedButtonClicked === "rejected" ? "active" : ""
              }`}
            >
              Pending / Rejected Properties
            </button>
          </div>
          {listedButtonClicked === "listed" ? (
            <ListingsList
              listings={listings}
              listingData={listingData}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              sliderSettings={sliderSettings}
              setPath={setPath}
            />
          ) : (
            <RejectedListing
              rejectedListings={rejectedListings}
              rejectedListingData={rejectedData}
              sliderSettings={sliderSettings}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              setPath={setPath}
            />
          )}
        </div>
      </section>
      {showUpdateModal && (
        <UpdateListingModal
          listing={selectedListing}
          onClose={() => setShowUpdateModal(false)}
          onSubmit={handleUpdateSubmit}
        />
      )}
      <Footer />
    </>
  );
};

export default HostingSetup;
