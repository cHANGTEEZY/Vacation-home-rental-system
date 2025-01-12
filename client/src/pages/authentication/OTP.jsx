import "./Authenticate.css";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import logo from "../../assets/images/Logo/n.png";
import formImage from "../../assets/images/Form/form.jpg";

import { Link } from "react-router-dom";

import { ArrowLeft } from "lucide-react";

export default function EnterOTP() {
  function getOtp() {
    alert("Otp is 123");
  }

  return (
    <div className="signup-container">
      <Header showPropertyOptions={false} showSearch={false} />
      <div className="signup-content">
        <div className="form-wrapper">
          <form className="form">
            <div>
              <div className="form-logo">
                <img src={logo} />
              </div>
              <div className="form-header">
                <h1>Welcome Back</h1>
                <span> Please sign in to your account</span>
              </div>
              <div className="form-group form-padding">
                <label htmlFor="email">Email:</label>
                <input type="email" name="email" required />
              </div>

              <div className="form-footer form-padding">
                <button
                  type="submit"
                  className="submit-button"
                  onClick={() => getOtp()}
                >
                  Submit
                </button>
                <span className="form-footer-span">
                  <ArrowLeft />
                  <Link to={"/login"}>Back to Login</Link>
                </span>
              </div>
            </div>
          </form>
          <div className="form-side">
            <img src={formImage} alt="form-image" />
          </div>
        </div>
      </div>
      <div className="footer-position">
        <Footer />
      </div>
    </div>
  );
}
