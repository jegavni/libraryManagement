import express from "express";

import {
  getCopiesByBook,
  createCopy,
  updateCopy,
} from "../controllers/copyController.js";

import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

// Librarian only
router.get(
  "/books/:bookId/copies",
  authenticate,
  authorize("librarian"),
  getCopiesByBook
);

router.post(
  "/books/:bookId/copies",
  authenticate,
  authorize("librarian"),
  createCopy
);

router.patch(
  "/copies/:id",
  authenticate,
  authorize("librarian"),
  updateCopy
);

export default router;