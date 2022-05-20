var express = require('express');
var router = express.Router();
var { jwtmw, verifyAdmin } = require('./JWTMiddleware.js');
const multer = require('multer');

var mysql = require('mysql');

const storage = multer.diskStorage({
    destination: function(req, file, cb){
      
        var des = "public/images/storeImage/";
        if(file.fieldname === "si"){
            des = des + "Main/";
        }else if(file.fieldname === "sl"){
            des = des + "StoreLicense/";
        }else if(file.fieldname === "pi"){
            des = des + "Pharmacist/";
        }else if(file.fieldname === "pl"){
            des = des + "ProfessionalLicense/";
        }
        console.log(des);
        cb(null, des);
    },
    filename: function(req, file, cb){
      cb(null, file.originalname);
    }
  });

var upload = multer({
    storage: storage,
});


var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nonadvice'
});
connection.connect();

router.get("/", jwtmw, (req, res) => {
    var sql = `SELECT users.id,email,role,created_at,updated_at,\`name\`,address,pharmacist_name,pharmacist_birthDate,professional_license_img,license_img,tel,\`status\`,open_time,close_time,lattitude,longitude,permission,store_img,pharmacist_img FROM users JOIN pharmacies ON users.id=pharmacies.user_id`;
    connection.query(sql, (error, results, fields) => {
        if(error){
            res.send({success: false, message: "Query error"});
        }else{
            res.send({success: true, stores: results});
        }
    })
});

router.post("/", jwtmw, verifyAdmin,(req, res) => {
    var keyword = req.body.keyword;
  
    var sql = `SELECT users.id,email,role,created_at,updated_at,\`name\`,address,pharmacist_name,pharmacist_birthDate,professional_license_img,license_img,tel,\`status\`,open_time,close_time,lattitude,longitude,permission,store_img,pharmacist_img FROM users JOIN pharmacies ON users.id=pharmacies.user_id
    WHERE users.role="store" AND email LIKE "%${keyword}%"`;
    connection.query(sql, (error, results, fields) => {
      if (error) {
        res.send({
          success: false,
          message: "Query error"})
      }else{
        res.send({
          success: true,
          number: results.length,
          stores: results
        })}
    })
  })


router.get("/allId", (req, res) => {
    var sql = 'SELECT id,callStatus FROM pharmacies WHERE `status`=1';
    connection.query(sql, (error, results, fields) => {
        res.send(results);
    })
});

router.post("/search", (req, res) => {
    var searchWord = req.body.keyword;
    var sql = `SELECT id,callStatus FROM pharmacies WHERE \`name\` LIKE "%${searchWord}%"`;
    connection.query(sql, (error, results, fields) => {
        if(error){
            res.send({
                success: false,
                message: "Query error",
            });
        }else{
            res.send({
                success: true,
                store: results,
            });
        }
    })
})

router.put("/switchPermission/:id", jwtmw, verifyAdmin, (req, res) => {
    var permission = req.body.permission;
    if(permission === "active"){
        permission = "banned";
    }else if (permission === "banned"){
        permission = "active";
    }
    var userId = req.params.id;
    console.log(userId + " " + permission);
    var sql = "UPDATE pharmacies SET permission= ? WHERE user_id= ?";
    connection.query(sql, [permission, userId], (error, results, fields) => {
        if(error){
            res.send({
                success: false, 
                message: "Update error"
            });
        }else{
            res.send({
                success: true,
                results: results,
                permission: permission,
            });
        }
    })
})

router.get("/:id", (req, res) => {
    var sql = `SELECT * FROM pharmacies WHERE id=${req.params.id}`;
    connection.query(sql, (error, results, fields) => {
        res.send(results[0]);
    })
})

router.get("/myInfo/:id", (req, res) => {
    var sql = `SELECT * FROM pharmacies WHERE user_id=${req.params.id}`;
    connection.query(sql, (error, results, fields) => {
        res.send(results[0]);
    })
});

router.get("/myInfo2/:id", (req,res) => {
    var sql = `SELECT * FROM pharmacies JOIN users ON pharmacies.user_id=users.id WHERE user_id= ?`;
    connection.query(sql, [req.params.id], (error, results, fields) => {
        if(error){
            res.send({success: false, message: "Query error on /myInfo/:id"});
        }else{
            var store = results[0];
            delete store.password;
            res.send(store);
        }
    })
});

router.put("/registerStore", jwtmw, (req, res) => {
    var userId = req.userId;
    var address = req.body.address;
    var endtime = req.body.endTime;
    var starttime = req.body.startTime;
    var pharmacist_birthDate = req.body.pharmacist_birthDate;
    var pname = req.body.pharmacist_name;
    var pi = req.body.pi;
    var pl = req.body.pl;
    var si = req.body.si;
    var sl = req.body.sl;

    var sql = `UPDATE pharmacies SET address=?, pharmacist_name=?, pharmacist_birthDate=?, professional_license_img=?, license_img=?,open_time=?, close_time=?, store_img=?, pharmacist_img=? WHERE user_id=?`;
    connection.query(sql, [address,pname,pharmacist_birthDate, pl, sl, starttime, endtime,si,pi,userId], (error, results, fields) => {
        if(error){
            throw error;
            res.send({success: false, message: "Query error on /registerStore"})
        }else{
            res.send({success: true, message: "Register success"});
        }
    });
});

router.post("/registerStore/uploadImage", jwtmw, upload.fields(
    [{
        name: 'si'
    },{
        name: 'sl'
    },{
        name: 'pi'
    },{
        name: 'pl'
    }]
), (req, res) => {

});

router.put("/openSession", jwtmw, (req, res) => {
    var userId = req.userId;
    var sql = `UPDATE pharmacies SET callStatus=? WHERE user_id=?`;
    connection.query(sql, ["y", userId], (error, results, fields) => {
        if(error){
            res.send({success: false, message: "error on store /openSession"});
        }else{
            res.send({success: true});
        }
    })
})

router.put("/closeSession", jwtmw, (req, res) => {
    var userId = req.userId;
    var sql = `UPDATE pharmacies SET callStatus=? WHERE user_id=?`;
    connection.query(sql, ["n", userId], (error, results, fields) => {
        if(error){
            res.send({success: false, message: "error on store /closeSession"});
        }else{
            res.send({success: true});
        }
    })
})

module.exports = router;