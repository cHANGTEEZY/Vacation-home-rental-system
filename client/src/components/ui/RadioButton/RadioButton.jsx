import React, { useState } from "react";
import "./RadioButton.css";

export default function RadioButton({ options, groupName, selectedValue, onChange }) {
    return (
        <div className="radioGroup">
            {options.map((option) => (
                <div className="radioButton" key={option.value}>
                    <input
                        type="radio"
                        id={`${groupName}-${option.value}`}
                        name={groupName}
                        value={option.value}
                        checked={selectedValue === option.value}
                        onChange={() => onChange(option.value)}
                    />
                    <label htmlFor={`${groupName}-${option.value}`} className="radioLabel">
                        {option.label}
                    </label>
                </div>
            ))}
        </div>
    );
}
