import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "./src/config/db.js";

const seed = async () => {
  try {
    // Clear existing seed data
    await pool.query("TRUNCATE loans, copies, books, users RESTART IDENTITY CASCADE");

    const librarianPassword = await bcrypt.hash("Librarian@123", 12);
    const memberPassword = await bcrypt.hash("Member@123", 12);

    // Create librarian
    const librarianResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'librarian')
       RETURNING id, name, email, role`,
      [
        "jegatheesh Librarian",
        "jega@library.com",
        librarianPassword,
      ]
    );

    // Create member
    const memberResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'member')
       RETURNING id, name, email, role`,
      [
        "Test Member",
        "member@library.com",
        memberPassword,
      ]
    );

    // Create books
    const books = [
      {
        isbn: "9780132350884",
        title: "Clean Code",
        author: "Robert C. Martin",
        description: "A handbook of agile software craftsmanship.",
      },
      {
        isbn: "9780134685991",
        title: "Effective Java",
        author: "Joshua Bloch",
        description: "Best practices for the Java programming language.",
      },
      {
        isbn: "9781491950296",
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        description: "Foundations of reliable and scalable data systems.",
      },
    ];

    const createdBooks = [];

    for (const book of books) {
      const result = await pool.query(
        `INSERT INTO books (isbn, title, author, description)
         VALUES ($1, $2, $3, $4)
         RETURNING id, isbn, title`,
        [book.isbn, book.title, book.author, book.description]
      );

      createdBooks.push(result.rows[0]);
    }

    // Create physical copies
    const copies = [
      [createdBooks[0].id, "CC-001"],
      [createdBooks[0].id, "CC-002"],
      [createdBooks[1].id, "EJ-001"],
      [createdBooks[1].id, "EJ-002"],
      [createdBooks[2].id, "DDIA-001"],
    ];

    for (const [bookId, copyCode] of copies) {
      await pool.query(
        `INSERT INTO copies (book_id, copy_code, condition, status)
         VALUES ($1, $2, 'good', 'available')`,
        [bookId, copyCode]
      );
    }

    console.log("Database seeded successfully");
    console.log("");
    console.log("Librarian:");
    console.log("  Email: librarian@library.com");
    console.log("  Password: Librarian@123");
    console.log("");
    console.log("Member:");
    console.log("  Email: member@library.com");
    console.log("  Password: Member@123");
    console.log("");
    console.log(`Created ${createdBooks.length} books`);
    console.log(`${copies.length} copies`);

    // Keep the returned result references used
    console.log(
      `Librarian ID: ${librarianResult.rows[0].id}, Member ID: ${memberResult.rows[0].id}`
    );
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seed();