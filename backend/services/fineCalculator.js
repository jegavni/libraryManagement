// ============================================
// CALCULATE LIBRARY FINE
// Fine = ₹10 per calendar day after due date
// ============================================

export const calculateFine = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  // Convert both dates to UTC midnight
  // so only calendar days are compared.
  const dueUTC = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate()
  );

  const returnedUTC = Date.UTC(
    returned.getUTCFullYear(),
    returned.getUTCMonth(),
    returned.getUTCDate()
  );

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  const daysLate = Math.max(
    0,
    Math.floor((returnedUTC - dueUTC) / millisecondsPerDay)
  );

  return daysLate * 10;
};