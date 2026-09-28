import pool from "../config/db.js";

// ============================================
// GET ALL / SEARCH BOOKS
// GET /api/books?search=harry&page=1&limit=20
// ============================================

export const getBooks = async (req, res, next) => {
  try {
    const search = req.query.search?.trim() || "";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );

    const offset = (page - 1) * limit;

    const searchPattern = `%${search}%`;

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.isbn,
        b.title,
        b.author,
        b.description,
        b.created_at,

        COUNT(c.id) AS total_copies,

        COUNT(c.id) FILTER (
          WHERE c.status = 'available'
            AND c.condition = 'good'
        ) AS available_copies

      FROM books b

      LEFT JOIN copies c
        ON c.book_id = b.id

      WHERE
        b.title ILIKE $1
        OR b.author ILIKE $1
        OR b.isbn ILIKE $1

      GROUP BY b.id

      ORDER BY b.title ASC

      LIMIT $2
      OFFSET $3
      `,
      [searchPattern, limit, offset]
    );

    return res.status(200).json({
      books: result.rows,
      pagination: {
        page,
        limit,
        count: result.rowCount,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ============================================
// GET SINGLE BOOK
// GET /api/books/:id
// ============================================

export const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.isbn,
        b.title,
        b.author,
        b.description,
        b.created_at,

        COUNT(c.id) AS total_copies,

        COUNT(c.id) FILTER (
          WHERE c.status = 'available'
            AND c.condition = 'good'
        ) AS available_copies

      FROM books b

      LEFT JOIN copies c
        ON c.book_id = b.id

      WHERE b.id = $1

      GROUP BY b.id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: {
          code: "BOOK_NOT_FOUND",
          message: "Book not found.",
        },
      });
    }

    return res.status(200).json({
      book: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};


// ============================================
// CREATE BOOK
// POST /api/books
// Librarian only
// ============================================

export const createBook = async (req, res, next) => {
  try {
    const {
      isbn,
      title,
      author,
      description,
    } = req.body;

    if (!isbn || !title || !author) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "ISBN, title and author are required.",
        },
      });
    }

    const normalizedIsbn = isbn.trim();

    const result = await pool.query(
      `
      INSERT INTO books
        (isbn, title, author, description)
      VALUES
        ($1, $2, $3, $4)
      RETURNING
        id,
        isbn,
        title,
        author,
        description,
        created_at
      `,
      [
        normalizedIsbn,
        title.trim(),
        author.trim(),
        description?.trim() || null,
      ]
    );

    return res.status(201).json({
      message: "Book created successfully.",
      book: result.rows[0],
    });
  } catch (error) {
    // PostgreSQL unique constraint
    if (error.code === "23505") {
      return res.status(409).json({
        error: {
          code: "ISBN_ALREADY_EXISTS",
          message: "A book with this ISBN already exists.",
        },
      });
    }

    next(error);
  }
};


// ============================================
// UPDATE BOOK
// PUT /api/books/:id
// Librarian only
// ============================================

export const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      isbn,
      title,
      author,
      description,
    } = req.body;

    if (!isbn || !title || !author) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "ISBN, title and author are required.",
        },
      });
    }

    const result = await pool.query(
      `
      UPDATE books

      SET
        isbn = $1,
        title = $2,
        author = $3,
        description = $4

      WHERE id = $5

      RETURNING
        id,
        isbn,
        title,
        author,
        description,
        created_at
      `,
      [
        isbn.trim(),
        title.trim(),
        author.trim(),
        description?.trim() || null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: {
          code: "BOOK_NOT_FOUND",
          message: "Book not found.",
        },
      });
    }

    return res.status(200).json({
      message: "Book updated successfully.",
      book: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: {
          code: "ISBN_ALREADY_EXISTS",
          message: "A book with this ISBN already exists.",
        },
      });
    }

    next(error);
  }
};


// ============================================
// DELETE BOOK
// DELETE /api/books/:id
// Librarian only
// ============================================

export const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check whether this book has ever been borrowed.
    const loanCheck = await pool.query(
      `
      SELECT id
      FROM loans
      WHERE book_id = $1
      LIMIT 1
      `,
      [id]
    );

    if (loanCheck.rowCount > 0) {
      return res.status(409).json({
        error: {
          code: "BOOK_HAS_LOAN_HISTORY",
          message: "A book that has been lent cannot be deleted.",
        },
      });
    }

    const result = await pool.query(
      `
      DELETE FROM books
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: {
          code: "BOOK_NOT_FOUND",
          message: "Book not found.",
        },
      });
    }

    return res.status(200).json({
      message: "Book deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};