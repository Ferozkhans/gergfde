const mongoose = require('mongoose');
//const shortId = require('shortid');
const Shorturl = new mongoose.Schema( {
     urlCode: {
         type:String,
         required:true,
         unique:true},
    longUrl:{
        type:String,
        required:true
    },
    shortUrl:{
        type:String,
        required:true,
        unique:true,
       
    }
   
},{ timestamps: true });

  module.exports = mongoose.model('Url', Shorturl) 