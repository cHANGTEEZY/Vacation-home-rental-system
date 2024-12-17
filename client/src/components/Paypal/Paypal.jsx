import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

function Paypal({ amount, propertyId, onPaymentSuccess }) {
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState(null);

  const createOrder = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/paypal/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cart: { amount, propertyId } }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create order: ${errorData.details}`);
      }

      const orderData = await response.json();
      console.log("Order created successfully. Order ID:", orderData.id);
      return orderData.id;
    } catch (error) {
      console.error("Order creation error:", error);
      setError(error.message);
      throw error;
    }
  };

  const handleApprove = async (data, actions) => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/paypal/capture-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderID: data.orderID }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to capture payment: ${errorData.details}`);
      }

      const captureData = await response.json();
      console.log("Payment captured successfully:", captureData);
      setPaid(true);

      onPaymentSuccess(); //calling the callback function to set the isPaid State in parent component

      console.log("Transaction completed by:", data.payer.name.given_name);
    } catch (error) {
      console.error("Payment capture error:", error);
      setError(error.message);
    }
  };

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  if (!clientId) {
    return <div>Error: PayPal Client ID is not set</div>;
  }

  return (
    <PayPalScriptProvider options={{ "client-id": clientId }}>
      {!paid ? (
        <PayPalButtons
          createOrder={createOrder}
          onApprove={handleApprove}
          onError={(err) => {
            console.error("PayPal Buttons Error:", err);
            setError(`PayPal Buttons Error: ${err.message}`);
          }}
        />
      ) : (
        <div>Payment successful for property ID: {propertyId}</div>
      )}
    </PayPalScriptProvider>
  );
}

export default Paypal;
