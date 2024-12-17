import "./Header.css";
import "./HomeHeader.css";
import ProjectLogo from "../../assets/images/Logo/StayNest.png";
import { CircleUserRound, AlignJustify } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchComponent from "../search/Search";
import PropertyOptions from "../Body/PropertyOptions";
import { toast } from "react-toastify";
import { useContext } from "react";
import AuthenticateContext from "../../context/AuthenticateContext";

export default function HomeHeader() {
  const { isAuthenticated, setIsAuthenticated } =
    useContext(AuthenticateContext);

  const [clicked, setClicked] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 0);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dropDownRef = useRef(null);

  const navigate = useNavigate();

  function handleNavigate(link) {
    navigate(`/${link}`);
  }

  function handleToggle() {
    setClicked((prevVal) => !prevVal);
  }

  function handleClickOutside(event) {
    if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
      setClicked(false);
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const dropdownBottom = isAuthenticated ? "-200%" : "-170%";

  const logoutNavigate = useNavigate();

  const handleLogOut = () => {
    localStorage.removeItem("token");
    logoutNavigate("/login");
    toast.info("Logged out");
    setIsAuthenticated(false);
  };

  return (
    <header className={`${isScrolled ? "scrolled" : ""} `}>
      <div className="home-header-border">
        <div className="home-header-container">
          <div className="logo">
            <img
              src={ProjectLogo}
              alt="Logo of the project"
              onClick={() => handleNavigate("")}
            />
          </div>
          <div className="header-home-config">
            <ul>
              <li>Stays</li>
              <li>Experiences</li>
            </ul>
          </div>
          <div className="nav-account-management home-nav-acc-mag">
            <div className="user-profile-menu" onClick={handleToggle}>
              <AlignJustify className="user-profile-burger-logo" />
              <CircleUserRound className="user-logo" />
              <div
                className={`account-management-dropdown ${
                  clicked ? "visible" : ""
                }`}
                ref={dropDownRef}
                style={{ bottom: dropdownBottom }}
              >
                <div className="account-management-top account-management">
                  {isAuthenticated ? (
                    <>
                      <span
                        className="account-item"
                        onClick={() => handleNavigate("account-settings")}
                      >
                        Account
                      </span>
                      <span
                        className="account-item"
                        onClick={() =>
                          handleNavigate("account-settings/booking")
                        }
                      >
                        Trips
                      </span>
                      <span className="account-item" onClick={handleLogOut}>
                        Logout
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className="account-item"
                        onClick={() => handleNavigate("signup")}
                      >
                        Sign up
                      </span>
                      <span
                        className="account-item"
                        onClick={() => handleNavigate("login")}
                      >
                        Log in
                      </span>
                    </>
                  )}
                </div>

                <div className="account-management-bottom account-management">
                  <span
                    className="account-item"
                    onClick={() => handleNavigate("account-settings/wishlists")}
                  >
                    Wishlists
                  </span>
                  <span
                    className="account-item"
                    onClick={() => handleNavigate("account-settings/nestify")}
                  >
                    Nest your home
                  </span>
                  <span
                    className="account-item"
                    onClick={() => handleNavigate("account-settings/messages")}
                  >
                    Notifications
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="header-hero">
          <h1 className="hero-text deepshadow">
            Experience Best Nepal <br /> Has To Offer
          </h1>
          <div>
            <SearchComponent />
          </div>
        </div>
      </div>

      <div className="variety-icons">
        <PropertyOptions />
      </div>
    </header>
  );
}
