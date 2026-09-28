import express from "express";
import {
  borrowBook,
  getMyLoans,
  getAllLoans,
  returnBook,
} from "../controllers/loanController.js";
import {authenticate} from "../middleware/auth.js";
import {authorize} from "../middleware/authorize.js";

const router = express.Router();

// Member routes
router.post("/", authenticate, authorize("member"), borrowBook);
router.get("/my", authenticate, authorize("member"), getMyLoans);

// Librarian routes
router.get("/", authenticate, authorize("librarian"), getAllLoans);
router.post("/:id/return", authenticate, authorize("librarian"), returnBook);

export default router;