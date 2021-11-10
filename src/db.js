const pg = require("pg");

const pool = new pg.Pool({
  user: "postgres",
  password: "password",
  database: "bulletin_board_db",
  host: "localhost",
  port: 5432,
});

module.exports = pool;
