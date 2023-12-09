const mongoose = require("mongoose")

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
