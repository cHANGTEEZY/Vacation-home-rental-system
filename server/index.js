import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import register from "./routes/register.js";
import login from "./routes/login.js";
import userAcount from "./routes/userService.js";
import userAccountUpdate from "./routes/userAccountUpdate.js";
import userPasswordUpdate from "./routes/userPasswordUpdate.js";
import createListing from "./routes/createListing.js";
import getPropertyListings from "./routes/getPropertyListings.js";
import userPreferences from "./routes/userPreferences.js";
import paypalRoutes from "./routes/paymentPaypal.js";
import handleBooking from "./routes/bookProperty.js";
import getBookingDetails from "./routes/bookProperty.js";
import getBookedDates from "./routes/getBookingDates.js";
import reviewProperty from "./routes/reviewProperty.js";
import messageHost from "./routes/messageHost.js";
import wishlist from "./routes/wishList.js";
import visitedProperties from "./routes/visitedProperties.js";
import filter from "./routes/filter.js";
import forgotPassword from "./routes/forgetPassowrd.js";
import userRecommendations from "./routes/Recommendation.js";

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use("/auth/register", register);
app.use("/auth/login", login);
app.use("/auth/forgot-password", forgotPassword);
app.use("/account", userAcount);
app.use("/account/update", userAccountUpdate);
app.use("/account/update/password", userPasswordUpdate);
app.use("/become-a-host/listing", createListing);
app.use("/get-property-listings", getPropertyListings);
app.use("/api/paypal", paypalRoutes);
app.use("/handle-booking", handleBooking);
app.use("/get-booking-details", getBookingDetails);
app.use("/get-property-booked-date", getBookedDates);
app.use("/review-property", reviewProperty);
app.use("/message-host", messageHost);
app.use("/wishlist", wishlist);
app.use("/visited-properties", visitedProperties);
app.use("/filter", filter);
app.use("/user-preferences", userPreferences);
app.use('/recommendedProperties', userRecommendations);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
