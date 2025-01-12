import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./Authenticate.css";

const OTP = () => {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Get the email passed from ForgotPassword component
  const email = location.state?.email;

  if (!email) {
    toast.error("Invalid access. Please try again.");
    navigate("/forgot-password");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch(
      "http://localhost:3000/auth/forgot-password/reset-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, newPassword }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      toast.success(data.message);
      navigate("/login");
    } else {
      toast.error(data.message);
    }
  };

  return (
    <div className="signup-container">
      <h2>Verify OTP and Reset Password</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group form-padding">
          <label htmlFor="otp">Enter OTP:</label>
          <input
            type="text"
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </div>

        <div className="form-group form-padding">
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default OTP;
