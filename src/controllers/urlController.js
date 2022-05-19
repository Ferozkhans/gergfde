const urlModel = require("../models/urlModel")
const validUrl= require('valid-url')
const redis = require("redis");
const { promisify } = require("util");
const { customAlphabet } = require ('nanoid')
const baseUrl = "http://localhost:3000";


//Connect to redis
const redisClient = redis.createClient(
    13190,
    "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("gkiOIPkytPI3ADi14jHMSWkZEo2J5TDG", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient)

const createUser = async function (req, res) {
  try {

    let long_url = req.body.longUrl;

    const bodyData = req.body
    
    if (Object.keys(bodyData).length == 0){return res.status(400).send({status:false, message:"Reques body is empty."})}

    if (Object.keys(bodyData) != "longUrl"){return res.status(400).send({status:false,message:"Long URL is not present in request body."})}

    if (Object.values(long_url).length == 0) {return res.status(400).send({status: false,message: "Please provide URL value in request body."});}

    if (!validUrl.isUri(long_url)) {return res.status(400).send({ status: false, message: "Please enter valid long URL." });}

   //-get
    const getDataFromCache = await GET_ASYNC(`${long_url}`);
  let url = JSON.parse(getDataFromCache)          
  if (url) {
    // console.log(getDataFromCache)
    return res.status(302).send({ status: true, message: "redis return", data: url});   
  } 

  const urlData = await urlModel.findOne({ longUrl: long_url })
    if (urlData) {
      const { longUrl, shortUrl, urlCode } = urlData;
      return res.status(200).send({status: true,data: { longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode },});
    } else {
      
      const nanoid = customAlphabet('abcdefghijAB', 12)
      let urlCode = nanoid()
     
      
      let shortUrl = baseUrl + "/" + urlCode;

      bodyData.urlCode = urlCode

      bodyData.shortUrl = shortUrl

      let repeat = await urlModel.find({urlCode: bodyData.urlCode})
     // console.log(repeat)
      if(!repeat) return res.status(400).send({status: false, msg:"repeated url code" })

      await urlModel.create(bodyData)
      let responseData  = await urlModel.findOne({urlCode:urlCode}).select({_id:0, __v:0, createdAt:0, updatedAt: 0});
      await SET_ASYNC(`${bodyData.longUrl}`, JSON.stringify(responseData))
      return res.status(201).send({status: true, message: "URL create successfully",data:responseData});
    }
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

 




// const createUser = async function (req, res) {
//   const localurl = 'http:localhost:3000'
//   const urlCode = shortid.generate() 
//   let {longUrl} = req.body
//   if(!validUrl.isUri(longUrl)){
//    return res.status(400).send({ status:false ,msg: " longUrl is reqired" })
//   }
//   let url = await userModel.findOne({longUrl})

//   if(url){
//     return res.send({data:url})
//   }

//   const shortUrl= localurl +'/'+ urlCode
//   url = new userModel({ longUrl, shortUrl, urlCode, }), await url.save()
//   res.send(url)
  
// }
// // const fetchAuthorProfile = async function (req, res) {
//   let cahcedProfileData = await GET_ASYNC(`${req.params.authorId}`)
//   if(cahcedProfileData) {
//     res.send(cahcedProfileData)
//   } else {
//     let profile = await authorModel.findById(req.params.authorId);
//     await SET_ASYNC(`${req.params.authorId}`, JSON.stringify(profile))
//     res.send({ data: profile });
//   }



// const getUrl = async function (req, res) {
//       try {
//           const url = await userModel.findOne({ urlCode: req.params.urlCode });
//           if (url) {
//               return res.redirecting(url.longUrl)
//           } else {
//               res.status(400).send({ status: false, message: "No Url found." });
//           }
//       } catch (err) {
//           res.status(500).send({ status: false, message: "Server not responding", error: err.message });
//       }
//   }
const getUrl = async function (req, res) {
  const getDataFromCache = await GET_ASYNC(`${req.params.urlCode}`);
  let url = JSON.parse(getDataFromCache)          //// ------->>> have doubt about this line...!!!
  if (url) {
    // console.log(getDataFromCache)
    return res.status(302).redirect(url.longUrl);
    
  } 
  else {
    const urlData = await urlModel.findOne({ urlCode: req.params.urlCode });
    if (!urlData) {
      return res.status(404).send({status: false, message:"No URL is found with the given code. Please enter valid URL code",});
    }
    await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(urlData))
    res.status(302).redirect(urlData.longUrl);
    // console.log(urlData.longUrl)
  }
};
  


module.exports = { createUser ,getUrl}