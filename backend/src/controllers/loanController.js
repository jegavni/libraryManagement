import pool from "../config/db.js";
import { calculateFine } from "../../services/fineCalculator.js";

export const borrowBook = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { bookId } = req.body;
    const memberId = req.user.id;

    if (!bookId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Book ID is required.",
        },
      });
    }

    await client.query("BEGIN");

    // Lock book row for concurrency
    const book = await client.query(
      `SELECT id, title, isbn
       FROM books
       WHERE id = $1
       FOR UPDATE`,
      [bookId]
    );

    if (book.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: {
          code: "BOOK_NOT_FOUND",
          message: "Book not found.",
        },
      });
    }

    // Maximum 3 active loans
    const active = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM loans
       WHERE member_id = $1
       AND returned_at IS NULL`,
      [memberId]
    );

    if (active.rows[0].count >= 3) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: {
          code: "MAX_ACTIVE_LOANS",
          message: "Maximum 3 active loans allowed.",
        },
      });
    }

    // Overdue loan check
    const overdue = await client.query(
      `SELECT id
       FROM loans
       WHERE member_id = $1
       AND returned_at IS NULL
       AND due_date < CURRENT_DATE
       LIMIT 1`,
      [memberId]
    );

    if (overdue.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: {
          code: "OVERDUE_LOAN",
          message: "You have an overdue loan.",
        },
      });
    }

    // Same book check
    const existing = await client.query(
      `SELECT id
       FROM loans
       WHERE member_id = $1
       AND book_id = $2
       AND returned_at IS NULL
       LIMIT 1`,
      [memberId, bookId]
    );

    if (existing.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: {
          code: "BOOK_ALREADY_BORROWED",
          message: "You already have this book.",
        },
      });
    }

    // Find available good copy
    const copy = await client.query(
      `SELECT id, copy_code
       FROM copies
       WHERE book_id = $1
       AND status = 'available'
       AND condition = 'good'
       ORDER BY id
       LIMIT 1`,
      [bookId]
    );

    if (copy.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: {
          code: "NO_AVAILABLE_COPY",
          message: "No available copy found.",
        },
      });
    }

    const copyId = copy.rows[0].id;

    // Mark copy as borrowed
    await client.query(
      `UPDATE copies
       SET status = 'on_loan'
       WHERE id = $1`,
      [copyId]
    );

    // Create loan for 14 days
    const loan = await client.query(
      `INSERT INTO loans
       (book_id, copy_id, member_id, borrowed_at, due_date)
       VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days')
       RETURNING *`,
      [bookId, copyId, memberId]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Book borrowed successfully.",
      loan: loan.rows[0],
      copy: copy.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

export const getMyLoans = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
        l.id,
        b.title,
        b.author,
        b.isbn,
        c.copy_code,
        TO_CHAR(l.borrowed_at, 'YYYY-MM-DD') AS borrowed_at,
        TO_CHAR(l.due_date, 'YYYY-MM-DD') AS due_date,
        TO_CHAR(l.returned_at, 'YYYY-MM-DD') AS returned_at,
        l.fine,
        l.return_condition,
        CASE
          WHEN l.returned_at IS NULL
            AND l.due_date < CURRENT_DATE
          THEN true
          ELSE false
        END AS overdue
       FROM loans l
       JOIN books b ON b.id = l.book_id
       JOIN copies c ON c.id = l.copy_id
       WHERE l.member_id = $1
       ORDER BY l.id DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      loans: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllLoans = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
        l.id,
        u.name AS member_name,
        u.email AS member_email,
        b.title,
        b.isbn,
        c.copy_code,
       TO_CHAR(l.borrowed_at, 'YYYY-MM-DD') AS borrowed_at,
TO_CHAR(l.due_date, 'YYYY-MM-DD') AS due_date,
TO_CHAR(l.returned_at, 'YYYY-MM-DD') AS returned_at,
        l.fine,
        l.return_condition,
        CASE
          WHEN l.returned_at IS NULL
          AND l.due_date < CURRENT_DATE
          THEN true
          ELSE false
        END AS overdue
       FROM loans l
       JOIN users u ON u.id = l.member_id
       JOIN books b ON b.id = l.book_id
       JOIN copies c ON c.id = l.copy_id
       ORDER BY l.id DESC`
    );

    res.status(200).json({
      loans: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const returnBook = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { condition } = req.body;

    if (!["good", "damaged", "lost"].includes(condition)) {
      return res.status(400).json({
        error: {
          code: "INVALID_CONDITION",
          message: "Condition must be good, damaged, or lost.",
        },
      });
    }

    await client.query("BEGIN");

    const loan = await client.query(
      `SELECT *
       FROM loans
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (loan.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: {
          code: "LOAN_NOT_FOUND",
          message: "Loan not found.",
        },
      });
    }

    if (loan.rows[0].returned_at !== null) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: {
          code: "ALREADY_RETURNED",
          message: "Loan has already been returned.",
        },
      });
    }

    const fine = calculateFine(loan.rows[0].due_date);

    const updatedLoan = await client.query(
      `UPDATE loans
       SET
         returned_at = CURRENT_DATE,
         fine = $1,
         return_condition = $2
       WHERE id = $3
       RETURNING *`,
      [fine, condition, id]
    );

    // Damaged/lost copies remain unavailable
    const status = condition === "good" ? "available" : "on_loan";

    await client.query(
      `UPDATE copies
       SET condition = $1,
           status = $2
       WHERE id = $3`,
      [condition, status, loan.rows[0].copy_id]
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Book returned successfully.",
      loan: updatedLoan.rows[0],
      fine,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};