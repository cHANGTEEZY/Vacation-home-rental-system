import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./DateRangePicker.css";

const DateRangePickerComp = ({
  range,
  setRange,
  onClose,
  bookedDates = [],
  disablePreviousDates = false,
}) => {
  const refOne = useRef(null);

  // Memoize the disabled dates logic
  const disabledDates = useMemo(() => {
    if (!disablePreviousDates) return bookedDates;

    const pastDates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to midnight for accurate comparison

    for (let year = 2023; year <= today.getFullYear(); year++) {
      const endMonth = year === today.getFullYear() ? today.getMonth() : 11;

      for (let month = 0; month <= endMonth; month++) {
        const lastDay =
          year === today.getFullYear() && month === today.getMonth()
            ? today.getDate() - 1
            : new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= lastDay; day++) {
          pastDates.push(new Date(year, month, day));
        }
      }
    }

    return [...pastDates, ...bookedDates];
  }, [bookedDates, disablePreviousDates]);

  // Event handler to close on Escape key press
  const hideOnEscape = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Event handler to close on outside click
  const hideOnClickOutside = useCallback(
    (e) => {
      if (refOne.current && !refOne.current.contains(e.target)) {
        onClose();
      }
    },
    [onClose]
  );

  // Attach event listeners
  useEffect(() => {
    document.addEventListener("keydown", hideOnEscape, true);
    document.addEventListener("mousedown", hideOnClickOutside, true);

    return () => {
      document.removeEventListener("keydown", hideOnEscape, true);
      document.removeEventListener("mousedown", hideOnClickOutside, true);
    };
  }, [hideOnEscape, hideOnClickOutside]);

  return (
    <div ref={refOne} className="calendarWrap" style={{ width: "52rem" }}>
      <DateRangePicker
        onChange={(item) => setRange([item.selection])}
        editableDateInputs={true}
        moveRangeOnFirstSelection={false}
        ranges={range}
        months={2}
        direction="horizontal"
        className="calendarElement"
        staticRanges={[]}
        inputRanges={[]}
        disabledDates={disabledDates}
      />
    </div>
  );
};

export default React.memo(DateRangePickerComp);
