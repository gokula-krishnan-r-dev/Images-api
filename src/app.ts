import express from "express"
const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth2").Strategy
const mongoose = require("mongoose")
const Schema = mongoose.Schema
const jwt = require("jsonwebtoken")
const LocalStrategy = require("passport-local").Strategy

const session = require("express-session")
const { MongoClient } = require("mongodb")
const app = express()
const port = 3000
const exphbs = require("express-handlebars")
const flash = require("connect-flash")
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")
const passportLocalMongoose = require("passport-local-mongoose")

// app.engine("handlebars", exphbs({ defaultLayout: "main" }))
app.set("view engine", "handlebars")

app.use(morgan("dev"))
// app.use(cookieParser())
// app.use(bodyParser.urlencoded({ extended: true }))
// app.use(bodyParser.json())
app.use(session({ secret: "ilearnnodejs" }))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
const User = require("./auth/userSchema")
// const UserSchema = new Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
// })

// UserSchema.plugin(passportLocalMongoose)

// const User = mongoose.model("user", UserSchema)
//Middleware
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
)

app.post(
  "/signup",
  passport.authenticate("local-signup", {
    successRedirect: "/", // redirect to the secure profile section
    failureRedirect: "/signup",
    failureFlash: true, // allow flash messages
  })
)

app.use(passport.initialize()) // init passport on every route call
app.use(passport.session())
//Get the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from Google Developer Console

// Create Instance of MongoClient for mongodb
mongoose
  .connect(
    "mongodb+srv://gokulakrishnanr812:RKea9bHuz2SvJuGS@astro.w7dqrqv.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error)
  })

const GOOGLE_CLIENT_ID =
  "175197906673-uquqsbiefup6grcdifbn41qepb3ogvob.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "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"

// Define the User schema
const userSchema = new Schema({
  googleId: String,
  displayName: String,
  email: String,
  picture: String,
  _json: Object,
  provider: String,
  id: String,
  name: Object,
  family_name: String,
  email_verified: String,
  language: String,
  // Add more fields as needed
})

// Create the User model
const UserGoogle = mongoose.model("User", userSchema)

const authUser = (accessToken, refreshToken, profile, done) => {
  console.log(profile)

  const findUser = () => {
    UserGoogle.findOne({ googleId: profile.id })
      .then((existingUser) => {
        if (existingUser) {
          return done(null, existingUser)
        } else {
          const newUser = new UserGoogle({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            picture: profile.photos[0].value,
            _json: profile._json,
            provider: profile.provider,
            id: profile.id,
            name: profile.name,
            family_name: profile.family_name,
            email_verified: profile.email_verified,
            language: profile.language,
            // Set other fields as needed
          })

          newUser
            .save()
            .then((user) => {
              return done(null, user)
            })
            .catch((err) => {
              return done(err)
            })
        }
      })
      .catch((err) => {
        if (
          err.name === "MongooseError" &&
          err.message.includes("buffering timed out")
        ) {
          // Retry logic: Attempt to find the user again
          findUser()
        } else {
          return done(err)
        }
      })
  }

  // Start the initial find user process
  findUser()
}

// Use "GoogleStrategy" as the Authentication Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    authUser
  )
)
passport.serializeUser((user, done) => {
  console.log(`\n--------> Serialize User:`)
  console.log(user)
  // The USER object is the "authenticated user" from the done() in authUser function.
  // serializeUser() will attach this user to "req.session.passport.user.{user}", so that it is tied to the session object for each session.

  done(null, user)
})

passport.deserializeUser((user, done) => {
  console.log("\n--------- Deserialized User:")
  console.log(user)
  // This is the {user} that was saved in req.session.passport.user.{user} in the serializationUser()
  // deserializeUser will attach this {user} to the "req.user.{user}", so that it can be used anywhere in the App.

  done(null, user)
})

// app.post("/register", function (req: any, res) {
//   console.log(req.body)

//   User.register(
//     new User({
//       email: "gokula@gmail.com",
//       username: "gokula",
//     }),
//     "2323",
//     function (err, msg) {
//       if (err) {
//         res.send(err)
//       } else {
//         res.send({ message: "Successful" })
//       }
//     }
//   )
// })

/*
  Login routes -- This is where we will use the 'local'
  passport authenciation strategy. If success, send to
  /login-success, if failure, send to /login-failure
*/
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login-failure",
    successRedirect: "/login-success",
  }),
  (err, req, res, next) => {
    if (err) next(err)
  }
)

//console.log() values of "req.session" and "req.user" so we can see what is happening during Google Authentication

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
)

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  })
)
app.get("/logout", (req: any, res) => {
  req.logout(function (err) {
    if (err) {
      // Handle any error that might occur during logout
      return res
        .status(500)
        .json({ message: "Error during logout", error: err })
    }
    // Successful logout
    return res.status(200).json({ message: "Logout successful" })
  })
})

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
)

// //Define the Login Route
// app.get("/login", (req, res) => {
//   res.render("login.ejs")
// })

// app.get(
//   "/auth/google",
//   passport.authenticate("google", {
//     scope: ["profile", "email"],
//     session: false,
//   })
// )
// app.get(
//   "/auth/google/redirect",
//   passport.authenticate("google", {
//     session: false,
//     failureRedirect: `https://localhost:3000/login`,
//   }),
//   (req: any, res) => {
//     res.redirect(req.user) //req.user has the redirection_url
//   }
// )

app.get("/api/v1/home/img/:value", (req, res) => {
  const params: string = req.params.value

  const url =
    // "https://pixabay.com/api/?key=34945053-2ee08af3f77d59c28ee76f5b2&q=yellow+flowers&image_type=photo&pretty=true"
    `https://pixabay.com/api/?key=34945053-2ee08af3f77d59c28ee76f5b2&${params}&pretty=true`

  fetch(url)
    .then((response) => response.json())
    .then((jsonData) => res.send(jsonData))
})

app.get("/api/v1/home/video/:value", (req, res) => {
  const params: string = req.params.value

  const url =
    // "https://pixabay.com/api/?key=34945053-2ee08af3f77d59c28ee76f5b2&q=yellow+flowers&image_type=photo&pretty=true"
    `https://pixabay.com/api/videos?key=34945053-2ee08af3f77d59c28ee76f5b2&${params}&pretty=true`

  fetch(url)
    .then((response) => response.json())
    .then((jsonData) => res.send(jsonData))
})

app.get("/api/v1/search/suggestions/:value", (req, res) => {
  const params: string = req.params.value

  const url =
    //   `https://www.pexels.com/en-us/api/v3/search/suggestions/technology${params}?key=34945053-2ee08af3f77d59c28ee76f5b2`
    `https://www.pexels.com/en-us/api/v3/search/suggestions/${params}`

  fetch(url)
    .then((response) => response.json())
    .then((jsonData) => res.send(jsonData))
})

app.get("/api/v1/unsplash/:value", (req, res) => {
  const params: string = req.params.value

  const url =
    //   `https://www.pexels.com/en-us/api/v3/search/suggestions/technology${params}?key=34945053-2ee08af3f77d59c28ee76f5b2`
    `https://api.unsplash.com/photos?client_id=rJqtn8OFup4_9wGGpZSaby_07jyGsF-2mtMyoz9nBr8&${params}`

  fetch(url)
    .then((response) => response.json())
    .then((jsonData) => res.send(jsonData))
})
require("./config/passport.js")(passport)
app.get("/api/v1/user/location", (req, res) => {
  const url =
    //   `https://www.pexels.com/en-us/api/v3/search/suggestions/technology${params}?key=34945053-2ee08af3f77d59c28ee76f5b2`
    `https://geolocation.onetrust.com/cookieconsentpub/v1/geo/location`

  fetch(url).then((jsonData) => res.send(jsonData))
})

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`)
})
