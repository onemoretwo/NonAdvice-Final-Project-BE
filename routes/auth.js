const e = require('express');
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var mysql = require('mysql');
const app = require('../app');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nonadvice'
})
connection.connect();

router.post("/register", (req, res) => {
    const { email, password, tel } = req.body;
    var sqlUniq = `SELECT * FROM users WHERE email="${email}"`;
    connection.query(sqlUniq, (error, results, fields) => {
        if (results.length == 0){
            var sql = `INSERT INTO users (email, password) VALUES ('${email}', '${password}')`;
            connection.query(sql, function (error, results) {
                if (error) throw error;
                var id = results.insertId;
                var sql2 = `INSERT INTO regular_users (user_id, telephone_number) VALUES ('${id}', '${tel}')`
                connection.query(sql2, (error2, results2) => {
                    if (error2) throw error2;
                    res.status(201).json({isUniq: true});
                });
            });
        }else if(results.length == 1){
            res.send({isUniq: false})
        }
    });
});

router.post("/storeRegister", (req, res) => {
    const { name ,email, password, tel } = req.body;
    var sqlUniq = `SELECT * FROM users WHERE email= ?`
    connection.query(sqlUniq, [email], (error, results, fields) => {
        if (results.length == 0){
            var sql = 'INSERT INTO users (email, password, role) VALUES (?, ?, "store")';
            connection.query(sql, [email, password], (error, results, fields) => {
                if(error) throw error;
                var id = results.insertId;
                var sql2 = `INSERT INTO pharmacies (user_id, name, tel) VALUES (?, ?, ?)`;
                connection.query(sql2, [id, name, tel], (error2, results2, fields2) => {
                    if (error2) throw error2;
                    res.status(201).send({isUniq: true});
                });
            })
        }else{
            res.send({isUniq: false});
        }
    })
})


router.post("/login",(req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const jwtSecret = "jwtSecret";

    var sql = `SELECT id,email,password,role FROM users WHERE email= ?`;
    connection.query(sql, [email], (error, results) => {
        if (error) throw error;
        if (results.length == 1){
            const user = results[0]
            if(user.password == password){

                    const id = results[0].id;
                    const role = results[0].role;
                    const token = jwt.sign({id: `${id}`, role: `${role}`}, jwtSecret);

                    delete results[0].password;

                    res.json({auth: true, token: token, userData: results[0]});
                // }
            }else{
                res.send({message: "Wrong username/password combination"})
            }
        } else {
            res.json({ auth: false, message: "No user exists"});
        }
    })
})

module.exports = router;