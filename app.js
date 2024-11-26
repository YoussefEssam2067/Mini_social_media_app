const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const httpStatusText = require("./utils/httpStatusText");

const app = express();
const port = process.env.PORT || 5000;

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "views")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

require("dotenv").config();
const session = require("express-session");
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Retrieves the secret from environment variables
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set secure to true if using HTTPS
  })
);

app.set("view engine", "ejs");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
app.use("/", authRoutes, userRoutes, postRoutes, commentRoutes);

const db = require("./config/database");
try {
  db.authenticate();
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

app.all("*", (req, res, next) => {
  return res.status(404).render("404-page", { title: "Page Not Found" });
});

app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({
    status: error.statusText || httpStatusText.ERROR,
    message: error.message,
    code: error.statusCode || 500,
    data: null,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
