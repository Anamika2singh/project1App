const express = require('express');
const router = express.Router();
// const multer = require('multer')
const eventController = require('../controllers/eventController')
const middleWare = require('../middlewares/tokenVerify')



router.post('/getEvents',eventController.getEvents)
router.post('/favouriteEvent',middleWare,eventController.favouriteEvent)
router.post('/localEvents',eventController.localEvents)

router.post('/exploreEvents',eventController.exploreEvents)
router.post('/favouriteListing',eventController.favouriteListing)
router.post('/popularity',eventController.popularity)
module.exports = router;