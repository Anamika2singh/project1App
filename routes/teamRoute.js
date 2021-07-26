const express = require('express');
const router = express.Router();
// const multer = require('multer')
const teamController = require('../controllers/teamController')
const middleWare = require('../middlewares/tokenVerify')



router.get('/chooseLoggedTeam',middleWare,teamController.chooseLoggedTeam)
router.post('/chooseTeam',teamController.chooseTeam)
// router.post('/teamListing',teamController.teamListing)
router.post('/SelectedTeams',teamController.SelectedTeams)

module.exports = router;