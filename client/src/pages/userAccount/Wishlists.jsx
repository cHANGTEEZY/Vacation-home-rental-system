import "./Wishlists.css";

import Breadcrumb from "../../components/ui/BreadCrumb/BreadCrumb";
import Header from "../../components/Header/Header";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Trash } from "lucide-react";

export default function Wishlists() {
  const [wishlistProperties, setWishlistProperties] = useState([]);
  const redirect = useNavigate();

  const getWishLists = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      redirect("/");
      toast.error("Unauthorized");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/wishlist", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        return toast.error(data.message);
      }
      setWishlistProperties(data.data);
    } catch (error) {
      throw new Error(error.message || "Something went wrong");
    }
  };

  const deleteWishList = async (propertyId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      redirect("/");
      toast.error("Unauthorized");
      return;
    }
    const confirmDelete = confirm(
      `Do you want to remove this ${propertyId} from wishlist`
    );
    if (!confirmDelete) {
      console.log("Cancelled");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/wishlist/${propertyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
      }
      toast.success(data.message);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      throw new Error(error.message || "Something went wrong");
    }
  };

  useEffect(() => {
    getWishLists();
  }, []);

  return (
    <>
      <Header showPropertyOptions={false} showSearch={false} />
      <section className="wishlists-container">
        <Breadcrumb />

        <div className="wishlists-grid">
          {wishlistProperties.map((property) => (
            <div key={property.property_id} className="wishlist-item">
              <div className="wishlist-description-header">
                <h1 className="wishlist-property-title">{property.title}</h1>
                <button onClick={() => deleteWishList(property.property_id)}>
                  <Trash color="red" />
                </button>
              </div>
              <div className="wishlist-grid">
                {property.images.map((image, index) => {
                  return (
                    <div className="property-image-div-grid-item" key={index}>
                      <img src={image} alt="" />
                    </div>
                  );
                })}
              </div>
              <div className="wishlist-description">
                <p>
                  Location:{" "}
                  <span>
                    {property.approximate_location ?? "Not specified"}
                  </span>
                </p>
                <p>
                  Region:{" "}
                  <span>{property.property_region ?? "Not specified"}</span>
                </p>
                <p>
                  Bedrooms: <span>{property.bedrooms ?? "Not specified"}</span>
                </p>
                <p>
                  Beds: <span>{property.beds ?? "Not specified"}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
