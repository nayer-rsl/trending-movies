const express = require("express");
const path = require("path");
const fs = require("fs"); //file r/w module built-in to Node.js
//const https = require("https"); //built-in https module
const axios = require("axios");
const qs = require("querystring"); //built-in querystring module for manipulating query strings

const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT || "8888";

const trakt = "https://api.trakt.tv/";

var code, accessToken;
var state = "kmaweoiv2kj3kj";

//LOCAL SSL CERTS
/* var opts = {
  ca: [fs.readFileSync("<path_to_root_key>"), fs.readFileSync("<path_to_root_pem>")],
  key: fs.readFileSync("<path_to_localhost_key>"),
  cert: fs.readFileSync("<path_to_localhost_crt>")
}; */

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
//set up static path (for use with CSS, client-side JS, and image files)
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  displayTrendingMovies(res);
});
app.get("/page-requiring-oauth", (req, res) => {
  //if accessToken exists, user has authorized
  if (accessToken !== undefined) {
    //display user data
    console.log("view user data");
    displayUserName(res);
  } else {
    startAuthorizing(res);
  }
});
app.get("/authorize", (req, res) => {
  if (req.query.code) {
    //if code parameter exists in query string, store it
    code = req.query.code
  }
  if (!accessToken && !code) {
    startAuthorizing(res);
  } else {
    getAccessToken(res);
  }
});

//server listening
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

//HTTPS server
/* var server = https.createServer(opts, app);

server.listen(port, () => {
  console.log(`Listening on https://localhost:${port}`);
}); */


//function to display trending movies
function displayTrendingMovies(res) {
  var pageData = {
    title: "Home",
    movies: null
  };
  axios(
    //the request
    {
      url: "/movies/trending?extended=full",
      baseURL: trakt,
      method: "get",
      headers: {
        "Content-Type": "application/json",
        "trakt-api-version": 2,
        "trakt-api-key": process.env.TRAKT_CLIENT_ID
      }
    }
  ).then(function (response){
    //on success do stuff
    //console.log(response.data);
    pageData.movies = response.data; //store JSON results in pageData.movies (previously null)
    res.render("index", pageData);
  }).catch(function (error){
    console.log(error);
  });
}

//OAuth-related functions
function startAuthorizing(res) {
  var params = {
    "response_type": "code",
    "client_id": process.env.TRAKT_CLIENT_ID,
    "redirect_uri": "http://localhost:8888/authorize",
    "state": state
  };
  //convert params to query string format
  let formattedParams = qs.stringify(params);
  let url = `${trakt}oauth/authorize?${formattedParams}`;
  res.redirect(url);
}

function getAccessToken(res) {
  var reqData = {
    "code": code,
    "client_id": process.env.TRAKT_CLIENT_ID,
    "client_secret": process.env.TRAKT_CLIENT_SECRET,
    "redirect_uri": "http://localhost:8888/authorize",
    "grant_type": "authorization_code"
  };
  if (!accessToken) {
    axios(
      {
        url: "/oauth/token",
        baseURL: trakt,
        method: "post",
        headers: {
          "Content-Type": "application/json"
        },
        data: reqData
      }
    ).then(function (response){
      console.log(response.data);
     accessToken = response.data.access_token;
      code = null;
      res.redirect("/page-requiring-oauth");
    }).catch(function (error){
      console.log(error);
    });
  }
}

function displayUserName(res) {
  axios(
    {
      url: "/users/NayerehRasuli",
      baseURL: trakt,
      method: "get",
      headers: {
        "Content-Type": "application/json",
        "trakt-api-version": 2,
        "trakt-api-key": process.env.TRAKT_CLIENT_ID,
        "Authorization": `Bearer ${accessToken}` //use access token in an Authorization header
      }
    }
  ).then(function (response){
    var user = response.data;
    res.render("user", {title:`Hello, ${user.name}`});
  }).catch(function (error){
    console.log(error);
  });
}


