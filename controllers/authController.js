const config = require('../config/app')
const express = require('express')
const app = express()
const {Validator} = require('node-input-validator');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const helper = require('../helpers/response');
const UserTable = require('../models/user');
let saltRounds = 10;
const utility = require("../helpers/utility");
var empty = require('is-empty');
const mongoose = require('mongoose');
let ObjectId = mongoose.Types.ObjectId
const mailer = require("../helpers/mailer");
const path = require('path')

exports.signUp =async(req,res,next)=>{
    try{
 const v = new Validator(req.body,{
    name:'required',
    emailId:'required|email',
    password:'required',
    ageGroup:'required',
 })
 const matched = await v.check();
 let name=v.errors.name?v.errors.name.message:'' 
 let emailId=v.errors.emailId?v.errors.emailId.message:''
 let password=v.errors.password?v.errors.password.message:''
 let ageGroup=v.errors.ageGroup?v.errors.ageGroup.message:''
if(!matched){
      let err=name+emailId+password+ageGroup
   helper.validation_error(res,err)
}
 else{
       let checkDuplicate = await UserTable.findOne({'emailId':req.body.emailId})
  if(checkDuplicate){
      
      console.log("already registered with this mail")
     helper.duplicate(res,"Already Registered With This Mail")
}
 else{
                 
       UserTable.create(
                  {
                     emailId:req.body.emailId,
                     password:bcrypt.hashSync(req.body.password,saltRounds),
                     name:req.body.name,
                     ageGroup:req.body.ageGroup,
                     lat:req.body.lat,
                     long:req.body.long ,
                     location: {
                        type: "Point",
                        coordinates: [(req.body.long)?parseFloat(req.body.long):0.0,(req.body.lat)?parseFloat(req.body.lat):0.0]
                    },
                     deviceType:req.body.device_type,
                     deviceToken:req.body.device_token,
                     address:req.body.address,
                     teams:req.body.teams,
                     image:req.file
                 }).then(
                     user=>{

                      let token = jwt.sign({
                        name:user.name,
                        _id:user._id,
                        emailId:user.emailId,
                         lat:user.lat,
                         long:user.long,
                         deviceType:user.deviceType,
                         deviceToken:user.deviceToken,
                         
                         image:user.image,
                         ageGroup:user.ageGroup
                    },config.LOG_SECRET_KEY ); 


                        let check = {}
                        check.address = user.address
                        check.lat = user.lat
                        check.long = user.long
                        check.deviceType = user.deviceType
                        check.deviceToken = user.deviceToken
                        check.favEvents = user.favEvents
                        check.sports = user.sports
                        check._id = user._id
                        check.emailId = user.emailId
                        check.name = user.name
                        check.ageGroup = user.ageGroup
                        check.teams = user.teams
                        check.image = user.image
                        check.token = token
                         helper.success(res,"Registered Succesfully!",check)
                }).catch(
                    err=>{
                        console.log(err)
                        helper.db_error(res,err)
                    })
 }
 }
}
   catch(err){
    console.log(err)
    helper.went_wrong(res,err)
 }

}

exports.login = async(req,res,next)=>{
        try{
            const v = new Validator(req.body,{
                emailId:'required',   
                password:'required'
            })
            const matched = await v.check();
            let emailId = v.errors.emailId?v.errors.emailId.message:''
            let password= v.errors.password?v.errors.password.message:''
    if(!matched){
       let err = emailId+password
       helper.validation_error(res,err)
         }
            else{
          let found = await UserTable.findOne({'emailId':req.body.emailId})
               if(found){
                //    console.log(found)
                    bcrypt.compare(req.body.password , found.password,async(err,user)=>{
                        if(user == true){ //if password match then check for location
                        

                    var arr = {}
                    const its = ["lat","long","deviceType", "deviceToken","address"];
                      for (const iterator of its) {  //iterating object 'its'
                        //   console.log(iterator)  
                        if (req.body[iterator]) {
                        arr[iterator] = req.body[iterator];
                     }
                 }
                if(req.body.lat && req.body.long)
                {
                    arr.location = {
                        type: "Point",
                        coordinates: [parseFloat(req.body.long),parseFloat(req.body.lat)]
                    }
                }
                 if (Object.keys(arr).length !== 0){//if user doesn't access with different location
                    //  let token = jwt.sign(found.toJSON(),config.LOG_SECRET_KEY );
                     let update = await UserTable.findByIdAndUpdate(
                        { _id: found._id },
                        { $set: arr }
                      );
                     }


                     let userData = await UserTable.aggregate([
                        {$match:{'_id':ObjectId(found.id)}},
                         
                            { "$lookup": {
                            "from": "teams",
                            "let": { "teams": "$teams" },
                            "pipeline": [
                            { "$match": { "$expr": { "$in": [ "$_id", "$$teams" ] } } }
                            ],
                            "as": "output"
                            }},
            
                    ])      
                     
                  
                    let token = jwt.sign({
                        name:userData[0].name,
                        _id:userData[0]._id,
                        emailId:userData[0].emailId,
                         lat:userData[0].lat,
                         long:userData[0].long,
                         deviceType:userData[0].deviceType,
                         deviceToken:userData[0].deviceToken,
                         
                         image:userData[0].image,
                         ageGroup:userData[0].ageGroup
                    },config.LOG_SECRET_KEY );   
                    // console.log("chk",token)      
                    let check = {}
                    check.address = userData[0].address
            
                    // console.log(userData[0].output)
                       
                    check.lat = userData[0].lat
                    check.long = userData[0].long
                    check.deviceType = userData[0].deviceType
                    check.deviceToken = userData[0].deviceToken
                    check.favEvents = userData[0].favEvents
                    // check.teams = userData[0].teams
                    check._id = userData[0]._id
                    check.emailId = userData[0].emailId
                    check.name = userData[0].name
                    check.ageGroup = userData[0].ageGroup
                      if(!empty(userData[0].image)){
                    check.image = 'https://d1p9tkvgosm9mc.cloudfront.net/profile/'+userData[0].image
                      }
                      else{
                          check.image = userData[0].image
                      }
                    check.teams = userData[0].output
                     check.token = token
                  
            
                     helper.success(res,"Login Successfully!",check)
                                    }
                        else{
                            // console.log("password not matched")
                           helper.login_failed(res,"Password Not Matched")
                        }
                    })
                }
       else{
        //    console.log("not registered with this mailId")
               helper.login_failed(res,"Not Registered With this MailId")
                }

            }
        }
        catch(e){
            console.log(err)
            helper.went_wrong(res,e)
           }
        }

exports.getUser= async(req,res,next)=>{
    try{
    // console.log(req.userData)
    // let found = await UserTable.findOne({'_id':req.userData._id},{password:0,createdAt:0,updatedAt:0,status:0})
    // if(found){
    //     if(empty(found.image)){
    //    helper.success(res,"User Profile",found)
    //     }
    //     else{
    //         found.image = 'https://d1p9tkvgosm9mc.cloudfront.net/profile/'+found.image 
    //         helper.success(res,"User Profile!",found)
    //     }
    // }
    // else{
    //     helper.not_found(res," User Not Found")
    // }
          console.log(req.userData._id)

    let userData = await UserTable.aggregate([
        {$match:{'_id':ObjectId(req.userData._id)}},
         
            { "$lookup": {
            "from": "teams",
            "let": { "teams": "$teams" },
            "pipeline": [
            { "$match": { "$expr": { "$in": [ "$_id", "$$teams" ] } } }
            ],
            "as": "output"
            }},

    ])      
       
    let check = {}
    check.address = userData[0].address

    // console.log(userData[0].output)
       
    check.lat = userData[0].lat
    check.long = userData[0].long
    check.deviceType = userData[0].deviceType
    check.deviceToken = userData[0].deviceToken
    // check.favEvents = userData[0].favEvents
    // check.teams = userData[0].teams
    check._id = userData[0]._id
    check.emailId = userData[0].emailId
    check.name = userData[0].name
    check.ageGroup = userData[0].ageGroup
     if(!empty(userData[0].image)){
    check.image = 'https://d1p9tkvgosm9mc.cloudfront.net/profile/'+userData[0].image
     }
     else{
         check.image = userData[0].image
     }
    check.teams = userData[0].output
  
  

     helper.success(res,"User Profile Found Successfully!",check)


    }
    catch(e){ 
        helper.went_wrong(res,e)
    }
}     

exports.updateProfile = async(req,res,next)=>{
     try{
        console.log(req.userData._id)
       let userId = req.userData._id;
      
        var dataToUpdate = {}
        const its = ["name","ageGroup","address","lat","long","deviceType", "deviceToken"];
          for (let iterator of its){  //iterating object 'its'
               
            if (req.body[iterator]) {
                dataToUpdate[iterator] = req.body[iterator];  
            }
        }
        if(req.body.lat && req.body.long)
                {
                    dataToUpdate.location = {
                        type: "Point",
                        coordinates: [parseFloat(req.body.long),parseFloat(req.body.lat)]
                    }
                }

            if(!empty(req.file))   // if user wants to change profile picture
            {
               
          dataToUpdate.image = req.file.filename; 
                        //upload new profile to s3 bucket
utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,config.S3_BUCKET_NAME+'profile')
.then(async uploaded=>{
            if(uploaded)
                     {        
let updated = await  UserTable.findByIdAndUpdate({ _id: userId },{ $set:dataToUpdate}) 
                 if(updated){
             console.log("old data" +updated)
                     UserTable.findOne({'_id':userId },{favEvents:0,teams:0,password:0,createdAt:0,updatedAt:0,status:0},(err,updateData)=>{
                            if(err) {
                                 helper.went_wrong(res,err)
                                         }
                            else {
                                var response = {
                                    name:updateData.name,
                                _id:updateData._id,
                                emailId:updateData.emailId,
                                 lat:updateData.lat,
                                 long:updateData.long,
                                 deviceType:updateData.deviceType,
                                 deviceToken:updateData.deviceToken,
                                 
                                 image:updateData.image,
                                 ageGroup:updateData.ageGroup
                                }
                                let token = jwt.sign({
                                name:updateData.name,
                                _id:updateData._id,
                                emailId:updateData.emailId,
                                 lat:updateData.lat,
                                 long:updateData.long,
                                 deviceType:updateData.deviceType,
                                 deviceToken:updateData.deviceToken,
                                 
                                 image:updateData.image,
                                 ageGroup:updateData.ageGroup
                                 },config.LOG_SECRET_KEY );  
                                response.token = token;
                              if(empty(updated.image)){
                                       response.image = 'https://d1p9tkvgosm9mc.cloudfront.net/profile/'+response.image 
                                       helper.success(res,"UserProfile Updated Successfully!",response)

                                    }
                                else{
                                     console.log("notempty"+updated.image)
                                     let toDelete = updated.image
                              utility.deleteS3File(toDelete,config.S3_BUCKET_NAME+'profile');
                                  response.image = 'https://d1p9tkvgosm9mc.cloudfront.net/profile/'+response.image 
                                   helper.success(res,"UserProfile Updated Successfully!",response)              
                                    }                                                                                                                                                                 
                                            }
                                          })                                                                    
                                  }
                   else{
                    helper.db_errorwithoutE(res)
                   }      
   }
        })
        .catch(upload_err=>{
                            console.log('Some problem occured during uploading files on our server');                           
                            helper.db_error(res,upload_err)
                        });

            }else // if user do not change its profile picture
                 {
 let updated = await  UserTable.findByIdAndUpdate({ _id: userId },{ $set:dataToUpdate}) 
                 if(updated){
                console.log("old data",updated)
                     UserTable.findOne({'_id':userId },{favEvents:0,teams:0,password:0,createdAt:0,updatedAt:0,status:0},(err,updateData)=>{
                            if(err) {
                                 helper.went_wrong(res,err)
                                         }
                           else {   
                           var response = {
                                    name:updateData.name,
                                _id:updateData._id,
                                emailId:updateData.emailId,
                                 lat:updateData.lat,
                                 long:updateData.long,
                                 deviceType:updateData.deviceType,
                                 deviceToken:updateData.deviceToken,
                                 
                                 image:updateData.image,
                                 ageGroup:updateData.ageGroup
                                }
                                let token = jwt.sign({
                                name:updateData.name,
                                _id:updateData._id,
                                emailId:updateData.emailId,
                                 lat:updateData.lat,
                                 long:updateData.long,
                                 deviceType:updateData.deviceType,
                                 deviceToken:updateData.deviceToken,
                                 
                                 image:updateData.image,
                                 ageGroup:updateData.ageGroup
                                 },config.LOG_SECRET_KEY );  
                                response.token = token;
                            if(empty(updateData.image )){
                            
                             console.log("UserProfile Updated Successfully!"); 
                             helper.success(res,"UserProfile Updated Successfully!",response)
                            }
                            else{                               
                                console.log("UserProfile Updated Successfully!"); 
                        response.image = 'https://d1p9tkvgosm9mc.cloudfront.net/profile/'+response.image 
                        helper.success(res,"UserProfile Updated Successfully!",response)
                            }
                                  
                                            }
                                          })                                                                                                                                      
                                  }
                   else{
                    helper.db_errorwithoutE(res)

                   }           

                 }

     }
     catch(e){
        helper.went_wrong(res,e)
    }

}

exports.updateLocalData = async(req,res)=>{
    try{
    let userId = req.userData._id;
    if(req.body.teams && req.body.favs){

     let update = await UserTable.findByIdAndUpdate(
         { _id: userId },
         { $set:
             {
                 teams:req.body.teams,
                 favEvents:req.body.favs,
            } }
       );
       if(update){
          console.log("updated data"+update)
        //   UserTable.findOne({'_id':userId },{password:0,createdAt:0,updatedAt:0,status:0},(err,updateData)=>{
        //       if(err) {
        //       helper.went_wrong(res,err)
        //       }
        //       else {                
              helper.successWithnodata(res,"Teams and Favs Events Updated Successfully!")
        //       }
        //   })
       }else{
          // console.log("dber")
         helper.db_errorwithoutE(res)
         }


    }
    else{
     console.log("Please  Select Teams!")
        helper.not_found(res,"Please Select Teams and Favs Events!")
       
    }
}
catch(e){
    helper.went_wrong(res,e)
}
}


exports.sendPasswordResetEmail = async(req,res,next)=>{
        try{
            const v = new Validator(req.body,{
                emailId:'required'
            })
            const matched = await v.check();
            let emailId = v.errors.emailId?v.errors.emailId.message:''
    if(!matched){
       let err = emailId
       helper.validation_error(res,err)
         }
            else{
          UserTable.findOne({'emailId':req.body.emailId},(err,found)=>{
            if(err){helper.went_wrong(res,err)}
          if(found){
                            let token = jwt.sign({
                                _id : found._id,
                                emailId  : found.emailId
                                 },config.LOG_SECRET_KEY,{
                                    audience: 'SqTosdsdKeNpRoJeCt',
                                    expiresIn: 1800
                                } );
                            // Html email body
                            let html = `<p>Please find your password reset link below.</p><a href='http://3.17.93.182:4000/verifyToken/${token}'>Click here</a><br>Please Do not Share this URL with anyone.<br>Note:- Reset Link will expire in 10 Minute.`;
                            // Send confirmation email

                            mailer.send(
                                process.env.SENDER_EMAIL, 
                                req.body.emailId,
                                "Find Your password reset link here",
                                html
                            ).then(success=>{
                                 helper.successWithnodata(res,"We have shared a password reset link to your email!")
                            }).catch(error=>{
                                helper.went_wrong(res,"Sorry, Some Problem Occurred ,Please try again")
                            });
               
        }else
        {
           helper.not_found(res,"Please Enter valid Email!") 
        }
        })
    }
}
        catch(e){
            helper.went_wrong(res,e)
           }
    }
/**
 * Send OTP to user
 *
 * @param {string}  email 
 *
 * @returns {Object}
 */
//     exports.sendPasswordResetEmail = [
//         body("email").trim().isLength({ min: 1 }).withMessage("Email must be specified.")
//         .isEmail().withMessage("Email must be a valid email address."), 
//         (req, res) => {
//             try{
//                 const errors = validationResult(req);
//                 if (!errors.isEmpty()) {
//                     res.render('forgot-password',{msg:"Validation Error"})
//                     // return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
//                 }else {
//                     db.query("SELECT * FROM admin_profile Where email = ?",[req.body.email],(err,user)=>{
//                         if(err)return apiResponse.ErrorResponse(res,"Problem in fetching the user");
//                         if (user.length>0) {
//                             let userData={
//                                 userID : user[0].admin_id,
//                                 email  : user[0].email
//                             }
//                                 const jwtPayload = userData;
//                                 const jwtData = {
//                                     audience: process.env.JWT_AUDIENCE,
//                                     expiresIn: process.env.JWT_TIMEOUT_DURATION,
//                                 };
//                                 const secret = process.env.JWT_SECRET;
//                                 //Generated JWT token with Payload and secret.
//                                 let token = jwt.sign(jwtPayload, secret, jwtData);
//                             // Html email body
//                             let html = `<p>Please find your password reset link below.</p><a href='http://3.17.93.182:4000/auth/verifyToken/${token}'>Click here</a><br>Please Do not Share this URL with anyone.<br>Note:- Reset Link will expire in 10 Minute.`;
//                             // Send confirmation email

//                             mailer.send(
//                                 process.env.SENDER_EMAIL, 
//                                 req.body.email,
//                                 "Find Your password reset link here",
//                                 html
//                             ).then(success=>{
//                                 res.render('forgot-password',{msg:"We have shared a password reset link to your email"});                               
//                                 // return apiResponse.successResponse(res,"Mail sent successfully.");
//                             }).catch(error=>{
//                                 res.render('forgot-password',{msg:"Sorry, Some Problem Occurred ,Please try again"});
//                                 // return apiResponse.ErrorResponse(res,"Problem in sending mail.");
//                             });
//                         }else
//                         {
//                             res.render('forgot-password',{msg:"This is not a valid Email"});
//                             // return apiResponse.ErrorResponse(res,"Email is not present in our database.");
//                         }
//                     })
//                 }
//             }catch(err)
//             {
//                 return apiResponse.ErrorResponse(res, err);
//             }
//         }
//     ];

exports.verifyToken = [
    async(req,res)=>{
        try{
        jwt.verify(req.params.token, config.LOG_SECRET_KEY,{audience: 'SqTosdsdKeNpRoJeCt',expiresIn: 1800},
        function(err,tokenData){
          if(err){res.end("This is not a authorized URL.")}
            console.log("Token Data",tokenData);
            if(tokenData){
                UserTable.findOne({'emailId':tokenData.emailId},{'_id':ObjectId(tokenData._id)},(err,found)=>{
                    if(err){helper.went_wrong(res,err)}
                        if(found)
                            {
                                req.session.tmp_user = found._id;
                                console.log("tmp_user",req.session.tmp_user);
                                res.render('reset-password',{msg:""});
                            }
                        else{
                            res.end("This is not a authorized URL");
                        }
                })
            }
        })
    }catch(e){
        console.log(e)
            helper.went_wrong(res,e)

           }
    }];


// /**
//  * Admin Reset Password
//  *
//  * @param {string}  password
//  * @param {string}  confirmPassword
//  *
//  * @returns {Object}
//  */


exports.resetPassword = async(req,res,next)=>{
        try{
            const v = new Validator(req.body,{
                password:'required',
                confirmPassword:'required'
            })
            const matched = await v.check();
            let password = v.errors.password?v.errors.password.message:''
            let confirmPassword = v.errors.confirmPassword?v.errors.confirmPassword.message:''
    if(!matched){
       let err = password+confirmPassword
        res.render('reset-password',{msg:err});
         }if(req.body.password !== req.body.confirmPassword){
                    res.render('reset-password',{msg:"New Password And Confirm Password should be same"})
            }
            else{
                console.log(req.session.tmp_user)
                   let bcryptPassword =bcrypt.hashSync(req.body.password,saltRounds)
                let updated = await  UserTable.findByIdAndUpdate({ _id: ObjectId(req.session.tmp_user) },{ $set:{password:bcryptPassword}})
                       
                       if(updated){
                         req.session.destroy();
                         res.render('reset-password',{msg:"Password Changed Successfully, Please Close the window and login"});
                       }else{
                            res.render('reset-password',{msg:"You can't change your password right now, Please generate new password reset email."});
                       }
        
            
    }
}
        catch(e){
            helper.went_wrong(res,e)
           }
    }


    // exports.resetPassword = [   
    //     body("password").trim().isLength({ min: 6 }).withMessage("Password must be specified and of minimum six digit."),
    //     body("confirmPassword").trim().isLength({ min: 6 }).withMessage("Confirm Password must be specified."), 
    // (req, res) => {
        
    //     try {
    //         const errors = validationResult(req);
    //         if (!errors.isEmpty()) {
    //             res.render('reset-password',{msg:"Validation Error"});
    //         }else if(req.body.password !== req.body.confirmPassword){
    //                 res.render('reset-password',{msg:"New Password And Confirm Password should be same"})
    //         }else{
    //             bcrypt.hash(req.body.password,10,function(err, hash) {
    //                 console.log('hash',hash);
    //                 console.log("tmp_admin",req.session.tmp_admin)
    //                 db.query("UPDATE admin_profile SET password = ? WHERE admin_id = ?",[hash,req.session.tmp_admin],(err,updated)=>{
    //                    console.log(updated);
    //                    if(err){res.render('reset-password',{msg:"Problem in Updating Password"})}
    //                    if(updated.affectedRows>0){
    //                      req.session.destroy();
    //                      res.render('reset-password',{msg:"Password Changed Successfully, Please Close the window and login"});
    //                    }else{
    //                         res.render('reset-password',{msg:"You can't change your password right now, Please generate new password reset email."});
    //                    }
    //                 })
                            
    //             });
    //         }
    //     } catch (err) {
    //         return apiResponse.ErrorResponse(res, err);
    //     }
    // }];