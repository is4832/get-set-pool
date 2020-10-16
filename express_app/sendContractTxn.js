const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
let web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/686f18f4f3144751bd5828b7155d0c55'));

const contract_abi= [{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"username","type":"string"},{"name":"phoneNumber","type":"string"},{"name":"vehicle","type":"string"},{"name":"vehicleNo","type":"string"},{"name":"category","type":"string"},{"name":"password","type":"string"},{"name":"key","type":"string"}],"name":"set","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"username","type":"string"}],"name":"get","outputs":[{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"rider","type":"string"}],"name":"getFinalBid","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"driver","type":"string"},{"name":"rider","type":"string"}],"name":"setFinalBid","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}];
const contract_address="0xe4beb9e6a630f7d7c15e77468fb8047b6a902938";
const sender_address = '0x3c6b8c5a05FB705cE825D3C6336ebA0B60d381d7';
const sender_privateKey = '41362a4b6f3905e8b9a653620cdb4adbfad0e47b1061aa03d17d6208300eef9f';
var contract = new web3.eth.Contract(contract_abi,contract_address);

web3.eth.getTransactionCount(sender_address).then((txnCount =>{

    let rawTxn = {
        nonce: web3.utils.toHex(txnCount),
        from: sender_address,
        to: contract_address,
        gas: web3.utils.toHex(2000000),
        gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei')),
        data: contract.methods.set(
            'Julius Caesar',
            'caesar',
            '911',
            'chariot',
            'cs101',
            '1',
            'pass',
            'key',
        ).encodeABI()
    }

    var bufferPK = new Buffer.from(sender_privateKey, 'hex');
    var tx = new Tx(rawTxn,{chain:'ropsten'});
    tx.sign(bufferPK);
    var serializedTx = tx.serialize();

    web3.eth.sendSignedTransaction("0x" + serializedTx.toString('hex'), (_err, _res) => {
        if(_err){
            console.error("ERROR: ", _err);
        } else {
            console.log("Success: ", _res);
        }
    })
    .on('error', console.error);

}));
