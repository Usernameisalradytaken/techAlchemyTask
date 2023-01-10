const redisClient = require("./redis-client");

module.exports = async (req, res, next) => {
  console.log(req.route.path);
  let query;
  if (req.route.path == "/weather") {
    query = "weather";
  } else {
    query = req.query.search || "apple";
  }
  console.log(query);
  try {
    const data = await redisClient.get(query);
    console.log(data);
    if (data) {
      const temp = JSON.parse(data);
      return res.status(200).send(temp);
    }
    next();
  } catch (error) {
    console.log(error);
    next()
    // return res.status(500).json({
    //   message: "Internal Server Error",
    // });
  }
};
