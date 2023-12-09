const mongoose = require("mongoose")
const passportLocalMongoose = require("passport-local-mongoose")
const Schema = mongoose.Schema

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
})

UserSchema.plugin(passportLocalMongoose)

const UserModel = mongoose.model("user1", UserSchema)
module.exports = UserModel
