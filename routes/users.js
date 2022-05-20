var express = require('express');
const multer = require('multer');
var router = express.Router();

var mysql = require('mysql');
var { jwtmw, verifyAdmin } = require('./JWTMiddleware.js');

const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, 'public/images/userImage/')
  },
  filename: function(req, file, cb){
    cb(null, "user" + req.userId + ".jpg");
  }
})
var upload = multer({
  storage: storage,
  // limit file size
  // limits: {
  //   fileSize: 1024 * 1024 * 5
  // }
});

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nonadvice'
});
connection.connect();

/* GET users listing. */
router.get('/',function(req, res, next) {
  var sql = `SELECT users.id,email,role,created_at,updated_at,\`name\`,surname,identification_number,telephone_number,address,latitude,longitude,permission,img FROM users JOIN regular_users ON users.id=regular_users.user_id
  WHERE users.role="regular"`
  connection.query(sql, (error, results, fields) => {
    if(error){
      res.send({
        success: false,
        message: "Query error",
      });
    }else{
      res.send({
        success: true,
        users: results,
      })}
  })
});

router.post("/", jwtmw, verifyAdmin,(req, res) => {
  var keyword = req.body.keyword;

  var sql = `SELECT users.id,email,role,created_at,updated_at,\`name\`,surname,identification_number,telephone_number,address,latitude,longitude,permission,img FROM users JOIN regular_users ON users.id=regular_users.user_id
  WHERE users.role="regular" AND email LIKE "%${keyword}%"`;
  connection.query(sql, (error, results, fields) => {
    if (error) {
      res.send({
        success: false,
        message: "Query error"})
    }else{
      res.send({
        success: true,
        number: results.length,
        users: results
      })}
  })
})

router.get('/userrole/:userId', function(req, res){
  var sql = `SELECT role FROM users WHERE id=${req.params.userId}`;
  connection.query(sql, (error, results, fields) => {
    res.send(results[0].role);
  })
});

router.get('/:userId', jwtmw, function(req, res) {
  if(req.userId !== req.params.userId){
    res.send({
      message: "Invalid Token",
    });
  }
  var userId = req.params.userId;
  var sql = `SELECT * FROM users JOIN regular_users ON users.id=regular_users.user_id WHERE users.id=${userId}`
  connection.query(sql, (error, results, fields) => {
    var user = results[0];
    delete user.role;
    delete user.password;
    delete user.user_id;
    delete user.id;
    res.send(results[0]);
  })
})

router.post('/changePassword', jwtmw, (req, res) => {
  var formPassword = req.body.password;
  var userId = req.userId;
  var sql = `SELECT password FROM users WHERE id= ?`;
  connection.query(sql, [userId], (error, results, fields) => {
    var password = results[0].password;
    if (formPassword === password){
      res.send({passwordMatch: true});
    }else{
      res.send({passwordMatch: false});
    }
  })
})

router.put('/changePassword', jwtmw, (req, res) => {
  var password = req.body.password;
  var userId = req.userId;
  var sql = `UPDATE users SET users.password="${password}" WHERE id=${userId}`;
  connection.query(sql, (error, results, fields) => {
    if (error){
      res.send({updateSuccess: false})
    }else{
      res.send({updateSuccess: true})
    }
  })
})

router.put('/updateProfile', jwtmw, (req, res) => {
  var user = req.body;
  var userId = req.userId;
  var sql = 'UPDATE regular_users SET `name`= ?, surname= ?, telephone_number= ?, identification_number= ?, address= ? WHERE user_id= ?';
  connection.query(sql, [user.name, user.surname, user.telephone_number, user.identification_number, user.address, userId],(error, results, fields) => {
    if (error){
      res.send({updateSuccess: false, err: error});
    }else{
      res.send({updateSuccess: true, message: "Update profile successful"});
    }
  })

})

router.post('/updateImage', jwtmw, upload.single("image"), (req, res) => {
  var userId = req.userId;
  var filename = "user" + userId + ".jpg";
  var sql = 'UPDATE regular_users SET img= ? WHERE user_id= ?';
  connection.query(sql, [filename, userId], (error, results, fields) => {
    if (error){
      res.send({updateSuccess: false});
    }else{
      res.send({updateSuccess: true, message: "Change profile image successful"});
    }
  })
})

router.get('/is/Allow', jwtmw, (req, res) => {
  var userId = req.userId;
  var sql = 'SELECT identification_number, address FROM regular_users WHERE user_id= ?'
  connection.query(sql, [userId], (error, results, fields) => {
    if (error){
      res.send({success: false, message: "Error with query"});
    }else{
      if (results[0].identification_number === null || results[0].address === null){
        res.send({success: true, isAllow: false});
      }else{
        res.send({success: true, isAllow: true});
      }
    }
  }) 
});

router.get('/user/logout', jwtmw, (req, res) => {
  var userId = req.userId;
  var sql = 'UPDATE users SET updated_at=CURRENT_TIMESTAMP WHERE id= ?'
  connection.query(sql, [userId], (error, results, fields) => {
    if(error){
      res.send({
        success: false,
        message: "Query error",
      });
    }else{
      res.send({
        success: true,
        message: "loggin out!"
      })
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
  var sql = "UPDATE regular_users SET permission= ? WHERE user_id= ?";
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

router.get("/is/banned", jwtmw, (req, res) => {
  var userId = req.userId
  var sql = "SELECT permission FROM regular_users WHERE user_id=?";
  connection.query(sql, [userId], (error, results, fields) => {
    if(error){
      res.send({
        success: false,
        message: "Error on user /isbanned"
      });
    }else{
      res.send({
        success: true,
        permission: results,
      });
    }
  })
})


module.exports = router;
