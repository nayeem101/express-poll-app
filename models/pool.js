const { Schema, model } = require("mongoose");

const pollSchema = new Schema({
   user: {
      type: String,
      required: true,
      trim: true,
   },
   title: {
      type: String,
      required: true,
      trim: true,
   },
   description: {
      type: String,
      required: true,
      trim: true,
   },
   totalVote: {
      type: Number,
      default: 0,
   },
   createdAt: {
      type: Date,
   },
   expiresIn: {
      type: Date,
   },
   options: [
      {
         name: {
            type: String,
            trim: true,
         },
         vote: {
            type: Number,
            default: 0,
         },
      },
   ],
});

const pollModel = model("polls", pollSchema);

module.exports = pollModel;
