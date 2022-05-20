var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var { jwtmw } = require('./JWTMiddleware.js');

const products = [
  {
    id: '1001',
    name: 'Node.js for Beginners',
    category: 'Node',
    price: 990
  },
  {
    id: '1002',
    name: 'React 101',
    category: 'React',
    price: 3990
  },
  {
    id: '1003',
    name: 'Getting started with MongoDB',
    category: 'MongoDB',
    price: 1990
  }
]

router.get('/products', (req, res) => {
  res.json(products)
});

router.post('/products', (req, res) => {
  const payload = req.body;
  res.json(payload);
});

router.get('/', jwtmw, function(req, res, next) {
  res.send({auth: true, message: "Home page from Express and you are authenticated! "})
});

module.exports = router;
