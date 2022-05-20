var jwt = require('jsonwebtoken');

const jwtSecret = "jwtSecret";

function jwtmw(req, res, next){
    const token = req.headers["x-access-token"];
    console.log(token);
    if (token == null){
        res.send({auth: false, message: "You need a token"});
    }else{
        jwt.verify(token, "jwtSecret", (error, decoded) => {
            if (error){
                throw error;
                res.json({auth: false, message: "you fail to authenticate"});
            }else{
                req.userId = decoded.id;
                req.role = decoded.role;
                next();
            }
        })
    }
}

function verifyAdmin(req, res, next){
    if(req.role !== "admin"){
        res.send({
            success: false,
            message: "you don't have permission",
        });
    }else{
        next();
    }
}

module.exports = {
    jwtmw,
    verifyAdmin,
}