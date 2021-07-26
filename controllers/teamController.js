const config = require('../config/app')


const express = require('express');
const app=express()
const mongoose = require('mongoose')
const helper = require('../helpers/response');
const utility = require('../helpers/utility');
const {Validator} = require('node-input-validator');
const bcrypt= require('bcrypt');
const jwt = require('jsonwebtoken');
let ObjectId = mongoose.Types.ObjectId;
const teamTable = require('../models/team');
const sportTable = require('../models/sport');
const UserTable = require('../models/user');
const { findOne } = require('../models/team');
const team = require('../models/team');
var empty = require('is-empty');
exports.chooseTeam = async(req,res)=>{ 
    try{
  
            var userLat = req.body.lat;
            var userLong = req.body.long;          
            if(!empty(userLat,userLong)){ //if user enters a lat long

                    var suggestDistance = 50 ;
                    let teamArr = [];
                   
             let sports = await sportTable.find({},{updatedAt:0,createdAt:0,status:0}).sort({name:1})//all sports array
                 if(sports){        
                        for(let sport of sports){
                            sport.image = 'https://d1p9tkvgosm9mc.cloudfront.net/sports/'+sport.image
                             console.log("sportid"+sport.id)
                             //finding all  teams of particuar sport_id 
                 let teams = await teamTable.find( { 'sports' :sport._id },{updatedAt:0,createdAt:0,status:0,sports:0}).sort({name:1})                       
                              console.log("all teams in sport"+ teams)
                              let suggestedTeams = [];  
                        if(teams.length>0){ //if team array is not empty 
                                       
                         for(let team of teams) {//checking if team is in range of suggestion to show
                             console.log("single team"+team.lat,team.long)
                              
                           var lat1 = team.lat; 
                            var long1 =team.long;
                             var lat2 = userLat;
                             var long2 = userLong;
                              let distance =  utility.calcDistance(lat1, long1, lat2, long2) 

                             var milesDistance  =    distance * 0.62137;
                           
                           //    let milesDistance  =    distance 
                              if(milesDistance <= suggestDistance){
                                  console.log("teams in range "+ teams)
                               suggestedTeams.push(team)
                              }
                                  };
               
                                  teamArr.push({
                                   sportID:sport,
                                   teams:teams,
                                   suggestedTeams:suggestedTeams
                                   
                               })
                              
                       }
                       else{// if team array is empty
               
                           teamArr.push({
                               sportID:sport,
                               teams:teams,
                               suggestedTeams:suggestedTeams
                           })                                       
                       }                         
                        }                     
                       helper.success(res,"Teams Found Successfully!",teamArr)
                   }
                   else{
                       helper.not_found(res,"No Sports Found")
                   }                                                              
        }
        else{          //if user doesn't enters a lat long
            console.log("no suggtn")

            let teamArr = [];
           
           let sports = await sportTable.find({},{updatedAt:0,createdAt:0,status:0}).sort({name:1})
            if(sports){        
                for(let sport of sports){
                    sport.image = 'https://d1p9tkvgosm9mc.cloudfront.net/sports/'+sport.image
               let teams = await teamTable.find( { 'sports' :sport._id }, {updatedAt:0,createdAt:0,status:0,sports:0}).sort({name:1})                       
                                         
                          teamArr.push({
                           sportID:sport,
                           teams:teams,
                           suggestedTeams:[]
                           
                       })     
                   
                }     
               helper.success(res,"Teams Found Successfully!",teamArr)
           }
           else{
               helper.not_found(res,"No Sports Found")
           }             


        }
    
}
catch(err){
    helper.went_wrong(res,err)
}
}

exports.chooseLoggedTeam = async(req,res)=>{
    try{
  var teams = await teamTable.aggregate([
   { $match: {"_id": ObjectId("605cd569559d77241d3a9de9") } },
 {
      $lookup: {
        from: 'events',
        'let': {teamId : '$_id' },
        pipeline: [
          {
            $match:{
              $expr:{
              $in : ['$$teamId',"$teams"] 
            } 
              }          
      }
       ],
        as: 'result'
      }
},
 { "$unwind": {
            "path": "$result",
            "preserveNullAndEmptyArrays": true
} },
   {
      $lookup: {
        from: "users",
        'let': {currentLoggedUser : ObjectId("6054768916bb8d282c6cfd58"), eventId: "$result._id" },
        pipeline: [
          {
            $match:{
              $expr:{
            $and : [
               {$eq:["$_id","$$currentLoggedUser"] },
                { $in : ["$$eventId","$favEvents"] } 
            ]
          }
      }
          }
       ],
        as: "result2"
      }
    },
    {
     $addFields:{
      "result.fav1": {
          $cond: { if: {
              $gt: [{$size: "$result2"}, 0] },
           then: true,
           else: false
     } 
       
    }
  }
    },
      {
     $addFields:{
      "result.image":  { $concat: [  " abc ", "$result.image" ] }
    }
      },
    
    {
        $project:{
            result2: 0
        }
    }
])
  console.log("Advance query",teams);
  if(!empty(req.userData.lat) && !empty(req.userData.long) && req.userData.lat != "0.0" && req.userData.long != "0.0")
                {
                  var userLat = req.userData.lat
                  var userLong = req.userData.long
                }else{
                  var userLat = req.body.lat
                 var userLong = req.body.long
                }
  if(!empty(userLat,userLong)){ // if lat and long is present in token
     
    var suggestDistance = 50 ;
    let teamArr = [];
   
   let sports = await sportTable.find({},{updatedAt:0,createdAt:0,status:0}).sort({name:1})
    if(sports){        
        for(let sport of sports){
            sport.image = 'https://d1p9tkvgosm9mc.cloudfront.net/sports/'+sport.image
       let teams = await teamTable.find( { 'sports' :sport._id }, {updatedAt:0,createdAt:0,status:0,sports:0}).sort({name:1})                                   
       let suggestedTeams = [];  
        if(teams.length>0)
            {         
               
         for(let team of teams) {           
           var lat1 = team.lat; 
            var long1 =team.long;
             var lat2 = userLat;
             var long2 = userLong;
             console.log(lat2.long2)
              let distance =  utility.calcDistance(lat1, long1, lat2, long2)
                
             var milesDistance  =    distance * 0.62137;
           
           //    let milesDistance  =    distance 
              if(milesDistance <= suggestDistance){                 
               suggestedTeams.push(team)
              }
                  };

                  teamArr.push({
                   sportID:sport,
                   teams:teams,
                   suggestedTeams:suggestedTeams
                   
               })
              
       }
       else{

           teamArr.push({
               sportID:sport,
               teams:teams,
               suggestedTeams:suggestedTeams
           })         
       }         
        }     
       helper.success(res,"Teams Found Successfully!",teamArr)
   }
   else{
       helper.not_found(res,"No Sports Found")
   }                   
    


   
  }
  else{ //if lat long is not present in token then
       console.log("no suggtn")

       let teamArr = [];
      
      let sports = await sportTable.find({},{updatedAt:0,createdAt:0,status:0}).sort({name:1})
       if(sports){        
           for(let sport of sports){
            sport.image = 'https://d1p9tkvgosm9mc.cloudfront.net/sports/'+sport.image
          let teams = await teamTable.find( { 'sports' :sport._id }, {updatedAt:0,createdAt:0,status:0,sports:0}).sort({name:1})                       
                                    
                     teamArr.push({
                      sportID:sport,
                      teams:teams,
                      suggestedTeams:[]
                      
                  })     
              
           }     
          helper.success(res,"Teams Found Successfully!",teamArr)
      }
      else{
          helper.not_found(res,"No Sports Found")
      }                   
       
  }

  //
}
catch(err){
    helper.went_wrong(res,err)
}
}

// exports.teamListing = async(req,res)=>{
// try{
//     let token=req.headers['authorization']
//     if(!token){
//         var userLat = req.body.lat;
//             var userLong = req.body.long;          
//             if(!empty(userLat,userLong)){ //if user enters a lat long

//                     var suggestDistance = 50 ;
//                     let teamArr = [];
                   
//              let sports = await sportTable.find({},{updatedAt:0,createdAt:0,status:0}).sort({name:1})//all sports array
//                  if(sports){        
//                         for(let sport of sports){
//                             sport.image = 'https://d1p9tkvgosm9mc.cloudfront.net/sports/'+sport.image
//                              console.log("sportid"+sport.id)
//                              //finding all  teams of particuar sport_id 
//                  let teams = await teamTable.find( { 'sports' :sport._id },{updatedAt:0,createdAt:0,status:0,sports:0}).sort({name:1})                       
//                               console.log("all teams in sport"+ teams)
//                               let suggestedTeams = [];  
//                         if(teams.length>0){ //if team array is not empty 
                                       
//                          for(let team of teams) {//checking if team is in range of suggestion to show
//                              console.log("single team"+team.lat,team.long)
                              
//                            var lat1 = team.lat; 
//                             var long1 =team.long;
//                              var lat2 = userLat;
//                              var long2 = userLong;
//                               let distance =  utility.calcDistance(lat1, long1, lat2, long2) 

//                              var milesDistance  =    distance * 0.62137;
                           
//                            //    let milesDistance  =    distance 
//                               if(milesDistance <= suggestDistance){
//                                   console.log("teams in range "+ teams)
//                                suggestedTeams.push(team)
//                               }
//                                   };
               
//                                   teamArr.push({
//                                    sportID:sport,
//                                    teams:teams,
//                                    suggestedTeams:suggestedTeams
                                   
//                                })
                              
//                        }
//                        else{// if team array is empty
               
//                            teamArr.push({
//                                sportID:sport,
//                                teams:teams,
//                                suggestedTeams:suggestedTeams
//                            })                                       
//                        }                         
//                         }                     
//                        helper.success(res,"Teams Found Successfully!",teamArr)
//                    }
//                    else{
//                        helper.not_found(res,"No Sports Found")
//                    }                                                              
//         }
//         else{          //if user doesn't enters a lat long
//             console.log("no suggtn")

//             let teamArr = [];
           
//            let sports = await sportTable.find({},{updatedAt:0,createdAt:0,status:0}).sort({name:1})
//             if(sports){        
//                 for(let sport of sports){
//                     sport.image = 'https://d1p9tkvgosm9mc.cloudfront.net/sports/'+sport.image
//                let teams = await teamTable.find( { 'sports' :sport._id }, {updatedAt:0,createdAt:0,status:0,sports:0}).sort({name:1})                       
                                         
//                           teamArr.push({
//                            sportID:sport,
//                            teams:teams,
//                            suggestedTeams:[]
                           
//                        })     
                   
//                 }     
//                helper.success(res,"Teams Found Successfully!",teamArr)
//            }
//            else{
//                helper.not_found(res,"No Sports Found")
//            }             


//         }
      

//     }else{
//         var decoded = jwt.verify(token,config.LOG_SECRET_KEY );
//         req.userData=decoded;
//         let user =  await UserTable.findOne({'_id': req.userData._id})           
//         if(user){
          
//             var userLat = req.userData.lat
//             var userLong = req.userData.long
           
//             if(!empty(userLat,userLong)){ // if lat and long is present in token
               
//               var suggestDistance = 50 ;
//               let teamArr = [];
             
//              let sports = await sportTable.find({},{updatedAt:0,createdAt:0,status:0}).sort({name:1})
//               if(sports){        
//                   for(let sport of sports){
//                       sport.image = 'https://d1p9tkvgosm9mc.cloudfront.net/sports/'+sport.image
//                  let teams = await teamTable.find( { 'sports' :sport._id }, {updatedAt:0,createdAt:0,status:0,sports:0}).sort({name:1})                                   
//                  let suggestedTeams = [];  
//                   if(teams.length>0)
//                       {         
                         
//                    for(let team of teams) {           
//                      var lat1 = team.lat; 
//                       var long1 =team.long;
//                        var lat2 = userLat;
//                        var long2 = userLong;
//                        console.log(lat2.long2)
//                         let distance =  utility.calcDistance(lat1, long1, lat2, long2)
                          
//                        var milesDistance  =    distance * 0.62137;
                     
//                      //    let milesDistance  =    distance 
//                         if(milesDistance <= suggestDistance){                 
//                          suggestedTeams.push(team)
//                         }
//                             };
          
//                             teamArr.push({
//                              sportID:sport,
//                              teams:teams,
//                              suggestedTeams:suggestedTeams
                             
//                          })
                        
//                  }
//                  else{
          
//                      teamArr.push({
//                          sportID:sport,
//                          teams:teams,
//                          suggestedTeams:suggestedTeams
//                      })         
//                  }         
//                   }     
//                  helper.success(res,"Teams Found Successfully!",teamArr)
//              }
//              else{
//                  helper.not_found(res,"No Sports Found")
//              }                   
                              
             
//             }
//             else{ //if lat long is not present in token then
//                  console.log("no suggtn")
          
//                  let teamArr = [];
                
//                 let sports = await sportTable.find({},{updatedAt:0,createdAt:0,status:0}).sort({name:1})
//                  if(sports){        
//                      for(let sport of sports){
//                       sport.image = 'https://d1p9tkvgosm9mc.cloudfront.net/sports/'+sport.image
//                     let teams = await teamTable.find( { 'sports' :sport._id }, {updatedAt:0,createdAt:0,status:0,sports:0}).sort({name:1})                       
                                              
//                                teamArr.push({
//                                 sportID:sport,
//                                 teams:teams,
//                                 suggestedTeams:[]
                                
//                             })     
                        
//                      }     
//                     helper.success(res,"Teams Found Successfully!",teamArr)
//                 }
//                 else{
//                     helper.not_found(res,"No Sports Found")
//                 }                   
                 
//             }         

//         }else{
//           helper.not_found(res,"User Not Found")
//         }

//     }
// }
// catch(e){
//     helper.went_wrong(res,e)
// }

// }


exports.SelectedTeams = async(req,res)=>{
    try{

        let token=req.headers['authorization']
        if(token){
            var decoded = jwt.verify(token,config.LOG_SECRET_KEY );
            req.userData=decoded;
            let user =  await UserTable.findOne({'_id': req.userData._id})           
            if(user){
              
                console.log(req.userData)
                let userId = req.userData._id;
                if(req.body.teams){
         
                 let update = await UserTable.findByIdAndUpdate(
                     { _id: userId },
                     { $set: {teams:req.body.teams} }
                   );
                   if(update){
                      console.log("updated data"+update)
                    //   UserTable.findOne({'_id':userId },{password:0,createdAt:0,updatedAt:0,status:0},(err,updateData)=>{
                    //       if(err) {
                    //       helper.went_wrong(res,err)
                    //       }
                    //       else {                
                          helper.successWithnodata(res,"Teams Added Successfully!")
                    //       }
                    //   })
                   }else{
                      // console.log("dber")
                     helper.db_errorwithoutE(res)
                     }
         
         
                }
                else{
                 console.log("Please  Select Teams!")
                    helper.not_found(res,"Please Select Teams!")
                   
                }
            }else{
              helper.not_found(res,"User Not Found")
            }
        }
     else{
      helper.successWithnodata(res,"Teams Added Successfully!")
     }
       
    }
    catch(err){
        helper.went_wrong(res,err)
    }
}