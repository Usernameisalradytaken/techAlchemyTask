const router = require("express").Router();
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./user-model");
const redisClient = require("./redis-client");
const cacheMiddleware = require("./middleware");
require("dotenv").config();

router.route("/signup").post(async (req, res) => {
  console.log(req.body);
  if (req.body && req.body.name && req.body.email && req.body.password) {
    try {
      const { name, email, password } = req.body;
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
      const isValidEmail = emailRegex.test("john@example.com");
      if (!isValidEmail) {
        res.status(200).json({
          message: "Invalid email address",
        });
      }

      const isUser = await User.findOne({
        where: {
          email: req.body.email,
        },
      });

      if (isUser) {
        return res.status(404).send({ message: "Email Already exists." });
      }

      const passwordHash = bcrypt.hashSync(password, 8);

      const user = await User.create({
        name: name,
        email: email,
        password: passwordHash,
      });

      if (user) {
        console.log(user._id.toString());
        res.status(200).json({
          message: "User registered successfully!",
        });
      }
    } catch (error) {
      console.log("Error in sign api", error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  } else {
    res.status(400).json({
      message: "Invalid. Please provide correct details",
    });
  }
});

router.route("/login").post(async (req, res) => {
  console.log("login route");
  try {
    if (req.session.token) {
      res.status(200).send({
        message: "Already logged in",
      });
      // return;
    } else {
      if (req.body && req.body.password && req.body.email) {
        const user = await User.findOne({
          where: {
            email: req.body.email,
          },
        });

        if (!user) {
          return res.status(404).send({ message: "User Not found." });
        }

        const passwordIsValid = bcrypt.compareSync(
          req.body.password,
          user.password
        );

        if (!passwordIsValid) {
          return res.status(401).send({
            message: "Invalid Password!",
          });
        }

        const token = jwt.sign({ id: user.id }, process.env.jwt_secret, {
          expiresIn: 86400, // 24 hours
        });

        req.session.token = token;

        return res.status(200).json({
          id: user.id,
          username: user.username,
          message: "User is logged in!",
        });
      } else {
        res.status(401).json({
          message: "required parameters missing",
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.route("/logout").post((req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.status(200).send({
          message: "'Error logging out'",
        });
      } else {
        return res.status(200).send({
          message: "You've been signed out!",
        });
      }
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.route("/news").get(
  (req, res, next) => {
    let token = req.session.token;

    if (!token) {
      return res.status(403).send({
        message: "No token provided!",
      });
    }

    jwt.verify(token, process.env.jwt_secret, (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: "Unauthorized!",
        });
      }
      req.userId = decoded.id;
      next();
    });
  },
  cacheMiddleware,
  async (req, res) => {
    const query = req.query.search || "apple";
    console.log(query);
    try {
      const url = `https://newsapi.org/v2/everything?q=${query}&from=2023-01-08&sortBy=popularity&apiKey=${process.env.news_api}`;
      const { data } = await axios.get(url);
      console.log(data);
      redisClient.setEx(
        query,
        1440,
        JSON.stringify({
          count: data.totalResults,
          data: data.articles,
        })
      );
      return res.status(200).send({
        count: data.totalResults,
        data: data.articles,
      });
    } catch (error) {
      console.log("Error in news api", error);
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
);

router.route("/weather").get(cacheMiddleware, async (req, res) => {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=28.4646148&lon=77.0299194&appid=${process.env.weather_api_key}`;

  try {
    const { data } = await axios.get(url);

    const currentTimeInMilliseconds = Date.now();
    const currentTime = new Date(currentTimeInMilliseconds);

    // Set the time to noon (12pm)
    const noonToday = currentTime.setHours(12, 0, 0, 0);
    const inGMT = 6 * 60 * 60 * 1000 + noonToday;

    let results = [];
    if (data.cod == 200) {
      for (let j = 1; j <= 5; j++) {
        const nextDayNoon = inGMT + j * 24 * 60 * 60 * 1000;
        // console.log(new Date(nextDayNoon));
        for (let i = 0; i < data.list.length; i++) {
          const temp = data.list[i];
          //
          // console.log(new Date(temp.dt_txt).toUTCString() +"------------------"+ new Date(nextDayNoon).toUTCString() );
          if (
            new Date(temp.dt_txt).toUTCString() ==
            new Date(nextDayNoon).toUTCString()
          ) {
            results.push({
              date: new Date(nextDayNoon).toDateString(),
              main: temp.weather[0].main,
              temp: temp.main.temp,
            });
          }
        }
      }
    }
    console.log(results);
    redisClient.setEx(
      "weather",
      1440,
      JSON.stringify({
        count: results.length,
        unit: "metric",
        location: "Gurugram",
        data: results,
      })
    );
    res.status(200).json({
      count: results.length,
      unit: "metric",
      location: "Gurugram",
      data: results,
    });
  } catch (err) {
    console.log("Error in weather api", err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

module.exports = router;
