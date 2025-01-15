import "./PropertyRecommendations.css"; // Add CSS for this component
import Carousel from "../ui/Carousel/Carousel";
import { CircleChevronRight, CircleChevronLeft, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const PropertyRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const redirect = useNavigate();

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    draggable: false,
  };
  
  useEffect(()=>{
    const token =localStorage.getItem("token");
    if(token){
      setIsLoggedIn(true);
    }
  },[]);

  const fetchPreferences = async () => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch("http://localhost:3000/user-preferences/", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 404) {
            toast.error("Please set your preferences before requesting recommendations.");
            setPreferences(null);
            setLoading(false);
            return;
        }

        if (!response.ok) {
            const errorResult = await response.json();
            toast.error(errorResult.message);
            setPreferences(null);
            setLoading(false);
            return;
        }
        const data = await response.json();

        console.log("Preference data",data);
        setPreferences(data);

    } catch (error) {
        console.error(error.message);
        toast.error("Error fetching preferences.");
    }
    setLoading(false);
};


  const fetchRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:3000/recommendedProperties/recommendations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendedProperties || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(isLoggedIn){
      fetchPreferences();
    }
  }, [isLoggedIn]);


  useEffect(() => {
    console.log("Preferences updated",preferences);
    if (preferences && isLoggedIn) 
      fetchRecommendations();
    if (!isLoggedIn) {
      setLoading(false);
    }
  }, [preferences,isLoggedIn]);


  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
    }).format(price);
  };

  const handleCardClick = (e, propertyId) => {
    e.preventDefault();
    if (e.target.closest(".navigate-button")) {
      return;
    }
    if (!isLoggedIn) {
      redirect("/login");
    } else {
      window.open(`/property/${propertyId}`, "_blank");
    }
  }; 

  if (!isLoggedIn) {
    return (
      <div className="login-prompt">
        Please <a className="update-preference" href="/login">login</a> to view personalized property recommendations.
      </div>
    );
  }
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    toast.error("Failed to fetch recommendations. Please try again later.");
    return <div>Error: {error}</div>;
  }
  if (!preferences) {
    return (
        <div>
            Please set your preferences for personalized recommendations.{" "}
            <a className="update-preference" href="/account-settings/preferences">Update Preferences</a>
        </div>
    );
  }

  // if (loading) {
  //   return <div>loading...</div>
    
  // }

  // if (error) {
  //   return <div>Error: {error}</div>
  // }

  return (
    <section className="recommendations-section">
    {recommendations.length > 0 ? (
      <>
        <div className="recommendations-grid">
          {recommendations.map((property) => (
            <div
              key={property.property_id}
              className="card"
              onClick={(e) => handleCardClick(e, property.property_id)}
            >
              <Heart className="favourite-button card-button" />
              <Carousel
                settings={settings}
                customArrows={{
                  left: (
                    <CircleChevronLeft className="navigate-button left-arrow card-button" />
                  ),
                  right: (
                    <CircleChevronRight className="navigate-button right-arrow card-button" />
                  ),
                }}
              >
                {property.image_urls?.map((image, index) => (
                  <div key={index} className="image-div">
                    <img
                      src={image || "/api/placeholder/400/300"}
                      alt={`Property ${index}`}
                      loading="lazy"
                    />
                  </div>
                ))}
              </Carousel>
              <div className="card-details">
                <h2>{property.title}</h2>
                <p>{property.approximateLocation}</p>
                <p>{property.description}</p> 
                <span> 
                  <strong>{formatPrice(property.price)}</strong> per night
                </span>
              </div>
            </div>
          ))}
        </div>
      </>
    ) : (
      <div className="recommendations-error">
        No recommended properties available at the moment.
      </div>
    )}
  </section>
  );
};

export default PropertyRecommendations;