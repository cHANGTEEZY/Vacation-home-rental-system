import "./Header.css";
import ProjectLogo from "../../assets/images/Logo/StayNest.png";
import { CircleUserRound, AlignJustify, Home } from "lucide-react";
import { useState, useRef, useEffect, useContext } from "react";
import SearchComponent from "../search/Search";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import AuthenticateContext from "../../context/AuthenticateContext";

export default function Header({
  showSearch = true,
  showNavAccountManagement = true,
  showSetupButton = false,
}) {
  const { isAuthenticated, setIsAuthenticated } =
    useContext(AuthenticateContext);

  const [clicked, setClicked] = useState(false);
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
    <header>
      <div className="header-border">
        <div className="header-container">
          <div className="logo">
            <img
              src={ProjectLogo}
              alt="Logo of the project"
              onClick={() => handleNavigate("")}
            />
          </div>
          {showSearch && <SearchComponent />}
          {showNavAccountManagement && (
            <div className="nav-account-management">
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
                      onClick={() =>
                        handleNavigate("account-settings/wishlists")
                      }
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
                      onClick={() =>
                        handleNavigate("account-settings/Visited-properties")
                      }
                    >
                      Review
                    </span>
                    <span
                      className="account-item"
                      onClick={() =>
                        handleNavigate("account-settings/messages")
                      }
                    >
                      Notifications
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showSetupButton && (
            <div className="nav-setup-button">
              <p>Ready to Nestify it?</p>
              <Link
                to="/account-settings/nestify/listings"
                style={{ textDecoration: "none" }}
              >
                <span className="setup-button-span">
                  <Home strokeWidth="1.5" size={38} />
                  <p>Nestify Setup</p>
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
