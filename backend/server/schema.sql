

CREATE TABLE users (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'member',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_role_check
        CHECK (role IN ('member', 'librarian'))
);


-- ============================================
-- BOOKS
-- ============================================

CREATE TABLE books (
    id SERIAL PRIMARY KEY,

    isbn VARCHAR(20) NOT NULL UNIQUE,

    title VARCHAR(255) NOT NULL,

    author VARCHAR(255) NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- PHYSICAL COPIES
-- ============================================

CREATE TABLE copies (
    id SERIAL PRIMARY KEY,

    book_id INTEGER NOT NULL,

    copy_code VARCHAR(100) NOT NULL UNIQUE,

    condition VARCHAR(20) NOT NULL DEFAULT 'good',

    status VARCHAR(20) NOT NULL DEFAULT 'available',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT copies_book_fk
        FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE RESTRICT,

    CONSTRAINT copies_condition_check
        CHECK (condition IN ('good', 'damaged', 'lost')),

    CONSTRAINT copies_status_check
        CHECK (status IN ('available', 'on_loan'))
);


-- ============================================
-- LOANS
-- ============================================

CREATE TABLE loans (
    id SERIAL PRIMARY KEY,

    book_id INTEGER NOT NULL,

    copy_id INTEGER NOT NULL,

    member_id INTEGER NOT NULL,

    borrowed_at DATE NOT NULL,

    due_date DATE NOT NULL,

    returned_at DATE,

    fine INTEGER NOT NULL DEFAULT 0,

    return_condition VARCHAR(20),

    CONSTRAINT loans_book_fk
        FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE RESTRICT,

    CONSTRAINT loans_copy_fk
        FOREIGN KEY (copy_id)
        REFERENCES copies(id)
        ON DELETE RESTRICT,

    CONSTRAINT loans_member_fk
        FOREIGN KEY (member_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT loans_fine_check
        CHECK (fine >= 0),

    CONSTRAINT loans_return_condition_check
        CHECK (
            return_condition IS NULL
            OR return_condition IN ('good', 'damaged', 'lost')
        ),

    CONSTRAINT loans_dates_check
        CHECK (
            due_date >= borrowed_at
        )
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_books_title
    ON books(title);

CREATE INDEX idx_books_author
    ON books(author);

CREATE INDEX idx_copies_book_id
    ON copies(book_id);

CREATE INDEX idx_copies_available
    ON copies(book_id, status, condition);

CREATE INDEX idx_loans_member_id
    ON loans(member_id);

CREATE INDEX idx_loans_book_id
    ON loans(book_id);

CREATE INDEX idx_loans_due_date
    ON loans(due_date);

CREATE INDEX idx_loans_active_member
    ON loans(member_id)
    WHERE returned_at IS NULL;

CREATE INDEX idx_loans_active_book
    ON loans(book_id)
    WHERE returned_at IS NULL;