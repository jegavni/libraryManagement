import pool from "../config/db.js";
import { calculateFine } from "../services/fineCalculator.js";

// ============================================
// RETURN BOOK
// POST /api/loans/:id/return
// Librarian only
// ============================================

export const returnBook = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { condition } = req.body;

    // Validate condition
    const allowedConditions = [
      "good",
      "damaged",
      "lost",
    ];

    if (!allowedConditions.includes(condition)) {
      return res.status(400).json({
        error: {
          code: "INVALID_CONDITION",
          message: "Condition must be good, damaged, or lost.",
        },
      });
    }

    await client.query("BEGIN");

    // Lock the loan row
    // This prevents two librarians from returning
    // the same loan at the same time.
    const loanResult = await client.query(
      `
      SELECT
        id,
        book_id,
        copy_id,
        member_id,
        borrowed_at,
        due_date,
        returned_at
      FROM loans
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (loanResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: {
          code: "LOAN_NOT_FOUND",
          message: "Loan not found.",
        },
      });
    }

    const loan = loanResult.rows[0];

    // A loan can only be returned once
    if (loan.returned_at) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: {
          code: "LOAN_ALREADY_RETURNED",
          message: "This loan has already been returned.",
        },
      });
    }

    // Calculate fine using separate service
    const fine = calculateFine(loan.due_date);

    // Update loan
    const updatedLoanResult = await client.query(
      `
      UPDATE loans
      SET
        returned_at = CURRENT_DATE,
        fine = $1,
        return_condition = $2
      WHERE id = $3
      RETURNING
        id,
        book_id,
        copy_id,
        member_id,
        borrowed_at,
        due_date,
        returned_at,
        fine,
        return_condition
      `,
      [fine, condition, id]
    );

    // Update copy
    const updatedCopyResult = await client.query(
      `
      UPDATE copies
      SET
        condition = $1,
        status = 'available'
      WHERE id = $2
      RETURNING
        id,
        book_id,
        copy_code,
        condition,
        status
      `,
      [condition, loan.copy_id]
    );

    // Commit both changes
    await client.query("COMMIT");

    return res.status(200).json({
      message: "Book returned successfully.",
      loan: updatedLoanResult.rows[0],
      copy: updatedCopyResult.rows[0],
      fine,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};