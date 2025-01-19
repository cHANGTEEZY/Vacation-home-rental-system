import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import jwtGenerator from "../utils/jwtGenerator.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password, isAdmin } = req.body;
  if (!email || !password) {
    return res.status(400).json("Please fill all fields");
  }
  try {
    const result = await pool.query(
      "SELECT * FROM user_details WHERE user_email=$1",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json("Your account doesn't exist");
    }
    const user = result.rows[0];
    const checkIfPasswordIsCorrect = await bcrypt.compare(
      password,
      user.user_password
    );
    if (!checkIfPasswordIsCorrect) {
      return res.status(400).json("Your email or password is incorrect");
    }
    if (user.user_role === "admin" && !isAdmin) {
      return res
        .status(403)
        .json("Admins must select the 'Are you an admin?' checkbox");
    }
    if (user.user_role !== "admin" && isAdmin) {
      return res.status(403).json("You are not authorized as an admin");
    }
    const token = jwtGenerator(user.user_id);
    res.status(200).json({
      message: "Logged in",
      token: token,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});

export default router;
