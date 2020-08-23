'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');
var bodyParser = require('body-parser');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

var urlSchema = new mongoose.Schema({
  original_url: {type: String, required: true},
  short_url: Number,
  long_url: {type: String, required: true}
});

var Shorten = mongoose.model("Shorten", urlSchema);



let count = 1;


app.post("/api/shorturl/new", (req, res) => {
  
  var findUrl = function(orig, long, done) {
    Shorten.findOne({original_url: orig}, function(err, data) {
      if (err) {return console.error(err);}
      else {
        if (data !== null) {
          res.json({original_url: data.original_url, short_url: data.short_url});
        } else {
          let newUrl = new Shorten({original_url: orig, short_url: count, long_url: long});
          count++;
          console.log("new");
          newUrl.save(function(err, updateUrl) {
            if (err) {console.log(err);}
            else {
              res.json({original_url: newUrl.original_url, short_url: newUrl.short_url});
            }
          });
        }
      }
    });
  };
  //code
  //let myLongurl = `${req.url}`;
  var myLongurl = req.body.url;
  console.log(myLongurl);
  let myreg = /^https?:\/\//;
  let myurl = myLongurl.replace(myreg, "");
  
  if (myreg.test(myLongurl)) {
    dns.lookup(myurl, function(err, address, family) {
      if (err) {
        console.log(err);
      } else {
        findUrl(myurl, myLongurl);
      }
    });
  } else {
    res.json({"error": "invalid URL"});
  }
});

app.get("/api/shorturl/:short", (req, res) => {
  //code
  let shortUrl = req.params.short;
  console.log(shortUrl);
  let takeToWeb = function(short) {
    Shorten.findOne({short_url: shortUrl}, function (err, data) {
      //console.log(data);
      if (err) {return console.error(err);}
      else {
        if (data !== null) {
          console.log("redirect");
          res.redirect(data.long_url);
        } else {
          console.log("not a shortcut");
          res.json({"error": "not an existing shortcut"});
        }
      }
    });
  }
  if (!isNaN(shortUrl)) {
    console.log("here");
    takeToWeb(shortUrl);
  } else {
    console.log("NaN");
    res.json({"error": "please use a number"});
  }
  //console.log(isNaN(shortUrl));
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});


/*dns.lookup("www.google.com", function (err, address, family) {
  if (err) {console.log("error");}
  else {console.log("here");}
})*/