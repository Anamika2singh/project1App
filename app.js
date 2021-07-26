
const config = require('./config/app')
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyparser = require('body-parser')
var session = require('express-session');
const ejs = require('ejs')
const path = require('path')
const authRoute = require('./routes/authRoute')
const sportRoute = require('./routes/sportRoute')
const teamRoute = require('./routes/teamRoute')
const eventRoute = require('./routes/eventRoute')
// database coonection with mongodb
mongoose.Promise = global.Promise;
mongoose.connect(
  config.MONGODB_URL , { useNewUrlParser: true, useUnifiedTopology: true }) 
         .then(() => console.log("connection successful"))
          .catch((err) => console.error(err));
      
app.use('/verifyToken',express.static(path.join(__dirname, 'public')));
app.use('/',express.static(path.join(__dirname, 'public')));
app.use(bodyparser.json({extended:true}))
app.use(bodyparser.urlencoded({extended:true}))
app.set('view engine','ejs')

app.use(express.static('public/images')); 

app.use(session({
  secret: 'newScan@@#@@@#$@@*&$%$@B!@A&*@@R',
  resave: false,
  saveUninitialized: true,
  cookie: {} //{ secure: true }
}))

app.use('/',authRoute);
app.use('/sport',sportRoute);
app.use('/team',teamRoute);
app.use('/event',eventRoute);

app.listen(config.PORT,()=>{
    console.log("listening port")
})