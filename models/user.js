const { Schema, model } = require("mongoose");

const userSchema = new Schema({
   username: {
      type: String,
      required: true,
      trim: true,
   },
   email: {
      type: String,
      required: true,
      trim: true,
   },
   password: {
      type: String,
      required: true,
   },
});

const userModel = model("users", userSchema);

module.exports = userModel;
