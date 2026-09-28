import pool from "../config/db.js";

// ============================================
// GET COPIES FOR A BOOK
// GET /api/books/:bookId/copies
// Librarian only
// ============================================

export const getCopiesByBook = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    // First verify that the book exists
    const bookResult = await pool.query(
      `
      SELECT id, title, isbn
      FROM books
      WHERE id = $1
      `,
      [bookId]
    );

    if (bookResult.rowCount === 0) {
      return res.status(404).json({
        error: {
          code: "BOOK_NOT_FOUND",
          message: "Book not found.",
        },
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        book_id,
        copy_code,
        condition,
        status,
        created_at
      FROM copies
      WHERE book_id = $1
      ORDER BY id ASC
      `,
      [bookId]
    );

    return res.status(200).json({
      book: bookResult.rows[0],
      copies: result.rows,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================
// ADD COPY
// POST /api/books/:bookId/copies
// Librarian only
// ============================================

export const createCopy = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { copyCode } = req.body;

    if (!copyCode || !copyCode.trim()) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Copy code is required.",
        },
      });
    }

    // Verify book exists
    const bookResult = await pool.query(
      `
      SELECT id
      FROM books
      WHERE id = $1
      `,
      [bookId]
    );

    if (bookResult.rowCount === 0) {
      return res.status(404).json({
        error: {
          code: "BOOK_NOT_FOUND",
          message: "Book not found.",
        },
      });
    }

    const result = await pool.query(
      `
      INSERT INTO copies
        (book_id, copy_code, condition, status)
      VALUES
        ($1, $2, 'good', 'available')
      RETURNING
        id,
        book_id,
        copy_code,
        condition,
        status,
        created_at
      `,
      [bookId, copyCode.trim()]
    );

    return res.status(201).json({
      message: "Copy added successfully.",
      copy: result.rows[0],
    });
  } catch (error) {
    // PostgreSQL UNIQUE constraint
    if (error.code === "23505") {
      return res.status(409).json({
        error: {
          code: "COPY_CODE_ALREADY_EXISTS",
          message: "A copy with this code already exists.",
        },
      });
    }

    next(error);
  }
};


// ============================================
// UPDATE COPY CONDITION
// PATCH /api/copies/:id
// Librarian only
// ============================================

export const updateCopy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { condition } = req.body;

    const allowedConditions = [
      "good",
      "damaged",
      "lost",
    ];

    if (!allowedConditions.includes(condition)) {
      return res.status(400).json({
        error: {
          code: "INVALID_CONDITION",
          message:
            "Condition must be good, damaged, or lost.",
        },
      });
    }

    const result = await pool.query(
      `
      UPDATE copies
      SET condition = $1
      WHERE id = $2
      RETURNING
        id,
        book_id,
        copy_code,
        condition,
        status,
        created_at
      `,
      [condition, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: {
          code: "COPY_NOT_FOUND",
          message: "Copy not found.",
        },
      });
    }

    return res.status(200).json({
      message: "Copy updated successfully.",
      copy: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};