import express from "express";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "", // create a databse with name as you wish and add two tables named countries and visited_countries and in the countries fill the table with the csv file that is attached
  password: "", // use the main password so that the pg module can access the databse without any errors
  port: 5432,
});
db.connect();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Routes
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT country_code FROM visited_countries");

    let countries = result.rows.map((country) => country.country_code);

    console.log(result.rows);

    res.render("index.ejs", { countries: countries, total: countries.length });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/add", async (req, res) => {
  try {
    const result = await db.query("SELECT country_code FROM visited_countries");
    let countries = result.rows.map((country) => country.country_code);

    var country_name = req.body.country.replace(/^\s+|\s+$/g, '').toLowerCase();

    var request1 = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) = $1;", [country_name]);

    if (request1.rowCount === 0) {
      return res.render("index.ejs", { countries, total: countries.length, error: "Country not found" });
    }

    var received_country_code = request1.rows[0].country_code;

    if (countries.includes(received_country_code)) {
      return res.render("index.ejs", { countries, total: countries.length, error: "Country already added" });
    }

    await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [received_country_code]);

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Gracefully close the database connection on exit or SIGINT
const closeDatabaseConnection = async () => {
  try {
    await db.end();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing database connection:', error);
    process.exit(1);
  }
};

process.on('exit', closeDatabaseConnection);
process.on('SIGINT', closeDatabaseConnection);

// Generic error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
