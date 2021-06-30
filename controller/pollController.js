// const router = require("express").Router();
const jwt = require("jsonwebtoken");

const pollModel = require("../models/pool");

//private route
const createPollControl = (req, res, next) => {
  res.render("create", {
    poll: null,
    username: req.user,
    title: "Create New Poll",
  });
};

//private route
const pollPostControl = async function (req, res, next) {
  let options = req.body.options;
  options = options.map((opt) => {
    return {
      name: opt,
      vote: 0,
    };
  });

  let createdAt = new Date().getTime();

  const maxAge = Number(req.body.days) * 86400000;
  let expiresIn = createdAt + maxAge;

  const poll = new pollModel({
    user: req.user,
    title: req.body.title,
    description: req.body.description,
    totalVote: 0,
    createdAt,
    expiresIn,
    options,
  });

  try {
    await poll.save();
    res.redirect("/polls");
  } catch (error) {
    res.redirect("/create");
    console.log("mongo err: " + error);
  }
};

//private route
const getAllPolls = async function (req, res, next) {
  try {
    const user = req.user;
    const polls = await pollModel.find({ user });
    res.render("polls", { polls, username: user, title: "All Polls" });
  } catch (error) {
    //TODO -- send a err msg to front end if jwt error occurs
    if (error instanceof jwt.JsonWebTokenError) {
      // if the error thrown is because the JWT is unauthorized, return a 401 error
      res.redirect("/");
      console.log("jwt err: " + error);
    } else {
      res.redirect("/");
      console.log("db err: " + error);
    }
  }
};

//get username from token
const getUserName = (token) => {
  let valid = jwt.verify(token, process.env.jwtKey);

  let username = "";

  if (valid.msg) {
    const user = valid.msg.substring(
      valid.msg.indexOf("U") + 1,
      valid.msg.indexOf("N")
    );
    username = user;
  }
  return username;
};

//public route
const getSinglePoll = async function (req, res, next) {
  const id = req.params.id;
  const cookie = req.cookies[id];
  const token = req.cookies.token;

  try {
    const poll = await pollModel.findById({ _id: id });
    let results = [...poll.options];

    results = results.map((result) => {
      let percentage = (result.vote / poll.totalVote) * 100;
      return {
        name: result.name,
        percentage: percentage ? percentage.toFixed(2) : 0,
      };
    });

    const currentDate = new Date().getTime();

    let username = null;
    token && (username = getUserName(token));

    let resultPageData = {
      poll,
      results,
      title: "Poll Result",
      postCreator: false,
    };

    if (!token && currentDate >= poll.expiresIn) {
      res.render("result", {
        ...resultPageData,
      });
    } else if (cookie && cookie.substring(0, 24) == id) {
      res.render("result", {
        ...resultPageData,
        message: "You have already submitted",
      });
    } else if (token && currentDate >= poll.expiresIn) {
      res.render("result", {
        ...resultPageData,
        postCreator: true,
        username,
      });
    } else if (token) {
      res.render("poll", {
        ...resultPageData,
        title: "Single Poll",
        postCreator: true,
        username,
      });
    } else {
      res.render("poll", {
        ...resultPageData,
        title: "Single Poll",
      });
    }
  } catch (error) {
    res.redirect("/");
    console.log("error: " + error);
  }
};

//public route
const postSinglePoll = async function (req, res, next) {
  const id = req.params.id;
  const optionId = req.body.option;

  try {
    let poll = await pollModel.findById({ _id: id });
    let options = [...poll.options];

    let index = options.findIndex((option) => option.id === optionId);
    options[index].vote += 1;

    let totalVote = poll.totalVote + 1;

    await pollModel.findOneAndUpdate(
      { _id: poll._id },
      { $set: { options, totalVote } }
    );

    let msg = `${poll._id}${Date.now()}`;
    let maxAge = poll.expiresIn - poll.createdAt;

    res.cookie(`${poll._id}`, msg, { maxAge }).redirect(`/polls/${poll._id}`);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  createPollControl,
  pollPostControl,
  getAllPolls,
  getSinglePoll,
  postSinglePoll,
  getUserName,
};
