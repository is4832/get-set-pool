const ethCrypto=require('eth-crypto');
const fs=require("fs");
const HDwalletprovider=require("truffle-hdwallet-provider");
const Web3=require("web3");
const session=require("express-session");
const CurrentRide=require("../models/Auction");
const abi=require("../user_contract").abi2;
const address=require("../user_contract").address2;
const Tx = require('ethereumjs-tx').Transaction;


module.exports=(app)=>{
    app.get("/homed",async (req,res)=>{
        
        if(req.session.username!==undefined){
            
            if(req.session.userType==="Driver"){
                const findExisting= await CurrentRide.find({'bids.bidder':req.session.username});
                console.log(findExisting);

                if(findExisting.length===0){
                    const checkFinal=await CurrentRide.find({finalBidder:req.session.username});
                    if(checkFinal.length===0){
                        const allRecords=await CurrentRide.find({});
                        res.render("homed",{rides:allRecords});
                    }else{
                        res.redirect("/finald");
                    }
                  
                }else{
                    const currentBid=findExisting[0];
                    let value;
                    for(var i=0;i<currentBid.bids.length;i++){
                        if(bidder=req.session.username){
                            value=currentBid.bids[i].value;
                        }

                    }
                    res.render("dbid",{from:currentBid.from,to:currentBid.to,value:value,status:"pending"});
                }

                
            }else{
                res.render("homer",{});
            }
        }else{
            res.redirect("/");
        }
        
    });
    app.post("/homed",async(req,res)=>{
        const customerUsername=req.body.username;
        const value=req.body.value;
        const provider=new HDwalletprovider(
            "41362a4b6f3905e8b9a653620cdb4adbfad0e47b1061aa03d17d6208300eef9f",
            'https://ropsten.infura.io/v3/686f18f4f3144751bd5828b7155d0c55'
         );
    
        const web3=new Web3(provider);
    
        console.log("provider set");
        console.log("I am here");
    
        const contract=new web3.eth.Contract(abi,address);
    
        const response=await contract.methods.get(req.session.username).call();
        console.log(value,response);
        const bid={
            value:value,
            bidder:req.session.username,
            vehicle:response['2'],
            vehicaleNo:response['3']
        }
        const insertValue=await CurrentRide.findOneAndUpdate({username:customerUsername},{$push:{bids:bid}});
        console.log(insertValue);
        res.redirect("/homed");
    });  


    app.get("/finald",async(req,res)=>{
        if(req.session.username!==undefined){
 
        const checkFinal=await CurrentRide.find({finalBidder:req.session.username});
        const provider=new HDwalletprovider(
            "41362a4b6f3905e8b9a653620cdb4adbfad0e47b1061aa03d17d6208300eef9f",
            'https://ropsten.infura.io/v3/686f18f4f3144751bd5828b7155d0c55'
         );
        const web3=new Web3(provider);            
        const contract=new web3.eth.Contract(abi,address);
        
        const response=await contract.methods.get(checkFinal[0].username).call();
        console.log(response);
        const customer={
            name:response['5'],
            phoneNumber:response['1'],
            to:checkFinal[0].to,
            from:checkFinal[0].from,
            value:checkFinal[0].finalValue,
            username:checkFinal[0].username
        }

        if(checkFinal[0].status==="MET"){
        res.render("finald",{result:customer,message:null});
        }
        else{
            res.render("finald",{result:customer,message:"done"});
        }}else{
            res.redirect("/");
        }

    });
    app.post("/finald",async(req,res)=>{
        
        const provider=new HDwalletprovider(
            "41362a4b6f3905e8b9a653620cdb4adbfad0e47b1061aa03d17d6208300eef9f",
            'https://ropsten.infura.io/v3/686f18f4f3144751bd5828b7155d0c55'
         );
        const web=new Web3(provider);            
        const contract=new web.eth.Contract(abi,address);
    
        const response=await contract.methods.get(req.body.username).call();
        console.log(response);

        var sender=response[0];
        var publicKeys= ethCrypto.publicKeyByPrivateKey(sender);
        //var addresss = ethCrypto.publicKey.toAddress(publicKeys);
        var addresss= "0x3c6b8c5a05FB705cE825D3C6336ebA0B60d381d7";
        console.log("sender",addresss);
        
        
        var receiver=req.session.privateKey;
        var publicKeyr = ethCrypto.publicKeyByPrivateKey(receiver);
        //var addressr = ethCrypto.publicKey.toAddress(publicKeyr);
        var addressr = "0x7Ed99FcCe0BE64c1519aBB90a2bB6CC75FEa8a3C";
        console.log("receiver",addressr);


        var fare=req.body.value;
        const testnet = 'https://ropsten.infura.io/v3/686f18f4f3144751bd5828b7155d0c55';

        const web3 = new Web3( new Web3.providers.HttpProvider(testnet) );

        web3.eth.defaultAccount = addresss;
        console.log( web3.utils.toWei(fare,"ether"),web3.utils.toHex(web3.utils.toWei(fare,"ether")));
        //signs trans

            const trans = await web3.eth.accounts.signTransaction({
            nonce : web3.eth.getTransactionCount(web3.eth.defaultAccount),
            to: addressr,
            value: web3.utils.toWei(fare,"ether"),
            gas: 2000000
            }, sender);        

            const rawTrans=trans['rawTransaction'];
            console.log(trans['rawTransaction']);
        //send sign transc

         var privateKey = new Buffer.from(sender.slice(2), 'hex');

        // var nonce = web3.eth.getTransactionCount(web3.eth.defaultAccount);
        // var rawTx = {
        //   nonce: nonce,
        //   gasPrice: 21000,
        //   gasLimit: '0x2710',
        //   to: receiver,
        //   value:  web3.utils.toHex(web3.utils.toWei(fare,"ether")),
        //   //data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057'
        // }

        //with raw Transaction
        var tx = new Tx(rawTrans,{ chain:'ropsten',hardfork: 'petersburg'});
        tx.sign(privateKey);
        
        var serializedTx = tx.serialize();
        
        console.log(serializedTx.toString('hex'),"serialized");
        // 0xf889808609184e72a00082271094000000000000000000000000000000000000000080a47f74657374320000000000000000000000000000000000000000000000000000006000571ca08a8bbf888cfa37bbf0bb965423625641fc956967b81d12e23709cead01446075a01ce999b56a8a88504be365442ea61239198e23d1fce7d00fcfc5cd3b44b7215f
        try{
            var payment= await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);
            
            contract.methods.setFinalBid(req.session.username,req.body.username).send({
                from:"0x3c6b8c5a05FB705cE825D3C6336ebA0B60d381d7"
            }).then((response)=>{
                console.log(response);
            });
            
            const deleteAuction = await CurrentRide.findOneAndDelete({username:req.body.username});
            
            res.render("payed",{fare:fare,from:deleteAuction.from,to:deleteAuction.to});
        }
        catch(err){
            console.log(err);
        }
    });

 
}