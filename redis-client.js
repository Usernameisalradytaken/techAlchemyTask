
const redis = require("redis");


const redisClient = redis.createClient({
 socket : {
    reconnectStrategy : async (retries) => { if(retries == 10){
        await redisClient.disconnect().then(()=> redisClient.emit('close'))}
        else{
            return retries * 50
    }}
 }
});

redisClient.on('close',()=>{
    console.log("Redis was unable to connect, so closing the redis connection and exiting server");
    process.exit()
})

redisClient.on("error", (error) => {
    console.log("Error in redis client ", error);
  });
  
redisClient.on('connect', () => {
    console.log("Redis Connected ");
})

  module.exports = redisClient