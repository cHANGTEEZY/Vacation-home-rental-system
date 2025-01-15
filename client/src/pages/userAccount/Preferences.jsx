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

    const propertyTypeOptions = [
        { value: "home", label: "Home" },
        { value: "apartment", label: "Apartment" },
        { value: "hotel", label: "Hotel" },
        { value: "tent", label: "Tent" },
        { value: "cottage", label: "Cottage" },
    ];

    const propertyRegionOptions = [
        { value: "koshi", label: "Koshi" },
        { value: "bagmati", label: "Bagmati" },
        { value: "sudurpaschim", label: "Sudurpaschim" },
        { value: "lumbini", label: "Lumbini" },
        { value: "gandaki", label: "Gandaki" },
        { value: "madhesh", label: "Madhesh" },
        { value: "karnali", label: "Karnali" },

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
                    prefered_price: "",
                });
                return;
            }
            if (!response.ok) {
                const errorResult = await response.json();
                toast.error(errorResult.message);
                return;
            }
            const data = await response.json();
            // Update this part to match the backend response structure
            setPreferences({
                prefered_property_type: data.propertyType,
                prefered_property_region: data.propertyRegion,
                prefered_price: data.price,
            });
            console.log("Fetched preferences:", data);
        } catch (error) {
            console.error(error.message);
            toast.error("Error fetching preferences.");
        }
    };
    const isChanged =
        newPreferences.prefered_property_type !== preferences.prefered_property_type ||
        newPreferences.prefered_property_region !== preferences.prefered_property_region ||
        newPreferences.prefered_price !== preferences.prefered_price;


    const handleSave = async () => {
        const token = localStorage.getItem("token");
        const updatedPreferences = {
            prefered_property_type:
                newPreferences.prefered_property_type || preferences.prefered_property_type,
            prefered_property_region:
                newPreferences.prefered_property_region || preferences.prefered_property_region,
            prefered_price: newPreferences.prefered_price || preferences.prefered_price,
        };

        try {
            // First try to update
            let response = await fetch("http://localhost:3000/user-preferences/", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatedPreferences),
            });

            // If update fails with 404, create new preferences
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

            // After successful save, fetch the latest preferences
            await getPreferences();

            setEditClicked({
                property_type: false,
                property_region: false,
                price: false,
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred while saving preferences.');
        }
    };

    const handleClick = (field) => {
        setEditClicked((prev) => ({ ...prev, [field]: !prev[field] }));
    };
    const handleCancel = () => {
        setEditClicked({
            property_type: false,
            property_region: false,
            price: false,
        });
        // Reset new preferences to current preferences
        setNewPreferences({
            prefered_property_type: preferences.prefered_property_type,
            prefered_property_region: preferences.prefered_property_region,
            prefered_price: preferences.prefered_price,
        });
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
                        {editClicked.property_type ? (
                            <div>
                                <RadioButton
                                    options={propertyTypeOptions}
                                    groupName="propertyType"
                                    selectedValue={
                                        newPreferences.prefered_property_type || preferences.prefered_property_type
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
                                    <span>{preferences.prefered_property_type || "Not Provided"}</span>
                                    <button className="editChange" onClick={() => handleClick("property_type")}>Edit</button>
                                </div>
                            </div>
                        )}
                        {editClicked.property_region ? (
                            <div>
                                <RadioButton
                                    options={propertyRegionOptions}
                                    groupName="propertyRegion"
                                    selectedValue={
                                        newPreferences.prefered_property_region || preferences.prefered_property_region
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
                                    <span>{preferences.prefered_property_region || "Not Provided"}</span>
                                    <button className="editChange" onClick={() => handleClick("property_region")}>Edit</button>
                                </div>
                            </div>
                        )}
                        {editClicked.price ? (
                            <div className="preference-item">
                                <h3>Preferred Price</h3>
                                <div className="preference-detail">
                                    <input
                                        type="number"
                                        value={newPreferences.prefered_price || preferences.prefered_price}
                                        onChange={(e) =>
                                            setNewPreferences((prev) => ({
                                                ...prev,
                                                prefered_price: e.target.value,
                                            }))
                                        }
                                    />
                                    <button className="cancelChange" onClick={handleCancel}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="preference-item">
                                <h3>Preferred Price</h3>
                                <div className="preference-detail">
                                    <span>
                                        {preferences.prefered_price
                                            ? `Rs. ${preferences.prefered_price}` :
                                            "Not Provided"
                                        }</span>
                                    <button className="editChange" onClick={() => handleClick("price")}>Edit</button>
                                </div>
                            </div>
                        )}
                    </div>
                    {(editClicked.property_type || editClicked.property_region || editClicked.price) && (
                        <button className="makeChanges" onClick={handleSave} disabled={!isChanged}>
                            Make Changes
                        </button>
                    )}
                </div>
            </section>
            <Footer />
        </>
    )
};