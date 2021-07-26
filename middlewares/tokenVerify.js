const config = require('../config/app')
var jwt = require('jsonwebtoken')
const helper = require('../helpers/response')
const UserTable = require('../models/user');

module.exports =(async(req,res,next)=>{
    try{
        let token=req.headers['authorization']
        if(!token){
            helper.duplicate(res,'Token is Empty Please Add Token in Header')
        }else{
            var decoded = jwt.verify(token,config.LOG_SECRET_KEY );
            req.userData=decoded;
            let user =  await UserTable.findOne({'_id': req.userData._id})           
            if(user){
              next();
            }else{
              helper.not_found(res,"User Not Found")
            }

        }
    }
    catch(e){
        helper.went_wrong(res,e)
    }
})