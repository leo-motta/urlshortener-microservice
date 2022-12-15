require('dotenv').config();
const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser');
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

//
app.use(bodyParser.urlencoded({ extended: false }))

app.route('/api/shorturl').post((req, res) => {
  const original_url = req.body.url
  const short_url = ' '
  res.json({original_url: original_url, short_url: short_url})
})

app.route('/api/shorturl/:shorturl').get((req, res) => {
  const short_url = req.params.shorturl
   res.redirect('http://google.com');
})