import "./Authenticate.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import logo from "../../assets/images/Logo/n.png";
import formImage from "../../assets/images/Form/form.jpg";
import { Link, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { ArrowLeft } from "lucide-react";

import { toast } from "react-toastify";

export default function ForgotPassword() {
  const emailRef = useRef();

  const redirect = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = emailRef.current.value;

    const response = await fetch("http://localhost:3000/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (response.ok) {
      redirect("/enter-otp", { state: { email } });
    } else {
      toast.error(data.message);
    }
  };

  return (
    <div className="signup-container">
      <Header showPropertyOptions={false} showSearch={false} />
      <div className="signup-content">
        <div className="form-wrapper">
          <form className="form" onSubmit={handleSubmit}>
            <div>
              <div className="form-logo">
                <img src={logo} alt="Logo" />
              </div>
              <div className="form-header">
                <h1>Welcome</h1>
                <span>Please enter your email.</span>
              </div>
              <div className="form-group form-padding">
                <label htmlFor="email">Email:</label>
                <input type="email" name="email" required ref={emailRef} />
              </div>

              <div className="form-footer form-padding">
                <button type="submit" className="submit-button">
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
