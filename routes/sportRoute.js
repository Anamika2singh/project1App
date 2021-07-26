const express = require('express');
const router = express.Router();
// const multer = require('multer')
const sportController = require('../controllers/sportController')
const middleWare = require('../middlewares/tokenVerify')



router.get('/getSport',sportController.getSport)


module.exports = router;