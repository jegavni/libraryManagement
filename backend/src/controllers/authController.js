import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    }
  );
};

// ============================================
// REGISTER MEMBER
// ============================================

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Name, email and password are required.",
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must be at least 6 characters.",
        },
      });
    }

    // Check duplicate email
    const existingUser = await pool.query(
      `SELECT id
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "An account with this email already exists.",
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // IMPORTANT:
    // Public registration always creates a MEMBER.
    // Users cannot register themselves as librarians.
    const result = await pool.query(
      `INSERT INTO users
        (name, email, password_hash, role)
       VALUES
        ($1, $2, $3, 'member')
       RETURNING id, name, email, role, created_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    const token = generateToken(user);

    return res.status(201).json({
      message: "Registration successful.",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================
// LOGIN
// ============================================

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required.",
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT
        id,
        name,
        email,
        password_hash,
        role,
        created_at
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    const token = generateToken(user);

    // Never send password_hash to frontend
    delete user.password_hash;

    return res.status(200).json({
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};