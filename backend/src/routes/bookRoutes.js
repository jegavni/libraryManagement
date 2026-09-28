import express from "express";

import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController.js";

import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

// Members + librarians
router.get("/", authenticate, getBooks);
router.get("/:id", authenticate, getBookById);

// Librarian only
router.post(
  "/",
  authenticate,
  authorize("librarian"),
  createBook
);

router.put(
  "/:id",
  authenticate,
  authorize("librarian"),
  updateBook
);

router.delete(
  "/:id",
  authenticate,
  authorize("librarian"),
  deleteBook
);

export default router;