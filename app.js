//jshint esversion:9
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");

const auth = require("./controller/auth");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const cookieParser = require("cookie-parser");

const app = express();

const {
  createPollControl,
  pollPostControl,
  getAllPolls,
  getSinglePoll,
  postSinglePoll,
} = require("./controller/pollController");

const userRoute = require("./controller/userController");

app.set("view engine", "ejs");

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  const token = req.cookies.token;

  if (token) {
    let valid = jwt.verify(token, process.env.jwtKey);
    if (valid.msg) {
      res.redirect("/polls");
    }
  } else res.render("home", { msg: null, title: "Express Poll App Login" });
});

app.use("/user", userRoute);
app.use("/login", (req, res, next) => {
  res.redirect("/user/login");
});
app.use("/register", (req, res, next) => {
  res.redirect("/user/register");
});

//private routes
app.get("/create", auth, createPollControl);
app.post("/create", auth, pollPostControl);
app.get("/polls", auth, getAllPolls);

//public routes
app.get("/polls/:id", getSinglePoll);
app.post("/polls/:id", postSinglePoll);

//404 not found
app.use((req, res, next) => {
  res.status(404).render("err_404");
});

const DB_HOST =
  process.env.NODE_ENV !== "production"
    ? process.env.DB_HOST_LOCAL
    : process.env.DB_HOST_MONGO_ATLAS;

//Connect to Mongo
mongoose.connect(DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const db = mongoose.connection;
//error handle
db.on("error", (err) => {
  console.log("db error:", err);
});

db.once("open", () => {
  console.log("Database Connection Established");
});

module.exports = app;
//TODO : enhance form validation
