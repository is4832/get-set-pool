const ethCrypto=require('eth-crypto');
const fs=require("fs");
const HDwalletprovider=require("truffle-hdwallet-provider");
const Web3=require("web3");
const session=require("express-session");
var mongoose=require('mongoose');

const abi=require("../user_contract").abi2;
const address=require("../user_contract").address2;

// const cookie=require("cookie-parser");

//const abi=require("../family_tree_details").abi;
//const address=require("../family_tree_details").address;
//const byteCode=require("../family_tree_details").bytecode;
const createIdentity=require("./create_identity");
const Profiles = require('../models/Profiles');

require("dotenv").config();

module.exports=(app)=>{

    app.get("/signupr",(req,res)=>{
        if(req.session.username!== undefined){
            res.redirect("/homer");
        }
        else{
        res.render("signupr",{message:null});
        }
    });

    app.post("/signupr",async (req,res)=>{
        const name=req.body.name;
        const phno=req.body.phno;
        const username=req.body.email;
        const password=req.body.password;
        const userType = 'Rider';
        const vehicle="";
        const vehicleNo="";
        // Creating identity
        var identity=createIdentity();

        console.log(identity);
        const publicKey=identity.publicKey;
        const privateKey=identity.privateKey;
        const newCompressed=ethCrypto.publicKey.compress(
            publicKey
        );
        identity.compressed=newCompressed;

        const provider=new HDwalletprovider(
            "41362a4b6f3905e8b9a653620cdb4adbfad0e47b1061aa03d17d6208300eef9f",
            'https://ropsten.infura.io/v3/686f18f4f3144751bd5828b7155d0c55'
         );
 
        const web=new Web3(provider);
 
        console.log("provider set");
 
        const contract=new web.eth.Contract(abi,address);
        const response= await contract.methods.set(name,username,phno,vehicle,vehicleNo,userType,password,privateKey).send({
             from:"0x3c6b8c5a05FB705cE825D3C6336ebA0B60d381d7"   
        });



        req.session.username=username;
        req.session.privateKey=privateKey;
        req.session.userType=userType;
        
        res.redirect("/homer");
        
});

}