import { useEffect, useState } from "react";
import Footer from "../../components/Footer/Footer";
import Header from "../../components/Header/Header";
import Breadcrumb from "../../components/ui/BreadCrumb/BreadCrumb";
import { toast } from "react-toastify";
import RadioButton from "../../components/ui/RadioButton/RadioButton";
import "./Preferences.css";

export default function Preferences() {
  const [editClicked, setEditClicked] = useState({
    property_type: false,
    property_region: false,
    price: false,
  });

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

  // Constants for price slider
  const MIN_PRICE = 1000;
  const MAX_PRICE = 100000;
  const STEP_PRICE = 1000;

  const propertyTypeOptions = [
    { value: "home", label: "Home" },
    { value: "apartment", label: "Apartment" },
    { value: "hotel", label: "Hotel" },
    { value: "tent", label: "Tent" },
    { value: "villa", label: "Villa" },
  ];

  const propertyRegionOptions = [
    { value: "koshi", label: "Koshi" },
    { value: "bagmati", label: "Bagmati" },
    { value: "sudurpaschim", label: "Sudurpaschim" },
    { value: "lumbini", label: "Lumbini" },
    { value: "gandaki", label: "Gandaki" },
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
        toast.error(errorResult.message);
        return;
      }
      const data = await response.json();
      setPreferences({
        prefered_property_type: data.propertyType,
        prefered_property_region: data.propertyRegion,
        prefered_price: data.price || MIN_PRICE.toString(),
      });
    } catch (error) {
      console.error(error.message);
      toast.error("Error fetching preferences.");
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
        toast.error(result.message);
        return;
      }

      const result = await response.json();
      toast.success(result.message);
      await getPreferences();

      setEditClicked({
        property_type: false,
        property_region: false,
        price: false,
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while saving preferences.");
    }
  };

  const handleClick = (field) => {
    setEditClicked((prev) => ({ ...prev, [field]: !prev[field] }));

    // Initialize new preference value when editing starts
    if (field === "price" && !editClicked.price) {
      setNewPreferences((prev) => ({
        ...prev,
        prefered_price: preferences.prefered_price || MIN_PRICE.toString(),
      }));
    }
  };

  const handleCancel = () => {
    setEditClicked({
      property_type: false,
      property_region: false,
      price: false,
    });
    setNewPreferences({
      prefered_property_type: preferences.prefered_property_type,
      prefered_property_region: preferences.prefered_property_region,
      prefered_price: preferences.prefered_price,
    });
  };

  const formatPrice = (price) => {
    return `Rs. ${parseInt(price).toLocaleString()}`;
  };

  useEffect(() => {
    getPreferences();
  }, []);

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
            {editClicked.property_type ? (
              <div>
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
              </div>
            ) : (
              <div className="preference-item">
                <h3>Preferred Property Type</h3>
                <div className="preference-detail">
                  <span>
                    {preferences.prefered_property_type || "Not Provided"}
                  </span>
                  <button
                    className="editChange"
                    onClick={() => handleClick("property_type")}
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}

            {/* Property Region Section */}
            {editClicked.property_region ? (
              <div>
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
              </div>
            ) : (
              <div className="preference-item">
                <h3>Preferred Property Region</h3>
                <div className="preference-detail">
                  <span>
                    {preferences.prefered_property_region || "Not Provided"}
                  </span>
                  <button
                    className="editChange"
                    onClick={() => handleClick("property_region")}
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}

            {/* Price Section with Slider */}
            {editClicked.price ? (
              <div className="preference-item">
                <h3>Preferred Price</h3>
                <div className="preference-detail price-slider-container">
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
                  <button className="cancelChange" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="preference-item">
                <h3>Preferred Price</h3>
                <div className="preference-detail">
                  <span>
                    {preferences.prefered_price
                      ? formatPrice(preferences.prefered_price)
                      : "Not Provided"}
                  </span>
                  <button
                    className="editChange"
                    onClick={() => handleClick("price")}
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
          {(editClicked.property_type ||
            editClicked.property_region ||
            editClicked.price) && (
            <button className="makeChanges" onClick={handleSave}>
              Make Changes
            </button>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
