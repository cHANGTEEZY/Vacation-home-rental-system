// routes/paymentPaypal.js
import express from "express";
import { createOrder, captureOrder } from "../services/paypalService.js";

const router = express.Router();

// Route to create an order
router.post("/create-order", async (req, res) => {
  const { cart } = req.body; // cart should include amount and propertyId
  try {
    const orderResponse = await createOrder(cart);
    res.status(200).json(orderResponse.jsonResponse);
  } catch (error) {
    console.error("Error creating order:", error.message);
    res
      .status(500)
      .json({ error: "Failed to create order", details: error.message });
  }
});

// Route to capture an order
router.post("/capture-order", async (req, res) => {
  const { orderID } = req.body;
  if (!orderID) {
    return res.status(400).json({ error: "Order ID is required" });
  }
  try {
    const captureResponse = await captureOrder(orderID);
    res.status(200).json(captureResponse.jsonResponse);
  } catch (error) {
    console.error("Error capturing order:", error.message);
    res
      .status(500)
      .json({ error: "Failed to capture payment", details: error.message });
  }
});

export default router;
