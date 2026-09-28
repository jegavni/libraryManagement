
-- Q1: The 5 most borrowed books in the last 30 days

-- Counts loan transactions where the borrowing date is
-- within the last 30 calendar days.


SELECT
    b.id,
    b.isbn,
    b.title,
    b.author,
    COUNT(l.id) AS borrow_count
FROM books b
JOIN loans l
    ON l.book_id = b.id
WHERE l.borrowed_at >= CURRENT_DATE - INTERVAL '30 days'
  AND l.borrowed_at <= CURRENT_DATE
GROUP BY
    b.id,
    b.isbn,
    b.title,
    b.author
ORDER BY
    borrow_count DESC,
    b.title ASC
LIMIT 5;



-- Q2: Members with overdue loans and the total fine each
--     would owe if they returned everything today
--
-- Fine = Rs. 10 per whole calendar day overdue.
--
-- Only currently active loans are considered:
-- returned_at IS NULL


SELECT
    u.id AS member_id,
    u.name,
    u.email,
    COUNT(l.id) AS overdue_loan_count,
    SUM(
        (CURRENT_DATE - l.due_date) * 10
    ) AS total_fine
FROM users u
JOIN loans l
    ON l.member_id = u.id
WHERE l.returned_at IS NULL
  AND l.due_date < CURRENT_DATE
GROUP BY
    u.id,
    u.name,
    u.email
ORDER BY
    total_fine DESC,
    u.name ASC;

