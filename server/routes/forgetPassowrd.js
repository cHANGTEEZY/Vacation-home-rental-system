import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email } = req.body;

  const query = "SELECT user_email from user_details WHERE user_email=$1";
  const executeQuery = await pool.query(query, [email]);
  if (executeQuery.rows.length === 0) {
    return res.status(404).json({ message: "Given email does not exist" });
  }
});

export default router;
