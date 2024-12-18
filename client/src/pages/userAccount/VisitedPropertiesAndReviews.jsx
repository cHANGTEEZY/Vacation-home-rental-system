import "./VisitedPropertiesAndReviews.css";
import Header from "../../components/Header/Header";
import Breadcrumb from "../../components/ui/BreadCrumb/BreadCrumb";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function VisitedPropertiesAndReviews() {
  const [visitedProperties, setVisitedProperties] = useState([]);
  console.log(visitedProperties);
  const navigate = useNavigate();

  useEffect(() => {
    async function getVisitedProperties() {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized");
        navigate("/");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3000/visited-properties",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Failed to fetch visited properties.");
          return;
        }

        setVisitedProperties(data.data || []); // Default to empty array if no data
      } catch (error) {
        console.error("Error fetching visited properties:", error);
        toast.error("An error occurred while fetching visited properties.");
      }
    }

    getVisitedProperties();
  }, [navigate]);

  return (
    <>
      <Header showPropertyOptions={false} showSearch={false} />
      <section className="visited-properties-section">
        <Breadcrumb />
        <div className="visited-properties-div">
          <div className="visited-grid">
            {/* Check if visitedProperties exists and is an array */}
            {Array.isArray(visitedProperties) &&
            visitedProperties.length > 0 ? (
              visitedProperties.map((property) => (
                <div key={property.id} className="visited-item">
                  <div className="visited-description-header">
                    <h1 className="visited-property-title">{property.title}</h1>
                  </div>
                  <div className="visited-grid">
                    {property.images.map((image, index) => (
                      <div className="property-image-div-grid-item" key={index}>
                        <img src={image} alt={`Property image ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                  <div className="visited-bottom">
                    <div className="visited-description">
                      <p>
                        Location:{" "}
                        <span>
                          {property.approximate_location ?? "Not specified"}
                        </span>
                      </p>
                      <p>
                        Region:{" "}
                        <span>
                          {property.property_region ?? "Not specified"}
                        </span>
                      </p>
                      <p>
                        Bedrooms:{" "}
                        <span>{property.bedrooms ?? "Not specified"}</span>
                      </p>
                      <p>
                        Beds: <span>{property.beds ?? "Not specified"}</span>
                      </p>
                    </div>
                    <Link
                      to={`/property-review/${
                        property.id
                      }?propertyImage=${encodeURIComponent(
                        property.images[0]
                      )}&propertyTitle=${encodeURIComponent(property.title)}`}
                      style={{
                        textDecoration: "none",
                      }}
                    >
                      <button>Give Review</button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p>No visited properties found</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
