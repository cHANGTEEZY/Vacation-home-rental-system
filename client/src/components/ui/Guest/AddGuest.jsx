import { useState } from "react";
import { addGuest } from "../../../data/addGuest";
import Counter from "../Counter/Counter";
import "./AddGuest.css";

export default function AddGuest({ maxGuestsAllowed = 30, setTotalGuest }) {
  const [guestCounts, setGuestCounts] = useState(
    addGuest.map(() => 0) // Initialize counters for each guest type
  );

  // Function to update individual guest type counts
  const updateGuestCount = (index, newCount) => {
    const updatedGuestCounts = [...guestCounts];
    updatedGuestCounts[index] = newCount;

    // Update state and total guest count
    setGuestCounts(updatedGuestCounts);
    const totalGuests = updatedGuestCounts.reduce(
      (sum, count) => sum + count,
      0
    );
    setTotalGuest(totalGuests); // Update total guest count in the parent
  };

  return (
    <div className="add-guest-container">
      {addGuest.map((guest, index) => (
        <div key={index} className="add-guest-item">
          <div className="guest-div">
            <span className="guest-title">{guest.title}</span>
            <span className="guest-age-range">{guest.ageRange}</span>
          </div>
          <div className="guest-counter">
            <Counter
              counter={guestCounts[index]}
              counterRange={guest.guestQuantity || maxGuestsAllowed}
              setCounter={(newCount) => updateGuestCount(index, newCount)}
              totalGuestCount={guestCounts.reduce(
                (sum, count) => sum + count,
                0
              )}
              maxGuestsAllowed={maxGuestsAllowed}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
