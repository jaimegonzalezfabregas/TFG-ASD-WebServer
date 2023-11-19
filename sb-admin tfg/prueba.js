const express = require('express');
const app = express();

/** Decode Form URL Encoded data */
app.use(express.urlencoded({ extended : true }));

/** Show page with a form */
app.get('/', (req, res, next) => {
  res.send(`<form method="POST" action="/">
  <input type="text" name="a" placeholder="username">
  <input type="submit">
</form>`);
});

/** Process POST request */
app.post('/', function (req, res, next) {
  res.send(JSON.stringify(req.body));
});

/** Run the app */
app.listen(3000);