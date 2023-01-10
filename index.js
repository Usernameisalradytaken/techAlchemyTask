const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const router = require("./routes");
const session = require("express-session");
const bodyParser = require("body-parser");
const redisClient = require("./redis-client")
require("dotenv").config();

const PORT = process.env.PORT || 3000;

const app = express();
// app use
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.express_session_secret,
    resave: false,
    saveUninitialized: false,
  })
);
app.use("/api", router);



// listening port
const start = async () => {
  try {
    await redisClient.connect();
    mongoose.set('strictQuery', true)
    await _connect(
      `mongodb+srv://${process.env.db_username}:${process.env.db_password}@${process.env.db_clustername}/signup_logout_func?retryWrites=true&w=majority`
    );
    app.listen(PORT, () => {
      console.log("Serve is ON");
    });
  } catch (err) {
    console.log(err);
  }
};

const _connect = async (url) => {
  try {
    await mongoose.connect(url);
    return console.log("Database connected");
  } catch (err) {
    console.log("database connection error occured", err);
    process.exit();
  }
};

start();
