const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const middleWare = require('../middlewares/tokenVerify');
var multer = require("multer");

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/images/" , function(err , succ) {
            if(err)
                throw err

        });
    },
    filename: function (req, file, cb) {        
        var name  = (Date.now()+ Date.now() +file.originalname);
        name = name.replace(/ /g,'-');       
        cb(null, name , function(err , succ1) {
            if(err)
                throw err

        });
    }
});
const upload = multer({ storage: storage, limits: 1000000});

router.post('/signUp', authController.signUp);
router.post('/login',authController.login);
router.post('/sendPasswordResetEmail', authController.sendPasswordResetEmail);
router.post("/resetPassword",authController.resetPassword);
router.get("/verifyToken/:token",authController.verifyToken);
router.get('/getUser',middleWare,authController.getUser);
router.post('/updateProfile',upload.single('image'),middleWare,authController.updateProfile);
router.post('/updateLocalData',middleWare,authController.updateLocalData);
module.exports = router;