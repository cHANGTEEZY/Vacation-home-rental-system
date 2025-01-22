import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Footer from "../../components/Footer/Footer";
import Header from "../../components/Header/Header";
import Breadcrumb from "../../components/ui/BreadCrumb/BreadCrumb";
import "./Preferences.css";

const Preferences = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [preferences, setPreferences] = useState({
    prefered_property_type: "",
    prefered_property_region: "",
    prefered_price: "",
  });

  const [newPreferences, setNewPreferences] = useState({
    prefered_property_type: "",
    prefered_property_region: "",
    prefered_price: "",
  });

  // Constants
  const MIN_PRICE = 1000;
  const MAX_PRICE = 100000;
  const STEP_PRICE = 1000;

  const propertyTypeOptions = [
    { value: "House", label: "House" },
    { value: "Apartment", label: "Apartment" },
    { value: "Hotel", label: "Hotel" },
    { value: "Tent", label: "Tent" },
    { value: "Cottage", label: "Cottage" },
  ];

  const propertyRegionOptions = [
    { value: "Koshi", label: "Koshi" },
    { value: "Bagmati", label: "Bagmati" },
    { value: "Sudurpaschim", label: "Sudurpaschim" },
    { value: "Lumbini", label: "Lumbini" },
    { value: "Gandaki", label: "Gandaki" },
    { value: "Madhesh", label: "Madhesh" },
    { value: "Karnali", label: "Karnali" },
  ];

  const getPreferences = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3000/user-preferences/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        setPreferences({
          prefered_property_type: "",
          prefered_property_region: "",
          prefered_price: MIN_PRICE.toString(),
        });
        return;
      }

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message);
      }

      const data = await response.json();
      setPreferences({
        prefered_property_type: data.propertyType,
        prefered_property_region: data.propertyRegion,
        prefered_price: data.price || MIN_PRICE.toString(),
      });
    } catch (error) {
      console.error(error);
      toast.error("Error fetching preferences");
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    const updatedPreferences = {
      prefered_property_type:
        newPreferences.prefered_property_type ||
        preferences.prefered_property_type,
      prefered_property_region:
        newPreferences.prefered_property_region ||
        preferences.prefered_property_region,
      prefered_price:
        newPreferences.prefered_price || preferences.prefered_price,
    };

    try {
      let response = await fetch("http://localhost:3000/user-preferences/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedPreferences),
      });

      if (response.status === 404) {
        response = await fetch("http://localhost:3000/user-preferences/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedPreferences),
        });
      }

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message);
      }

      const result = await response.json();
      toast.success(result.message);
      await getPreferences();

      // Reset edit state
      setIsEditing(false);
      setNewPreferences({
        prefered_property_type: "",
        prefered_property_region: "",
        prefered_price: "",
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error saving preferences");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewPreferences({
      prefered_property_type: "",
      prefered_property_region: "",
      prefered_price: "",
    });
  };

  const formatPrice = (price) => {
    return `Rs. ${parseInt(price).toLocaleString()}`;
  };

  useEffect(() => {
    getPreferences();
  }, []);

  const RadioButton = ({ options, groupName, selectedValue, onChange }) => {
    return (
      <div className="radio-grid">
        {options.map((option) => (
          <div
            key={option.value}
            className="radio-option"
            data-value={option.value}
          >
            <input
              type="radio"
              id={`${groupName}-${option.value}`}
              name={groupName}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={() => onChange(option.value)}
            />
            <label htmlFor={`${groupName}-${option.value}`}>
              {option.label}
            </label>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Header showPropertyOptions={false} showSearch={false} />
      <section className="preferences-container">
        <Breadcrumb />
        <div className="preferences-header">
          <h1>User Preferences</h1>
        </div>
        <div className="preferences-component-container">
          <div className="preferences">
            {/* Property Type Section */}
            <div className="preference-item">
              <h3>Preferred Property Type</h3>
              {isEditing ? (
                <RadioButton
                  options={propertyTypeOptions}
                  groupName="propertyType"
                  selectedValue={
                    newPreferences.prefered_property_type ||
                    preferences.prefered_property_type
                  }
                  onChange={(value) =>
                    setNewPreferences((prev) => ({
                      ...prev,
                      prefered_property_type: value,
                    }))
                  }
                />
              ) : (
                <div className="preference-detail">
                  <span>
                    {preferences.prefered_property_type || "Not Provided"}
                  </span>
                </div>
              )}
            </div>

            {/* Property Region Section */}
            <div className="preference-item">
              <h3>Preferred Property Region</h3>
              {isEditing ? (
                <RadioButton
                  options={propertyRegionOptions}
                  groupName="propertyRegion"
                  selectedValue={
                    newPreferences.prefered_property_region ||
                    preferences.prefered_property_region
                  }
                  onChange={(value) =>
                    setNewPreferences((prev) => ({
                      ...prev,
                      prefered_property_region: value,
                    }))
                  }
                />
              ) : (
                <div className="preference-detail">
                  <span>
                    {preferences.prefered_property_region || "Not Provided"}
                  </span>
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="preference-item">
              <h3>Preferred Price</h3>
              {isEditing ? (
                <div className="price-slider-container">
                  <div className="slider-with-value">
                    <input
                      type="range"
                      min={MIN_PRICE}
                      max={MAX_PRICE}
                      step={STEP_PRICE}
                      value={
                        newPreferences.prefered_price ||
                        preferences.prefered_price
                      }
                      onChange={(e) =>
                        setNewPreferences((prev) => ({
                          ...prev,
                          prefered_price: e.target.value,
                        }))
                      }
                      className="price-slider"
                    />
                    <span className="slider-value">
                      {formatPrice(
                        newPreferences.prefered_price ||
                          preferences.prefered_price
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="preference-detail">
                  <span>
                    {preferences.prefered_price
                      ? formatPrice(preferences.prefered_price)
                      : "Not Provided"}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="preference-actions">
              {isEditing ? (
                <>
                  <button className="save-button" onClick={handleSave}>
                    Save Changes
                  </button>
                  <button className="cancel-button" onClick={handleCancel}>
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Preferences
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Preferences;
