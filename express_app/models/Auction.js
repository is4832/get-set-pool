const mongoose=require("mongoose");

const CurrentRideSchema=new mongoose.Schema({
   username:{type:String},
   to:{type:String},
   from:{type:String},
   status:{type:String},

   bids:[{
      value:{type:String},
      bidder:{type:String},
      vehicle:{type:String},
      vehicaleNo:{type:String}
   }],
   finalBidder:{type:String},
   finalValue:{type:String}
});

const CurrentRide=mongoose.model("CurentRide",CurrentRideSchema);
module.exports=CurrentRide;
