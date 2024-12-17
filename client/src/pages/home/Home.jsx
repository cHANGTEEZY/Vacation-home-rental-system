import "./Home.css";

import HomeHeader from "../../components/Header/HomeHeader";
import PropertyCard from "../../components/Body/PropertyCard";
import FeaturedProperty from "../../components/Body/FeaturedProperty";
import Footer from "../../components/Footer/Footer";
import Header from "../../components/Header/Header";

const Home = () => {
  return (
    <>
      <HomeHeader />
      {/* <Header /> */}
      <main>
        <div className="home">
          <div className="trending-property"></div>

          <div className="property-cards">
            <PropertyCard />
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
