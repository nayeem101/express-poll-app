const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const auth = require("../controller/auth");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const userModel = require("../models/user");
const pollModel = require("../models/pool");

//get routes
router.get("/login", (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    res.redirect("/create");
  } else {
    res.redirect("/");
  }
});

router.get("/register", (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    res.redirect("/create");
  } else {
    res.render("register", { title: "Register" });
  }
});

//user register
router.post("/register", async (req, res, next) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new userModel({
      username: req.body.username,
      email: req.body.email,
      password: hash,
    });
    await user.save();
    res.status(201).redirect("/");
  } catch (error) {
    console.log(error);
  }
});

//user login
router.post("/login", async (req, res, next) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });

    if (user) {
      bcrypt.compare(req.body.password, user.password, (err, same) => {
        if (err) console.log(err);
        if (same) {
          let msg = `anlpU${user.username}N${Date.now()}`;
          let token = jwt.sign({ msg }, process.env.jwtKey, {
            algorithm: "HS256",
            expiresIn: `${process.env.jwtExpire}d`,
          });

          res
            .cookie("token", token, {
              maxAge: process.env.jwtExpire * 24 * 3600 * 1000,
              httpOnly: true,
            })
            .redirect("/create");
        } else {
          res.render("home", {
            msg: "Auth failed! User not found.",
          });
        }
      });
    } else {
      res.render("home", { msg: "Auth failed! User not found." });
    }
  } catch (error) {
    res.redirect("/");
    console.log(error);
  }
});

//user log out
router.post("/logout", (req, res, next) => {
  res.clearCookie("token").redirect("/");
});

//get single poll to edit
router.get("/edit/:id", auth, async (req, res, next) => {
  const id = req.params.id;
  try {
    let poll = await pollModel.findById({ _id: id });
    res.render("edit", { poll, username: req.user });
  } catch (error) {
    res.redirect("/polls");
    console.log(error);
  }
});

//get edit route
router.get("/edit", auth, (req, res, next) => {
  res.redirect("/polls");
});

//post edited poll
router.post("/edit", auth, async (req, res, next) => {
  const id = req.body.id;

  try {
    const poll = await pollModel.findById({ _id: id });
    let options = req.body.options;

    let newOptions = [];
    for (let i = 0; i < options.length; i += 2) {
      let data = {
        name: options[i],
        vote: Number(options[i + 1]),
      };
      newOptions.push(data);
    }

    try {
      await pollModel.updateOne(
        { _id: id },
        {
          $set: {
            user: poll.user,
            title: req.body.title,
            description: req.body.description,
            totalVote: poll.totalVote,
            createdAt: poll.createdAt,
            expiresIn: poll.expiresIn,
            options: newOptions,
          },
        }
      );
      res.redirect("/polls");
    } catch (error) {
      res.redirect("/create");
      console.log("mongo err: " + error);
    }
  } catch (error) {
    console.log("edit error: " + error);
    res.redirect("/polls");
  }
});

//delete a single poll
router.get("/delete/:id", auth, async (req, res) => {
  const id = req.params.id;
  try {
    await pollModel.deleteOne({ _id: id });
    res.redirect("/polls");
  } catch (error) {
    console.log("error: " + error);
    res.redirect("/polls");
  }
});

module.exports = router;
