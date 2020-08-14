'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true });
app.use(cors());

//Testing conecction
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("DB conected!");
});

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

app.listen(port, function () {
  console.log('Node.js listening ...');
});

//////////////////////////////////////////////

const urlSchema = new mongoose.Schema({
  url: String,
  ident: String
});

const UrlModel = mongoose.model("Url", urlSchema);

app.post("/api/shorturl/new",(req,res) => {

  const REPLACE_REGEX = /^https?:\/\//i;
  const url = req.body.url.replace(REPLACE_REGEX,''); 
  dns.lookup(url, (err, address, family) => {
    console.log('address:'+address +' - family: IPv'+family);
    if(err) console.error(err); //res.json({error: "not a valid URL"});
  });
  const urlL = url.replace(/www./,'').split('').reduce((sum,c) => {
    let n = c.charCodeAt(0);    
    return sum + n; 
  }, 0);
  
  console.log("Suma:"+urlL);
  const um = new UrlModel({
    url: req.body.url,
    ident: urlL
  });
  
  um.save((err,data) => {
    if(err) console.log(err);
    res.json({
      original_url: req.body.url, 
      short_url:urlL
    });
  });   
})

app.get("/api/shorturl/:id",(req,res) => {
  UrlModel.findOne({ident: req.params.id},(err,data) => {
    if(err) console.error(err);
    res.redirect(data.url)
  }) 
});