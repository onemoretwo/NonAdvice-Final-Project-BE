var express = require('express');
var router = express.Router();

var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nonadvice'
})
connection.connect();

router.get("/check", (req, res) => {
    connection.query('SELECT * FROM users', (err, rows, fields) => {
        res.json(rows);
    })
})

connection.end()
module.exports = router;