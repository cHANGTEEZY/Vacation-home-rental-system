import express from "express";
import { pool } from "../db.js";
import { sendOtpEmail } from "../services/mailTrap.js"; // Import the function to send OTP
import crypto from "crypto"; // To generate a random OTP
import bcrypt from "bcrypt"; // To hash the new password
import otpStore from "../services/otpStore.js";

const router = express.Router();

// Generate a 6-digit OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

router.post("/", async (req, res) => {
  const { email } = req.body;

  const query = "SELECT user_email FROM user_details WHERE user_email=$1";
  const executeQuery = await pool.query(query, [email]);

  if (executeQuery.rows.length === 0) {
    return res.status(404).json({ message: "Given email does not exist" });
  }

  // Generate OTP and send it via Mailtrap
  const otp = generateOtp();
  console.log("your otp is ", otp);
  otpStore.set(email, otp, "EX", 300); // Expiry time 5 minutes

  sendOtpEmail(email, otp);

  return res.status(200).json({ message: "OTP has been sent to your email" });
});

router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Check if the OTP is valid and not expired
  const storedOtp = otpStore.get(email);
  if (!storedOtp || storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the password in the database
  await pool.query(
    "UPDATE user_details SET user_password = $1 WHERE user_email = $2",
    [hashedPassword, email]
  );

  // Delete OTP from the store after successful reset
  otpStore.delete(email);

  res.status(200).json({ message: "Password reset successfully" });
});

export default router;
