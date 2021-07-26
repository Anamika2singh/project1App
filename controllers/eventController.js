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
const eventTable = require('../models/event');
const { findOne, events } = require('../models/team');
const team = require('../models/team');
var empty = require('is-empty');
const event = require('../models/event');
exports.getEvents = async(req,res)=>{
    try{

        var page = (req.body.page)?parseInt(req.body.page):1;
        var resPerPage = 10;
      
      let skip = resPerPage * page - resPerPage;
        var where = {}
        var sortBy = {title:1}
     
        if(!empty(req.body.attendanceRequired) && req.body.attendanceRequired){
            where.attendanceRequired = req.body.attendanceRequired
        } 
        if(!empty(req.body.price) && req.body.price){
            where.type = req.body.price
        } 
        if(!empty(req.body.sports) && req.body.sports){
            // let sports = JSON.parse(req.body.sports)
            where.sports = { $in: req.body.sports }
        } 
         if((!empty(req.body.fromDate) && req.body.fromDate)&&(!empty(req.body.toDate) && req.body.toDate)){
             let fromDate = (req.body.fromDate)
             let toDate = (req.body.toDate)
            where.eventDate ={ $gte:fromDate, $lte:toDate}
        } 
        // console.log("to chk obj "+where)
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 1){
            sortBy = {popularity : -1}
        } 
        // if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 2){
        //     sortBy.popularity = 1
        // } 
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 3){
            sortBy = {price:1}
        } 
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 4){
            sortBy = {eventDate:1}
        } 

        let token=req.headers['authorization']
        if(token){
            var decoded = jwt.verify(token,config.LOG_SECRET_KEY );
            req.userData=decoded;
            let user =  await UserTable.findOne({'_id': req.userData._id})           
            if(user){

                console.log(req.userData._id)
                let teamArr = [];
                let teams = user.teams;
                let favs = user.favEvents;
                console.log("favs arr"+favs)
                if(teams){ 
                for(let team of teams){
                let events = await eventTable.find( { $and: [where, { teams : { $elemMatch: { $eq :team } } } ] }, {updatedAt:0,createdAt:0,status:0},{sort:sortBy,limit:resPerPage, skip:skip})    
                        console.log("all evs"+events)
                          let newEvents = []
                        for(let event of events){
                            let tmpEvent = {}
                            tmpEvent.type = event.type
                            tmpEvent.url = event.url
                            tmpEvent.price = event.price
                            tmpEvent.teams = event.teams
                            tmpEvent.sports = event.sports
                            tmpEvent.popularity = event.popularity
                            tmpEvent.attendanceRequired= event.attendanceRequired
                            tmpEvent.image= 'https://d1p9tkvgosm9mc.cloudfront.net/events/'+event.image
                            tmpEvent.title = event.title
                            tmpEvent.subTitle = event.subTitle
                            tmpEvent.description = event.description
                            tmpEvent.address = event.address
                            tmpEvent.eventDate = event.eventDate
                            tmpEvent.eventSharableUrl = event.eventSharableUrl
                            tmpEvent.lat = event.lat
                            tmpEvent.long = event.long
                            tmpEvent._id = event._id
                        if(favs.includes(ObjectId(event._id))){
                            tmpEvent.fav = 1
                          
                        }
                         else{
                            tmpEvent.fav = 0
                           
                         }
                         newEvents.push(tmpEvent)
                        }
                        let teamDetail = await teamTable.findOne({'_id':team})
                        console.log(teamDetail)     
                       if(teamDetail)       {            
                       teamArr.push({
                        teamID:team,
                        teamName :teamDetail.name,
                        colorCode : teamDetail.colorCode,
                       events: newEvents
                        })        
                       }
                
      
}
        
//  res.send(teamArr)
 helper.success(res,"Events Found Successfully!",teamArr)
  }
else{
console.log("No teams Found")
helper.not_found(res,"No Teams Found")
}

            }else{
              helper.not_found(res,"User Not Found")
            }

        }



else{
        
        // console.log(req.userData._id)
        let teamArr = [];
        let teams = req.body.teams;
        if(teams){ 
        for(let team of teams){
        let events = await eventTable.find( { $and: [where, { teams : { $elemMatch: { $eq :team } } } ] }, {updatedAt:0,createdAt:0,status:0},{sort:sortBy,limit:resPerPage, skip:skip})
                console.log(events)


                let newEvents = []
                for(let event of events){
                    let tmpEvent = {}
                    tmpEvent.type = event.type
                    tmpEvent.url = event.url
                    tmpEvent.price = event.price
                    tmpEvent.teams = event.teams
                    tmpEvent.sports = event.sports
                    tmpEvent.popularity = event.popularity
                    tmpEvent.attendanceRequired= event.attendanceRequired
                    tmpEvent.image= 'https://d1p9tkvgosm9mc.cloudfront.net/events/'+event.image
                    tmpEvent.title = event.title
                    tmpEvent.subTitle = event.subTitle
                    tmpEvent.description = event.description
                    tmpEvent.address = event.address
                    tmpEvent.eventDate = event.eventDate
                    tmpEvent.eventSharableUrl = event.eventSharableUrl
                    tmpEvent.lat = event.lat
                    tmpEvent.long = event.long
                    tmpEvent._id = event._id
                    tmpEvent.fav = 0
                   
                 newEvents.push(tmpEvent)
                }

                let teamDetail = await teamTable.findOne({'_id':team})
                 
             if(teamDetail) {     
               teamArr.push({
                teamID:team,
                teamName :teamDetail.name,
                colorCode : teamDetail.colorCode,
               events:newEvents
                })        
            }
}

//  res.send(teamArr)
helper.success(res,"Events Found Successfully!",teamArr)
}
else{
console.log("No teams Found")
helper.not_found(res,"No Teams Found")
}
    }
}
    catch(err){
        helper.went_wrong(res,err)
    }
}

exports.favouriteEvent = async(req,res)=>{
    try{
        const v = new Validator(req.body,{
            type:'required|integer',
            eventID:'required',
           
         })
         const matched = await v.check();
         let type=v.errors.type?v.errors.type.message:'' 
         let eventID=v.errors.eventID?v.errors.eventID.message:''
        if(!matched){
              let err=type+eventID
           helper.validation_error(res,err)
        }
         else{
    let userId = req.userData._id
   let checkType= parseInt(req.body.type) // 0 for unfavourite and 1 for favourite
   if(checkType){ //if event is favourite

    //   console.log(req.userData)
    let favs =  req.userData.favEvents
    let eventID = req.body.eventID
    // let favsArr =   favs.push(eventID)
    // console.log(favsArr)
      
      let update = await UserTable.findByIdAndUpdate(
        { _id: userId },
        { $addToSet: {favEvents:eventID} }
      );

      if(update){
       
         UserTable.findOne({'_id':userId },{password:0,createdAt:0,updatedAt:0,status:0},(err,updateData)=>{
             if(err) {
             helper.went_wrong(res,err)
             }
             else {                
             helper.success(res,"Successfully set Favourite Event",updateData)
             }
         })
      }else{
         // console.log("dber")
        helper.db_errorwithoutE(res)
        }
     let popularity = await eventTable.findByIdAndUpdate(
        { _id: eventID },
        { $inc: { popularity: 10} }
      );
   }
   else{ //if event is unfavourite             
   
          let updatedData = await UserTable.updateOne(
            { _id: userId },
            { $pull: { favEvents : req.body.eventID  } }
          );
          console.log(updatedData)
          if(updatedData){
           
             UserTable.findOne({'_id':userId },{password:0,createdAt:0,updatedAt:0,status:0},(err,updateData)=>{
                 if(err) {
                 helper.went_wrong(res,err)
                 }
                 else {                
                 helper.success(res,"Successfully set Unfavourite",updateData)
                 }
             })
          }else{
             // console.log("dber")
            helper.db_errorwithoutE(res)
            }
            let popularity = await eventTable.findByIdAndUpdate(
        { _id: eventID },
        { $inc: { popularity: -5} }
      );
        
   }


   
}
    }
catch(err){
    helper.went_wrong(res,err)
}
}

exports.popularity = async(req,res)=>{
    try{
        const v = new Validator(req.body,{
            type:'required|integer',
            eventID:'required',
           
         })
         const matched = await v.check();
         let type=v.errors.type?v.errors.type.message:'' 
         let eventID=v.errors.eventID?v.errors.eventID.message:''
        if(!matched){
              let err=type+eventID
           helper.validation_error(res,err)
        }
         else{
   let checkType= parseInt(req.body.type) // 0 for unfavourite and 1 for favourite
   let eventID = req.body.eventID
   if(checkType == 1){ //if event is favourite
    
      let popularity = await eventTable.findByIdAndUpdate(
        { _id: eventID },
        { $inc: { popularity: 10} }
      );

      if(popularity){                   
             helper.successWithnodata(res,"Successfully Popularity Increased.")
      }else{
              helper.db_errorwithoutE(res)
        }
     
   }
   else if(checkType == 2){ //if event is unfavourite             
   
          let popularity = await eventTable.findByIdAndUpdate(
        { _id: eventID },
        { $inc: { popularity: -5} }
      );
          if(popularity){               
                 helper.successWithnodata(res,"Successfully Popularity Decreased")
          }else{
            helper.db_errorwithoutE(res)
            }
            
        
   }else { //if type is view             
   
          let popularity = await eventTable.findByIdAndUpdate(
        { _id: eventID },
        { $inc: { popularity: 5} }
      );
          if(popularity){               
                 helper.successWithnodata(res,"Successfully Popularity Increased")
          }else{
            helper.db_errorwithoutE(res)
            }
            
        
   }
}
    }
catch(err){
    helper.went_wrong(res,err)
}
}

exports.localEvents = async(req,res)=>{
    try{
       var page = (req.body.page)?parseInt(req.body.page):1;
        var resPerPage = 200;
      
      let skip = resPerPage * page - resPerPage;
        var where = {}
        var sortBy = {title:1}
     
        if(!empty(req.body.attendanceRequired) && req.body.attendanceRequired){
            where.attendanceRequired = req.body.attendanceRequired
        } 
        if(!empty(req.body.price) && req.body.price){
            where.type = req.body.price
        } 
        if(!empty(req.body.sports) && req.body.sports){
            // let sports = JSON.parse(req.body.sports)
            where.sports = { $in: req.body.sports }
        } 
         if((!empty(req.body.fromDate) && req.body.fromDate)&&(!empty(req.body.toDate) && req.body.toDate)){
             let fromDate = (req.body.fromDate)
             let toDate = (req.body.toDate)
            where.eventDate ={ $gte:fromDate, $lte:toDate}
        } 
        // console.log("to chk obj "+where)
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 1){
            sortBy = {popularity : -1}
        } 
        // if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 2){
        //     sortBy.popularity = 1
        // } 
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 3){
            sortBy = {price:1}
        } 
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 4){
            sortBy = {eventDate:1}
        } 
        let token=req.headers['authorization']
        if(!token){

            var userLat = req.body.lat
            var userLong = req.body.long
          
            if(!empty(userLat,userLong)){

                if(req.body.suggestedDistance){
                   
                    var suggestedDistance = req.body.suggestedDistance;
                    // console.log(suggestedDistance)
                    if(!empty(req.body.distance) && req.body.distance){
                        suggestedDistance = req.body.distance;
                    }
                }
                else{
                    suggestedDistance = 50;
                    if(!empty(req.body.distance) && req.body.distance){
                        suggestedDistance = req.body.distance;
                    }

                }
                let eventArr = [];
                let teams = await  teamTable.find({},{updatedAt:0,createdAt:0,status:0},{sort:{name:1},limit:resPerPage, skip:skip})
                
                if(teams){ 
                    for(let team of teams){
                            var lat1 = team.lat; 
                            var long1 =team.long;
                            var lat2 = userLat;
                            var long2 = userLong;
                            let distance =  utility.calcDistance(lat1, long1, lat2, long2)
                                
                            var milesDistance  =    distance * 0.62137;

                            if(milesDistance <= suggestedDistance){
                                
                                let events = await eventTable.find( { $and: [where, { teams : { $elemMatch: { $eq :team } } } ] }, {updatedAt:0,createdAt:0,status:0},{sort:sortBy})
                                 // console.log(milesDistance,team.name);  
                                if(events.length>0)
                            {      
                                // let rangeEvents = [];  
                                let newEvents = []     
                    for(let event of events) {          
                        
                            let tmpEvent = {}
                            tmpEvent.type = event.type
                            tmpEvent.url = event.url
                            tmpEvent.price = event.price
                            tmpEvent.teams = event.teams
                            tmpEvent.sports = event.sports
                            tmpEvent.popularity = event.popularity
                            tmpEvent.attendanceRequired= event.attendanceRequired
                            tmpEvent.image= 'https://d1p9tkvgosm9mc.cloudfront.net/events/'+event.image
                            tmpEvent.title = event.title
                            tmpEvent.subTitle = event.subTitle
                            tmpEvent.description = event.description
                            tmpEvent.address = event.address
                            tmpEvent.eventDate = event.eventDate
                            tmpEvent.eventSharableUrl = event.eventSharableUrl
                            tmpEvent.lat = event.lat
                            tmpEvent.long = event.long
                            tmpEvent._id = event._id                      
                            tmpEvent.fav = 0
                          
                         
                         newEvents.push(tmpEvent)
        
                                  };
                                     if(newEvents.length>0){
                                  eventArr.push({
                                   teamID:team,                                
                                   rangeEvents:newEvents
                                   
                               })
                            }
                       }
                            }
                    
           }
            helper.success(res,"Events Found Successfully!",eventArr)
            }
            else{
            helper.not_found(res,"No Teams Found")
            }

            }
           else{
              helper.not_found(res,'Please Add Lat and Long ')
           }

          
        }else{
            var decoded = jwt.verify(token,config.LOG_SECRET_KEY );
            req.userData=decoded;
            let user =  await UserTable.findOne({'_id': req.userData._id})           
            if(user){
                if(!empty(user.lat) && !empty(user.long) && user.lat != "0.0" && user.long != "0.0")
                {
                  var userLat = user.lat
                  var userLong =user.long
                }else{
                  var userLat = req.body.lat
                 var userLong = req.body.long
                }
                
                var favs = user.favEvents;
                if(!empty(userLat,userLong)){

                if(req.body.suggestedDistance){
                   
                    var suggestedDistance = req.body.suggestedDistance;
                    // console.log(suggestedDistance)
                    if(!empty(req.body.distance) && req.body.distance){
                        suggestedDistance = req.body.distance;
                    }
                }
                else{
                    suggestedDistance = 50;
                    if(!empty(req.body.distance) && req.body.distance){
                        suggestedDistance = req.body.distance;
                    }

                }
                let eventArr = [];
                let teams = await  teamTable.find({},{updatedAt:0,createdAt:0,status:0},{sort:{name:1},limit:resPerPage, skip:skip})
                if(teams){ 
                    for(let team of teams){
                            var lat1 = team.lat; 
                            var long1 =team.long;
                            var lat2 = userLat;
                            var long2 = userLong;
                            // console.log(lat2.long2)
                            let distance =  utility.calcDistance(lat1, long1, lat2, long2)
                                
                            var milesDistance  =    distance * 0.62137;
                            if(milesDistance <= suggestedDistance){
                                let events = await eventTable.find( { $and: [where, { teams : { $elemMatch: { $eq :team } } } ] }, {updatedAt:0,createdAt:0,status:0},{sort:sortBy})
                                if(events.length>0)
                            {         
                                // let rangeEvents = [];  
                                let newEvents = []     
                    for(let event of events) {          
                        
                            let tmpEvent = {}
                            tmpEvent.type = event.type
                            tmpEvent.url = event.url
                            tmpEvent.price = event.price
                            tmpEvent.teams = event.teams
                            tmpEvent.sports = event.sports
                            tmpEvent.popularity = event.popularity
                            tmpEvent.attendanceRequired= event.attendanceRequired
                            tmpEvent.image= 'https://d1p9tkvgosm9mc.cloudfront.net/events/'+event.image
                            tmpEvent.title = event.title
                            tmpEvent.subTitle = event.subTitle
                            tmpEvent.description = event.description
                            tmpEvent.address = event.address
                            tmpEvent.eventDate = event.eventDate
                            tmpEvent.eventSharableUrl = event.eventSharableUrl
                            tmpEvent.lat = event.lat
                            tmpEvent.long = event.long
                            tmpEvent._id = event._id  
                            // console.log(favs.includes(ObjectId(event._id)))                    
                            if(favs.includes(ObjectId(event._id))){
                            tmpEvent.fav = 1
                          
                        }
                         else{
                            tmpEvent.fav = 0
                           
                         }
                          
                         
                         newEvents.push(tmpEvent)
        
                                  };
                                     if(newEvents.length>0){
                                  eventArr.push({
                                   teamID:team,                                
                                   rangeEvents:newEvents
                                   
                               })
                            }
                       }
                            }
                    
           }
            helper.success(res,"Events Found Successfully!",eventArr)
            }
            else{
            helper.not_found(res,"No Teams Found")
            }

            }
       else{
        helper.not_found(res,'Please Add Lat and Long ')
            }
        }else{
              helper.not_found(res,"User Not Found")
            }
        }
}
catch(err){
    helper.went_wrong(res,err)
}

}

exports.exploreEvents = async(req,res)=>{
try{
    var page = (req.body.page)?parseInt(req.body.page):1;
        var resPerPage = 200;
      
      let skip = resPerPage * page - resPerPage;
        var where = {}
        var sortBy = {title:1}
     
        if(!empty(req.body.attendanceRequired) && req.body.attendanceRequired){
            where.attendanceRequired = req.body.attendanceRequired
        } 
        if(!empty(req.body.price) && req.body.price){
            where.type = req.body.price
        } 
        if(!empty(req.body.sports) && req.body.sports){
            // let sports = JSON.parse(req.body.sports)
            where.sports = { $in: req.body.sports }
        } 
         if((!empty(req.body.fromDate) && req.body.fromDate)&&(!empty(req.body.toDate) && req.body.toDate)){
             let fromDate = (req.body.fromDate)
             let toDate = (req.body.toDate)
            where.eventDate ={ $gte:fromDate, $lte:toDate}
        } 
        // console.log("to chk obj "+where)
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 1){
            sortBy = {popularity : -1}
        } 
        // if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 2){
        //     sortBy.popularity = 1
        // } 
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 3){
            sortBy = {price:1}
        } 
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 4){
            sortBy = {eventDate:1}
        } 

    let token=req.headers['authorization']
    if(token){
    //     helper.duplicate(res,'Token is Empty Please Add Token in Header')
    // }else{
        var decoded = jwt.verify(token,config.LOG_SECRET_KEY );
        req.userData=decoded;
        let user =  await UserTable.findOne({'_id': req.userData._id})           
        if(user){
         
            let favs = user.favEvents;
            if(req.body.city){
                var city = req.body.city
            }
            else{
                city =''
            }
             
//               var teamsTmp = await teamTable.aggregate([
//    {
//       $lookup: {
//         from: 'events',
//         'let': {teamId : '$_id' },
//         pipeline: [
//           {
//             $match:{
//               $expr:{
//                   $and:[
//                        {$or: [{
//                   "$regexMatch": {
//                     "input": "$address",
//                     "regex": "mohali",
//                     "options": "i"
//                   }
//                 },{
//                   "$regexMatch": {
//                     "input": "$city",
//                     "regex": "mohali",
//                     "options": "i"
//                   }
//                 },{
//                   "$regexMatch": {
//                     "input": "$state",
//                     "regex": "mohali",
//                     "options": "i"
//                   }
//                 },{
//                   "$regexMatch": {
//                     "input": "$country",
//                     "regex": "mohali",
//                     "options": "i"
//                   }
//                 }]} ,
//                        {$in : ['$$teamId',"$teams"] }
//                        ]
//             } 
//               }
                        
//       },{$addFields: { image: { $concat: ["https://d1p9tkvgosm9mc.cloudfront.net/events/", "$image"] } }},
//          {
//       $lookup: {
//         from: "users",
//         'let': {currentLoggedUser : user._id, eventId: "$_id" },
//         pipeline: [
//           {
//             $match:{
//               $expr:{
//             $and : [
//                {$eq:["$_id","$$currentLoggedUser"] },
//                 { $in : ["$$eventId","$favEvents"] } 
//             ]
//           }
//       }
//           }
//        ],
//         as: "result"
//       }
//     },
//     {
//      $addFields:{
//       "fav": {
//           $cond: { if: {
//               $gt: [{$size: "$result"}, 0] },
//            then: "1",
//            else: "0"
//      }     
//     }
//   }
//   }
//        ],
//         as: 'events'
//       }
// },
// {
//     $match:{ events: { $exists: true, $not: {$size: 0} }}
// },
//     {
//         $project:{
//             "events.result": 0,
//         }
//     }
//     ])


// console.log("teamsTmp",teamsTmp)


             let eventArr = [];
             let teams = await  teamTable.find({$or: [{address:{'$regex' : city, '$options' : 'i'}}, {city:{'$regex' : city, '$options' : 'i'}},{country:{'$regex' : city, '$options' : 'i'}} ]},{updatedAt:0,createdAt:0,status:0},{sort:{name:1},limit:resPerPage,skip:skip})
             if(teams){ 
                 for(let team of teams){
               
                  let events = await eventTable.find( 
                     { $and: [where, { teams : { $elemMatch: { $eq :team } } } ] }, {updatedAt:0,createdAt:0,status:0},{sort:sortBy})
                       
                    
                   let newEvents = []

                for(let event of events){
                    let tmpEvent = {}
                    tmpEvent.type = event.type
                    tmpEvent.url = event.url
                    tmpEvent.price = event.price
                    tmpEvent.teams = event.teams
                    tmpEvent.sports = event.sports
                    tmpEvent.popularity = event.popularity
                    tmpEvent.attendanceRequired= event.attendanceRequired
                    tmpEvent.image= 'https://d1p9tkvgosm9mc.cloudfront.net/events/'+event.image
                    tmpEvent.title = event.title
                    tmpEvent.subTitle = event.subTitle
                    tmpEvent.description = event.description
                    tmpEvent.address = event.address
                    tmpEvent.eventDate = event.eventDate
                    tmpEvent.eventSharableUrl = event.eventSharableUrl
                    tmpEvent.lat = event.lat
                    tmpEvent.long = event.long
                    tmpEvent._id = event._id
                if(favs.includes(ObjectId(event._id))){
                    tmpEvent.fav = 1
                  
                }
                 else{
                    tmpEvent.fav = 0
                   
                 }
                 newEvents.push(tmpEvent)
                }
                                  
                eventArr.push({
                teamID:team,
               events: newEvents
                })        

         
         }
         // console.log(eventArr)
         
         helper.success(res,"Events Found Successfully!",eventArr)
         }
         else{
         console.log("No teams Found")
         helper.not_found(res,"No Teams Found")
         }
         

        }else{
          helper.not_found(res,"User Not Found")
        }

    }
    else{ // if user not a loggedIn user

        if(req.body.city){
            var city = req.body.city
        }
        else{
            city =''
        }
//         var teamsTmp = await teamTable.aggregate([
//    { $match: {$or: [{address:{'$regex' : city, '$options' : 'i'}}, {city:{'$regex' : city, '$options' : 'i'}},{country:{'$regex' : city, '$options' : 'i'}} ]} },
//  {
//       $lookup: {
//         from: 'events',
//         'let': {teamId : '$_id' },
//         pipeline: [
//           {
//             $match:{
//               $expr:{
//               $in : ['$$teamId',"$teams"] 
//             } 
//               },{
//               $project:{
//                  image: {$concat: [  "https://d1p9tkvgosm9mc.cloudfront.net/events/", "$image" ]}
//               } 
//               }         
//       }
//        ],
//         as: 'events'
//       }
// },
//  { "$unwind": {
//             "path": "$result",
//             "preserveNullAndEmptyArrays": true
// } },
//    {
//       $lookup: {
//         from: "users",
//         'let': {currentLoggedUser : ObjectId("6054768916bb8d282c6cfd58"), eventId: "$result._id" },
//         pipeline: [
//           {
//             $match:{
//               $expr:{
//             $and : [
//                {$eq:["$_id","$$currentLoggedUser"] },
//                 { $in : ["$$eventId","$favEvents"] } 
//             ]
//           }
//       }
//           }
//        ],
//         as: "result"
//       }
//     },
//     {
//      $addFields:{
//       "events.fav": {
//           $cond: { if: {
//               $gt: [{$size: "$result2"}, 0] },
//            then: 1,
//            else: 0
//      } 
       
//     }
//   }
//     },
//       {
//      $addFields:{
//       "result.image":  { $concat: [  "https://d1p9tkvgosm9mc.cloudfront.net/events/", "$result.image" ] }
//     }
//       },
    
//     {
//         $project:{
//             result: 0
//         }
//     }
// ])


// console.log("teamsTmp",teamsTmp)
        let eventArr = [];
        let teams = await  teamTable.find({$or: [{address:{'$regex' : city, '$options' : 'i'}}, {city:{'$regex' : city, '$options' : 'i'}},{country:{'$regex' : city, '$options' : 'i'}} ]},{updatedAt:0,createdAt:0,status:0},{sort:{name:1},limit:resPerPage,skip:skip})
        console.log("dcdsbcn",teams)
        if(teams){ 
            for(let team of teams){

                let events = await eventTable.find( 
                     { $and: [where, { teams : { $elemMatch: { $eq :team } } } ] }, {updatedAt:0,createdAt:0,status:0},{sort:sortBy})
                      

                 let newEvents = []
                 for(let event of events){
                     let tmpEvent = {}

                     tmpEvent.type = event.type
                     tmpEvent.url = event.url
                     tmpEvent.price = event.price
                     tmpEvent.teams = event.teams
                     tmpEvent.sports = event.sports
                     tmpEvent.popularity = event.popularity
                     tmpEvent.attendanceRequired= event.attendanceRequired
                     tmpEvent.image= 'https://d1p9tkvgosm9mc.cloudfront.net/events/'+event.image
                     tmpEvent.title = event.title
                     tmpEvent.subTitle = event.subTitle
                     tmpEvent.description = event.description
                     tmpEvent.address = event.address
                     tmpEvent.eventDate = event.eventDate
                     tmpEvent.eventSharableUrl = event.eventSharableUrl
                     tmpEvent.lat = event.lat
                     tmpEvent.long = event.long
                     tmpEvent._id = event._id
                     tmpEvent.fav = 0   
                
                  newEvents.push(tmpEvent)
                 }
                                   
                 eventArr.push({
                 teamID:team,
                events: newEvents
                 })        
 
                              
    }
   
    helper.success(res,"Events Found Successfully!",eventArr)
    }
    else{
    console.log("No teams Found")
    helper.not_found(res,"No Teams Found")
    }





    }
}

catch(err){
    helper.went_wrong(res,err)
}
}
exports.favouriteListing = async(req,res)=>{
try{
    var page = (req.body.page)?parseInt(req.body.page):1;
        var resPerPage = 200;
      
      let skip = resPerPage * page - resPerPage;
        var where = {}
        var sortBy = {title:1}
     
        if(!empty(req.body.attendanceRequired) && req.body.attendanceRequired){
            where.attendanceRequired = req.body.attendanceRequired
        } 
        if(!empty(req.body.price) && req.body.price){
            where.type = req.body.price
        } 
        if(!empty(req.body.sports) && req.body.sports){
            // let sports = JSON.parse(req.body.sports)
            where.sports = { $in: req.body.sports }
        } 
         if((!empty(req.body.fromDate) && req.body.fromDate)&&(!empty(req.body.toDate) && req.body.toDate)){
             let fromDate = (req.body.fromDate)
             let toDate = (req.body.toDate)
            where.eventDate ={ $gte:fromDate, $lte:toDate}
        } 
        // console.log("to chk obj "+where)
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 1){
            sortBy = {popularity : -1}
        } 
        // if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 2){
        //     sortBy.popularity = 1
        // } 
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 3){
            sortBy = {price:1}
        } 
        if(!empty(req.body.sortBy) && req.body.sortBy && req.body.sortBy == 4){
            sortBy = {eventDate:1}
        } 


    let token=req.headers['authorization']
    if(token){
        // helper.duplicate(res,'Token is Empty Please Add Token in Header')
   
        var decoded = jwt.verify(token,config.LOG_SECRET_KEY );
        req.userData=decoded;
        // let user =  await UserTable.findOne({'_id': req.userData._id})           
        // if(user){
            console.log(req.userData._id)
            let user = await UserTable.findOne({'_id':req.userData._id})
            let favs =[]
           let eventArr = []
              if(user){
                console.log(user.favEvents)
                favs = user.favEvents
                   
                         let eventDetail = await eventTable.find( {$and:[{ '_id' : { $in: favs } },where]},{updatedAt:0,createdAt:0,status:0},{sort:sortBy})
                         console.log(eventDetail)
                     if(eventDetail){
        
                        for(let event of eventDetail){
                            event.image = 'https://d1p9tkvgosm9mc.cloudfront.net/events/'+event.image
                               eventArr.push(event)
                        }                  
                      helper.success(res,"SuccessFully Found Favourite Listing",eventArr)
                     }
                     else{
                         helper.not_found(res,"No Events to Show")
                     }
                    
              }
            else{
        
        helper.not_found(res,"User not Found!")
            }
        
        // }else{
        //   helper.not_found(res,"User Not Found")
        // }

    }
    else{

        let favs =[]
        let eventArr = []
        favs = req.body.favs
           if(favs){
        
                      let eventDetail = await eventTable.find( { '_id' : { $in: favs } })
                      console.log(eventDetail)
                  if(eventDetail){
     
                     for(let event of eventDetail){
                         event.image = 'https://d1p9tkvgosm9mc.cloudfront.net/events/'+event.image
                            eventArr.push(event)
                     }                  
                   helper.success(res,"SuccessFully Found Favourite Listing",eventArr)
                  }
                  else{
                      helper.not_found(res,"No Events to Show")
                  }
                 
           }
         else{
     
     helper.not_found(res,"Favs Events Not Found!")
    
         }
     


    }


}
catch(err){
    helper.went_wrong(res,err)
}

}
