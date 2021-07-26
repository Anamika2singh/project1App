const express = require('express');
const app=express()
const mongoose = require('mongoose')
const helper = require('../helpers/response');
const {Validator} = require('node-input-validator');
const bcrypt= require('bcrypt');
const jwt = require('jsonwebtoken');

const sportTable = require('../models/sport');

exports.getSport = async(req,res)=>{
    try{
   let sports = await sportTable.find({},{updatedAt:0,createdAt:0,status:0}).sort({name:1})
   if(sports){
   console.log(sports)
     for(let sport of sports)
     {
         sport.image = 'https://d1p9tkvgosm9mc.cloudfront.net/sports/'+sport.image
     }
   helper.success(res,"Sports Found Successfully",sports)
   }
   else{
       console.log("no sports found")
       helper.not_found(res,"No Sports Found")
   }
}
catch(err){
    helper.went_wrong(res,err)
}
}