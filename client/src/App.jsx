import "./styles.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthenticateProvider } from "./context/AuthenticateContext";

import Home from "./pages/home/Home";
import Login from "./pages/authentication/Login";
import SignUp from "./pages/authentication/Signup";
import Account from "./pages/userAccount/Account";
import Booking from "./pages/userAccount/Booking";
import Wishlists from "./pages/userAccount/Wishlists";
import Hosting from "./pages/userAccount/Hosting";
import Messages from "./pages/userAccount/Messages";
import PersonalInfo from "./pages/userAccount/PersonalInfo";
import LoginAndSecurity from "./pages/userAccount/LoginAndSecurity";
import PropertyDetails from "./pages/RealEstateDetail/PropertyDetails";
import PropertyBooking from "./pages/propertyBooking/PropertyBooking";
import HostingSetup from "./pages/Hosting/HostingSetup";
import Listing from "./pages/Hosting/Listing";
import PropertyPayment from "./pages/Payment/PropertyPayment";
import GetRouteToDestination from "./components/Map/GetRouteToDestination";
import Review from "./pages/Review/Review";
import Message from "./pages/Messaging/Message";

export default function App() {
  return (
    <AuthenticateProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/property-detail" element={<PropertyDetails />} />
          <Route path="/account-settings" element={<Account />} />
          <Route
            path="/account-settings/personal-info"
            element={<PersonalInfo />}
          />
          <Route
            path="/account-settings/login-and-security"
            element={<LoginAndSecurity />}
          />
          <Route path="/account-settings/messages" element={<Messages />} />
          <Route path="/account-settings/booking" element={<Booking />} />
          <Route path="/account-settings/nestify" element={<Hosting />} />
          <Route path="/account-settings/wishlists" element={<Wishlists />} />

          <Route
            path="/account-settings/nestify/listings"
            element={<HostingSetup />}
          />
          <Route path="/become-a-host" element={<Listing />} />
          <Route
            path="/property/:id"
            target="_blank"
            element={<PropertyBooking />}
          />
          <Route path="/property/booking/:id" element={<PropertyPayment />} />
          <Route path="/property-review/:propertyId" element={<Review />} />
          <Route
            path="/property/path-to-location/:id"
            element={<GetRouteToDestination />}
          />
          <Route path="/chat-with-host/:id" element={<Message />} />
        </Routes>
      </Router>
    </AuthenticateProvider>
  );
}
