import "./Home.css";

import HomeHeader from "../../components/Header/HomeHeader";
import PropertyCard from "../../components/Body/PropertyCard";
import FeaturedProperty from "../../components/Body/FeaturedProperty";
import Footer from "../../components/Footer/Footer";
import FilteredProperty from "../../components/Body/FilteredProperty";
import PropertyRecommendations from "../../components/Recommendation/PropertyRecommendations";

const Home = () => {
  return (
    <>
      <HomeHeader />
      <main>
        <div className="home">
          <div className="trending-property">
            <div className="searched-property">
              <FilteredProperty />
            </div>
          </div>

          <div className="listed-properties">
            <h1 className="home-h-one">Listed-Properties</h1>
            <div className="property-cards">
              <PropertyCard />
            </div>
          </div>
          <div className="recommended-properties">
            <h1 className="home-h-one">Recommended-Properties</h1>
            <PropertyRecommendations />
          </div>
          <div className="featured-properties">
            <FeaturedProperty />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Home;
