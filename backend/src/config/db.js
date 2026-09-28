// import pg from "pg";

// const { Pool } = pg;

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// pool.on("connect", () => {
//   console.log("PostgreSQL connected");
// });

// pool.on("error", (error) => {
//   console.error("PostgreSQL error:", error);
// });

// export default pool;

import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query("SELECT NOW()")
  .then(() => {
    console.log("PostgreSQL connected successfully");
  })
  .catch((error) => {
    console.error("PostgreSQL connection failed:", error.message);
  });

pool.on("error", (error) => {
  console.error("PostgreSQL pool error:", error);
});

export default pool;