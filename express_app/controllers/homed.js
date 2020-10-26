const ethCrypto = require('eth-crypto');
const fs = require("fs");
const HDwalletprovider = require("truffle-hdwallet-provider");
const Web3 = require("web3");
const session = require("express-session");
const CurrentRide = require("../models/Auction");
const abi = require("../user_contract").abi2;
const address = require("../user_contract").address2;
const Tx = require('ethereumjs-tx').Transaction;


module.exports = (app) => {
    app.get("/homed", async (req, res) => {

        if (req.session.username !== undefined) {

            if (req.session.userType === "Driver") {
                const findExisting = await CurrentRide.find({ 'bids.bidder': req.session.username });
                console.log(findExisting);

                if (findExisting.length === 0) {
                    const checkFinal = await CurrentRide.find({ finalBidder: req.session.username });
                    if (checkFinal.length === 0) {
                        const allRecords = await CurrentRide.find({});
                        res.render("homed", { rides: allRecords });
                    } else {
                        res.redirect("/finald");
                    }

                } else {
                    const currentBid = findExisting[0];
                    let value;
                    for (var i = 0; i < currentBid.bids.length; i++) {
                        if (bidder = req.session.username) {
                            value = currentBid.bids[i].value;
                        }

                    }
                    res.render("dbid", { from: currentBid.from, to: currentBid.to, value: value, status: "pending" });
                }


            } else {
                res.render("homer", {});
            }
        } else {
            res.redirect("/");
        }

    });
    app.post("/homed", async (req, res) => {
        const customerUsername = req.body.username;
        const value = req.body.value;
        const coord = req.body.coordinates;
        const provider = new HDwalletprovider(
            "41362a4b6f3905e8b9a653620cdb4adbfad0e47b1061aa03d17d6208300eef9f",
            'https://ropsten.infura.io/v3/686f18f4f3144751bd5828b7155d0c55'
        );

        const web3 = new Web3(provider);

        console.log("provider set");
        console.log("I am here");
        console.log(req.body);

        const contract = new web3.eth.Contract(abi, address);

        const response = await contract.methods.get(req.session.username).call();
        console.log(value, response);
        const bid = {
            value: value,
            bidder: req.session.username,
            vehicle: response['2'],
            vehicaleNo: response['3'],
        }
        const insertValue = await CurrentRide.findOneAndUpdate({ username: customerUsername }, { Coordinates: coord, $push: { bids: bid } });
        console.log(insertValue);
        res.redirect("/homed");
    });


    app.get("/finald", async (req, res) => {
        if (req.session.username !== undefined) {

            const checkFinal = await CurrentRide.find({ finalBidder: req.session.username });
            const provider = new HDwalletprovider(
                "41362a4b6f3905e8b9a653620cdb4adbfad0e47b1061aa03d17d6208300eef9f",
                'https://ropsten.infura.io/v3/686f18f4f3144751bd5828b7155d0c55'
            );
            const web3 = new Web3(provider);
            const contract = new web3.eth.Contract(abi, address);

            const response = await contract.methods.get(checkFinal[0].username).call();
            console.log(response);
            const customer = {
                name: response['5'],
                phoneNumber: response['1'],
                to: checkFinal[0].to,
                from: checkFinal[0].from,
                value: checkFinal[0].finalValue,
                username: checkFinal[0].username
            }

            if (checkFinal[0].status === "MET") {
                res.render("finald", { result: customer, message: null });
            }
            else {
                res.render("finald", { result: customer, message: "done" });
            }
        } else {
            res.redirect("/");
        }

    });
    app.post("/finald", async (req, res) => {


        let web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/686f18f4f3144751bd5828b7155d0c55'));

        const sender_address = '0x3c6b8c5a05FB705cE825D3C6336ebA0B60d381d7';
        const sender_privateKey = '41362a4b6f3905e8b9a653620cdb4adbfad0e47b1061aa03d17d6208300eef9f';
        const reciever_address = '0x151bdE1cfec33Af0Ad19B296B3D0843621814eD3';
        var contract = new web3.eth.Contract(abi, address);
        var fare = req.body.value;

       const KyberNetworkProxy_ABI = [{"inputs":[{"internalType":"address","name":"_admin","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"}],"name":"AdminClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newAlerter","type":"address"},{"indexed":false,"internalType":"bool","name":"isAdd","type":"bool"}],"name":"AlerterAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"address","name":"sendTo","type":"address"}],"name":"EtherWithdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"trader","type":"address"},{"indexed":false,"internalType":"contract IERC20","name":"src","type":"address"},{"indexed":false,"internalType":"contract IERC20","name":"dest","type":"address"},{"indexed":false,"internalType":"address","name":"destAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"actualSrcAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"actualDestAmount","type":"uint256"},{"indexed":false,"internalType":"address","name":"platformWallet","type":"address"},{"indexed":false,"internalType":"uint256","name":"platformFeeBps","type":"uint256"}],"name":"ExecuteTrade","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"contract IKyberHint","name":"kyberHintHandler","type":"address"}],"name":"KyberHintHandlerSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"contract IKyberNetwork","name":"newKyberNetwork","type":"address"},{"indexed":false,"internalType":"contract IKyberNetwork","name":"previousKyberNetwork","type":"address"}],"name":"KyberNetworkSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newOperator","type":"address"},{"indexed":false,"internalType":"bool","name":"isAdd","type":"bool"}],"name":"OperatorAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"contract IERC20","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"address","name":"sendTo","type":"address"}],"name":"TokenWithdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"pendingAdmin","type":"address"}],"name":"TransferAdminPending","type":"event"},{"inputs":[{"internalType":"address","name":"newAlerter","type":"address"}],"name":"addAlerter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOperator","type":"address"}],"name":"addOperator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"enabled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAlerters","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract ERC20","name":"src","type":"address"},{"internalType":"contract ERC20","name":"dest","type":"address"},{"internalType":"uint256","name":"srcQty","type":"uint256"}],"name":"getExpectedRate","outputs":[{"internalType":"uint256","name":"expectedRate","type":"uint256"},{"internalType":"uint256","name":"worstRate","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"src","type":"address"},{"internalType":"contract IERC20","name":"dest","type":"address"},{"internalType":"uint256","name":"srcQty","type":"uint256"},{"internalType":"uint256","name":"platformFeeBps","type":"uint256"},{"internalType":"bytes","name":"hint","type":"bytes"}],"name":"getExpectedRateAfterFee","outputs":[{"internalType":"uint256","name":"expectedRate","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOperators","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"kyberHintHandler","outputs":[{"internalType":"contract IKyberHint","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"kyberNetwork","outputs":[{"internalType":"contract IKyberNetwork","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxGasPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"alerter","type":"address"}],"name":"removeAlerter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"}],"name":"removeOperator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IKyberHint","name":"_kyberHintHandler","type":"address"}],"name":"setHintHandler","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IKyberNetwork","name":"_kyberNetwork","type":"address"}],"name":"setKyberNetwork","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"token","type":"address"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"}],"name":"swapEtherToToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"token","type":"address"},{"internalType":"uint256","name":"srcAmount","type":"uint256"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"}],"name":"swapTokenToEther","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"src","type":"address"},{"internalType":"uint256","name":"srcAmount","type":"uint256"},{"internalType":"contract IERC20","name":"dest","type":"address"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"}],"name":"swapTokenToToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"src","type":"address"},{"internalType":"uint256","name":"srcAmount","type":"uint256"},{"internalType":"contract IERC20","name":"dest","type":"address"},{"internalType":"address payable","name":"destAddress","type":"address"},{"internalType":"uint256","name":"maxDestAmount","type":"uint256"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"},{"internalType":"address payable","name":"platformWallet","type":"address"}],"name":"trade","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"contract ERC20","name":"src","type":"address"},{"internalType":"uint256","name":"srcAmount","type":"uint256"},{"internalType":"contract ERC20","name":"dest","type":"address"},{"internalType":"address payable","name":"destAddress","type":"address"},{"internalType":"uint256","name":"maxDestAmount","type":"uint256"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"},{"internalType":"address payable","name":"walletId","type":"address"},{"internalType":"bytes","name":"hint","type":"bytes"}],"name":"tradeWithHint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"src","type":"address"},{"internalType":"uint256","name":"srcAmount","type":"uint256"},{"internalType":"contract IERC20","name":"dest","type":"address"},{"internalType":"address payable","name":"destAddress","type":"address"},{"internalType":"uint256","name":"maxDestAmount","type":"uint256"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"},{"internalType":"address payable","name":"platformWallet","type":"address"},{"internalType":"uint256","name":"platformFeeBps","type":"uint256"},{"internalType":"bytes","name":"hint","type":"bytes"}],"name":"tradeWithHintAndFee","outputs":[{"internalType":"uint256","name":"destAmount","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"newAdmin","type":"address"}],"name":"transferAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newAdmin","type":"address"}],"name":"transferAdminQuickly","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address payable","name":"sendTo","type":"address"}],"name":"withdrawEther","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"sendTo","type":"address"}],"name":"withdrawToken","outputs":[],"stateMutability":"nonpayable","type":"function"}]
       const KyberNetworkProxy_Address = '0xd719c34261e099Fdb33030ac8909d5788D3039C4';

       let KyberNetworkProxy = new web3.eth.Contract(KyberNetworkProxy_ABI,KyberNetworkProxy_Address);

       let SRC_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';  // ETH from https://developer.kyber.network/docs/Addresses-Ropsten/
       let SRC_AMT = '1';
       let SRC_QTY = web3.utils.toWei(SRC_AMT, 'ether');
       let DST_TOKEN_ADDRESS = '0xaD6D458402F60fD3Bd25163575031ACDce07538D'; // DAI from https://developer.kyber.network/docs/Addresses-Ropsten/

       let ERC20_ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"INITIAL_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_value","type":"uint256"}],"name":"burnFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_burner","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}];
       let DAI = new web3.eth.Contract(ERC20_ABI, DST_TOKEN_ADDRESS);

       web3.eth.getTransactionCount(sender_address).then((txnCount =>{

            KyberNetworkProxy.methods.getExpectedRate(SRC_TOKEN_ADDRESS, DST_TOKEN_ADDRESS, SRC_QTY).call((error, result)=>{
            if (!error){

                let minConversionRate = result.worstRate.toString();

                let rawTxn = {
                nonce: web3.utils.toHex(txnCount),
                from: sender_address,
                to: KyberNetworkProxy_Address,
                gas: web3.utils.toHex(2000000),
                gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei')),
                data: KyberNetworkProxy.methods.swapEtherToToken(
                    DST_TOKEN_ADDRESS,
                    minConversionRate
                ).encodeABI(),
                value: fare
            }

            var bufferPK = new Buffer.from(sender_privateKey, 'hex');
            var tx = new Tx(rawTxn,{chain:'ropsten'});
            tx.sign(bufferPK);
            var serializedTx = tx.serialize();

            web3.eth.sendSignedTransaction("0x" + serializedTx.toString('hex'), (_err, _res) => {
                if(_err){
                    console.error("ERROR: ", _err);
                } else {
                    console.log("[SWAP TXN] Success: ", _res);
                }
            })
            .on('error', console.error);

        }
        else {
            console.log(error);
        }
    });

    })).then(()=>{

    web3.eth.getTransactionCount(sender_address).then((txnCount => {

        let rawTxn = {
            nonce: web3.utils.toHex(txnCount+1),
            from: sender_address,
            to: DST_TOKEN_ADDRESS,
            gas: web3.utils.toHex(2000000),
            gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei')),
            data: DAI.methods.transfer(
                reciever_address,
                web3.utils.toWei(fare, 'wei')
            ).encodeABI()
        }


        var bufferPK = new Buffer.from(sender_privateKey, 'hex');
        var tx = new Tx(rawTxn, { chain: 'ropsten' });
        tx.sign(bufferPK);
        var serializedTx = tx.serialize();

        web3.eth.sendSignedTransaction("0x" + serializedTx.toString('hex'), async (_err, _res) => {
            if (_err) {
                console.error("ERROR: ", _err);
            } else {
                console.log("[TRANSFER TXN] Success: ", _res);
            }
        })
            .on('error', console.error);

    }));

});
        web3.eth.getTransactionCount(sender_address).then((txnCount => {

            //
            let rawTxn = {
                nonce: web3.utils.toHex(txnCount),
                from: sender_address,
                to: address,
                gas: web3.utils.toHex('2000000'),
                gasPrice: web3.utils.toHex(web3.utils.toWei('1', 'gwei')),
                data: contract.methods.setFinalBid(
                    req.session.username,
                    req.body.username,
                ).encodeABI()
            }


            var bufferPK = new Buffer.from(sender_privateKey, 'hex');
            var tx = new Tx(rawTxn, { chain: 'ropsten' });
            tx.sign(bufferPK);
            var serializedTx = tx.serialize();

            web3.eth.sendSignedTransaction("0x" + serializedTx.toString('hex'), async (_err, _res) => {
                if (_err) {
                    console.error("ERROR: ", _err);
                } else {
                    console.log("Success: ", _res);
                    const deleteAuction = await CurrentRide.findOneAndDelete({ username: req.body.username });
                    res.render("payed", { fare: fare, from: deleteAuction.from, to: deleteAuction.to });
                }
            })
                .on('error', console.error);

        }));
    });


}
