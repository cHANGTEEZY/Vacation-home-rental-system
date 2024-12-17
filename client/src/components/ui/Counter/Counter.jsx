import { useState } from "react";
import "./Counter.css";
import { Plus, Minus } from "lucide-react";

export default function Counter({
  counter, // current counter for this guest type
  counterRange = 10, // limit for this specific guest type
  setCounter, // function to update the count for this guest type
  totalGuestCount, // current total guest count
  maxGuestsAllowed, // maximum allowed guests overall
}) {
  const isDecrementDisabled = counter === 0;
  const isIncrementDisabled =
    counter >= counterRange || totalGuestCount >= maxGuestsAllowed;

  function counterDecrement() {
    if (counter > 0) {
      setCounter(counter - 1); // Decrease individual count
    }
  }

  function counterIncrement() {
    if (counter < counterRange && totalGuestCount < maxGuestsAllowed) {
      setCounter(counter + 1); // Increase individual count
    }
  }

  return (
    <div className="counter-container">
      <button
        className={`decrementor counter-button ${
          isDecrementDisabled ? "disabled" : ""
        }`}
        onClick={counterDecrement}
        disabled={isDecrementDisabled}
      >
        <Minus />
      </button>
      <span className="counter">{counter}</span>
      <button
        className={`incrementor counter-button ${
          isIncrementDisabled ? "disabled" : ""
        }`}
        onClick={counterIncrement}
        disabled={isIncrementDisabled}
      >
        <Plus />
      </button>
    </div>
  );
}
