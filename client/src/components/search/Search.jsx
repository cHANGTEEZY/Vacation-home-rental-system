import "./Search.css";
import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import DateRangePickerComp from "../ui/Calendar/DateRangePickerComp";
import format from "date-fns/format";
import { addDays } from "date-fns";
import MapCompo from "../../components/ui/Map/Map";
import AddGuest from "../ui/Guest/AddGuest";
import { toast } from "react-toastify";

import { useFilteredData } from "../../context/FilteredDataContext";

export default function SearchComponent() {
  const { setFilteredData, setSearchState } = useFilteredData();

  const [locationName, setLocationName] = useState("");
  const [clicked, setClicked] = useState(null);
  const [totalGuest, setTotalGuest] = useState(0);
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      key: "selection",
    },
  ]);

  const searchBarRef = useRef(null);
  const addGuestRef = useRef(null);

  const handleClick = (clickedDiv) => {
    setClicked(clicked === clickedDiv ? null : clickedDiv);
  };

  const handleClose = () => {
    setClicked(null);
  };

  const handleClickOutside = (event) => {
    if (
      searchBarRef.current &&
      !searchBarRef.current.contains(event.target) &&
      addGuestRef.current &&
      !addGuestRef.current.contains(event.target)
    ) {
      setClicked(null);
    }
  };

  const searchContainerClicked = () => {
    window.scrollY(50);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const search = async () => {
    const formData = {
      startDate: range[0].startDate,
      endDate: range[0].endDate,
      regionName: locationName,
      totalGuest,
    };

    console.log(formData);
    if (formData.regionName === "") {
      return alert("Select a region");
    }
    try {
      const response = await fetch("http://localhost:3000/filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
      }

      setFilteredData(data.properties);
      setSearchState(true);
    } catch (error) {
      throw new Error("Something went wrong", error);
    }
  };

  return (
    <div className="search-position">
      <div
        className="search-container"
        onClick={() => searchContainerClicked()}
        id="search-container"
      >
        <a href="#search-bar" className="search-bar-navigate">
          <div
            ref={searchBarRef}
            className={`search-bar ${clicked ? "clicked" : ""}`}
            id="search-bar"
          >
            <div
              className={`destination-div search-bar-div ${
                clicked === "destination" ? "clicked" : ""
              }`}
              onClick={() => handleClick("destination")}
            >
              <span className="search-title">Where</span>
              <span className="search-span destination-span">
                {locationName ? locationName : "Search destination"}
              </span>
              {clicked === "destination" ? (
                <div className="map-comp-div">
                  <MapCompo setLocationName={setLocationName} />
                </div>
              ) : null}
            </div>

            {/* Date Selection */}
            <div className="book-date-div">
              <div
                className={`checkin-div date-div ${
                  clicked === "checkin" ? "clicked" : ""
                }`}
                onClick={() => handleClick("checkin")}
              >
                <span className="search-title">Check in</span>
                <span className="search-span checkin-date-span">
                  {format(range[0].startDate, "MM/dd/yyyy")}
                </span>
              </div>
              <div
                className={`checkout-div date-div ${
                  clicked === "checkout" ? "clicked" : ""
                }`}
                onClick={() => handleClick("checkout")}
              >
                <span className="search-title">Check out</span>
                <span className="search-span checkout-date-span">
                  {format(range[0].endDate, "MM/dd/yyyy")}
                </span>
              </div>
              {clicked === "checkin" || clicked === "checkout" ? (
                <div className="date-picker">
                  <DateRangePickerComp
                    range={range}
                    setRange={setRange}
                    onClose={handleClose}
                    disablePreviousDates={true}
                  />
                </div>
              ) : null}
            </div>

            {/* Guest Selection and Search */}
            <div
              className={`search-div search-bar-div ${
                clicked === "search-outer-div" ? "clicked" : ""
              }`}
            >
              <div
                className={`search-outer-div`}
                onClick={() => handleClick("search-outer-div")}
              >
                <div className="search-inner-div">
                  <span className="search-title">Who</span>
                  {/* Updated logic to display total guests */}
                  <span className="search-span add-guest-span">
                    {totalGuest === 0
                      ? "Add guest"
                      : `${totalGuest} guest${totalGuest > 1 ? "s" : ""}`}
                  </span>
                </div>
                <div className={`search-area ${clicked ? "expanded" : ""}`}>
                  <Search className="search-icon" />
                  <span
                    className={`search-text ${clicked ? "clicked" : ""}`}
                    onClick={search}
                  >
                    Search
                  </span>
                </div>
              </div>

              {/* Add Guest Component */}
              {clicked === "search-outer-div" ? (
                <div
                  className={`add-guest-div ${
                    clicked === "search-outer-div" ? "clicked" : ""
                  }`}
                  ref={addGuestRef}
                >
                  <AddGuest setTotalGuest={setTotalGuest} />
                </div>
              ) : null}
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
