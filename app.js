//jshint esversion:9
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

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

//port
const PORT = 4500 || process.env.PORT;
const DB_HOST =
  process.env.NODE_ENV !== "production"
    ? process.env.DB_HOST_LOCAL
    : process.env.DB_HOST_MONGO_ATLAS;

mongoose
  .connect(DB_HOST, {
    //authSource: "admin",
    //user: process.env.DB_USER,
    //pass: process.env.DB_PASS,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("mongodb connected");
    app.listen(PORT, () => {
      console.log(`app is runnning on: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("error" + err);
  });

//TODO : enhance form validation
