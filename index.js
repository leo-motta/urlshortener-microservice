require('dotenv').config();
const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser');
const mongoose = require('mongoose')
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

//Body Parser
app.use(bodyParser.urlencoded({ extended: false }))

//Mongoose connection
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true })

//Database Schema
let shortenerSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number
  }
})

///Database Model
let Shortener = mongoose.model('Shortener', shortenerSchema);

//Function to save URL Shortener document
const createAndSaveURLShortener = async (res, url) => {
  const number_of_documents = await Shortener.countDocuments({})
  
  const shortener = new Shortener({
    url: url,
    short_url: number_of_documents
  })

  shortener.save((err, doc) => {
    if (err) throw new Error('invalid url')
    if (doc) res.json({ "original_url": doc.url, "short_url": doc.short_url })
  })
}

//Function to check if the provided URL has a valid URL pattern
const isValidUrl = async(urlString) => {
  return new Promise((resolve, reject) => {
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
      '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
    resolve(!!urlPattern.test(urlString))
  })
}

//Function to check if the provided URL is a valid web address
const lookupPromise = async (url) => {
  return new Promise((resolve, reject) => {
    dns.lookup(url, (err, address, family) => {
      if (err) reject(err);
      resolve(address);
    });
  })
}

//Function to find URL Shortener document
const findByURLPromise = async (url) => {
  return new Promise((resolve, reject) => {
    Shortener.findOne({ url: url }, (err, doc) => {
      if (err) reject(err)
      if (doc) resolve(doc)
      if (!doc) resolve(null)
    })
  })
}

//Function to find URL Shortener document
const findByShortURLPromise = async (short_url) => {
  return new Promise((resolve, reject) => {
    Shortener.findOne({ short_url: short_url }, (err, doc) => {
      if (err) reject(err)
      if (doc) resolve(doc)
      if (!doc) resolve(null)
    })
  })
}

app.route('/api/shorturl').post(async (req, res) => {
  try {
    //Provided URL
    const original_url = req.body.url
    
    //Transform 'https://www.google.com/query?=' url to 'www.google.com'
    const result_url = (req.body.url).replace(/^https?:\/\//, '').replace(/[^/]*$/, '').replace(/\/+$/, '')
    
    //Check if the provided URL is a valid URL
    const valid_url = await isValidUrl(original_url)
    if(!valid_url)
      throw new Error('invalid url')

    //Check if database doc contains provided URL
    const db_doc = await findByURLPromise(original_url)
    if (db_doc) {
      res.json({ "original_url": db_doc.url, "short_url": db_doc.short_url })
    } else {
      //If the database does not contain a url, first check that it is a valid address and then create a url
      const valid_address = await lookupPromise(result_url)
      if (valid_address) {
        createAndSaveURLShortener(res, original_url)
      } else {
        throw new Error('invalid url')
      }
    }
  } catch (err) {
    res.json({ "error": "invalid url" })
  }
})

app.route('/api/shorturl/:shorturl').get(async(req, res) => {
  try {
    //Provided Short URL
    const short_url = req.params.shorturl
    
    //Read doc from DB
    const doc = await findByShortURLPromise(short_url)
    if (doc) {
      res.redirect(doc.url)
    } else {
      throw new Error('invalid url')
    }
  }
  catch (err) {
    res.json({ "error": "invalid url" })
  }
})