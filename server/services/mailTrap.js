import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const user = process.env.MAIL_TRAP_USER;
const pass = process.env.MAIL_TRAP_PASS;

if (!user || !pass) {
  console.error(" Mailtrap credentials are missing. Check your .env file.");
}

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  auth: {
    user,
    pass,
  },
});

export const sendOtpEmail = (email, otp) => {
  const mailOptions = {
    from: "no-reply@yourapp.com",
    to: email,
    subject: "Your OTP for Password Reset",
    text: `Your OTP for password reset is: ${otp}`,
  };

  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending OTP email:", error);
    } else {
      console.log(` OTP email sent to ${email}:`, info.response);
    }
  });
};
