var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var { jwtmw, verifyAdmin } = require('./JWTMiddleware.js');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nonadvice'
});
connection.connect();

router.get("/newRequest", jwtmw,verifyAdmin, (req, res) => {
    var sql = "SELECT * FROM users JOIN pharmacies ON users.id=pharmacies.user_id WHERE `status`=0 AND address IS NOT NULL";
    connection.query(sql, (error, results, fields) => {
        if(error){
            res.send({success: false, message: "Query error on admin /newRequest"});
        }else{
            for(let i=0; i<results.length; i++){
                delete results[i].password;
                delete results[i].id;
            }
            res.send({success: true, store: results});
        }
    })
});

router.put("/approve", jwtmw, verifyAdmin, (req, res) => {
    var userId = req.body.user_id;
    var sql = "UPDATE pharmacies SET `status`=1 WHERE user_id=?";
    connection.query(sql, [userId], (error, results, fields) => {
        if(error){ 
            res.send({success: false, message:"Query error on admin /approve/:id "})
        }else{
            res.send({success: true});
        }
    })
});

module.exports = router;