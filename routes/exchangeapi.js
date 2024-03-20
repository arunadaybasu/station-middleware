var express = require('express');
var router = express.Router();
const axios = require('axios');
var moment = require('moment');
const nodeCron = require('node-cron');
const { Coins, LCDClient } = require('@terra-money/terra.js');

const fcdURLPublicNode = 'https://terra-classic-fcd.publicnode.com/';
const lcdURLPublicNode = 'https://terra-classic-lcd.publicnode.com/';
const fcdURLRebels = 'https://fcd.terrarebels.net/';

var res1 = "exchange api endpoint working";
var pswd_valid = 0;
let response = null;

const { MongoClient } = require('mongodb');
// Connection URL
const dbUrl = 'mongodb://localhost:27017';
const dbClient = new MongoClient(dbUrl);
// Database Name
const dbName = 'station_classic_main';
dbClient.connect();
console.log('Connected to MongoDB Server -- station_classic_main');
const db = dbClient.db(dbName);

// Local Mongodb Collections
const collection_creds = db.collection('credentials');
const collection_currencies = db.collection('currencies');
const collection_pairs = db.collection('pairs');

// const lcd = new LCDClient({
//   URL: lcdURLPublicNode,
//   chainID: "columbus-5"
// });
// console.log(lcd);

const burn_account_main = 'terra1sk06e3dyexuq4shw77y3dsv480xv42mq73anxu';
const self_account_main = 'terra1lg85ytn3l78cxkuvh66tvscj2zxnvq55gnvgra';
const self_account_alt = 'terra1v52g84784ja58g0wkcs0wf8r6qs0q0s4jlqwp8';

const baseUrlChangeNow = 'https://api.changenow.io/';


router.get('/', function(req, res, next) {
  
  res.send(res1)

});

async function check_pwd(usrnm, pswd) {

  await dbCclient.connect();
  console.log('Checking Username Password.....');
  const db = dbCclient.db(dbName);
  const collection_csupply = db.collection('credentials');
  const filteredDocs1 = await collection_csupply.find({"username" : usrnm}).toArray();
  const filteredDocs2 = await collection_csupply.find({"password" : pswd}).toArray();

  console.log(filteredDocs1.length);
  console.log(filteredDocs2.length);

  if (filteredDocs1.length == 1 && filteredDocs2.length == 1)
    pswd_valid = 1;
  else
    pswd_valid = 0;

}

async function get_checknow_apikey() {

  const filteredDocs1 = await collection_creds.find({"type" : "changenow"}).toArray();
  return filteredDocs1[0].apiKey;

}

router.get('/changenow/currencies', async function(req, res, next) {

  var json = {
    "status": 200,
    "timestamp": moment().format()
  };

  var config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: baseUrlChangeNow + 'v2/exchange/currencies?active=&flow=standard&buy=&sell=',
    headers: { }
  };

  filteredDocs1 = await collection_currencies.find().sort({"timestamp": -1}).limit(1).toArray();
  if (filteredDocs1.length == 1) {
    json = {
      "status": 200,
      "result": filteredDocs1[0].result,
      "timestamp": moment().format()
    };
  }
  else {
    await axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      json = {
        "status": 200,
        "result": response.data,
        "timestamp": moment().format()
      };
    })
    .catch(function (error) {
      console.log(error);
      json = {
        "status": 400,
        "error": error,
        "timestamp": moment().format()
      };
    });

    // await collection_currencies.deleteMany({});
    insertResult1 = await collection_currencies.insertOne(json);
    console.log(insertResult1);
  }

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/changenow/pairs-for', async function(req, res, next) {

  var json = {
    "status": 200,
    "timestamp": moment().format()
  };
  const ticker = req.query.ticker;
  console.log(ticker);
  var config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: baseUrlChangeNow + 'v1/currencies-to/' + ticker,
    headers: { }
  };

  filteredDocs1 = await collection_pairs.find({"pairsFor": ticker}).sort({"timestamp": -1}).limit(1).toArray();
  console.log(filteredDocs1.length);
  if (filteredDocs1.length == 1) {
    json = {
      "status": 200,
      "result": filteredDocs1[0].result,
      "timestamp": moment().format()
    };
  }
  else {
    await axios(config)
    .then(async function (response) {
      console.log(JSON.stringify(response.data));
      json = {
        "status": 200,
        "pairsFor": ticker,
        "result": response.data,
        "timestamp": moment().format()
      };
      // await collection_pairs.deleteMany({});
      insertResult1 = await collection_pairs.insertOne(json);
      console.log(insertResult1);
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/changenow/estimate', async function(req, res, next) {

  var json = {
    "status": 200,
    "timestamp": moment().format()
  };
  var resultEstimate, resultMinAmount, resultNetworkFee;
  const api_key = await get_checknow_apikey();
  const coin_from = req.query.from;
  const coin_to = req.query.to;
  const ex_amount = req.query.amount;
  console.log(coin_from, coin_to);

  var configEstimate = {
    method: 'get',
    maxBodyLength: Infinity,
    url: baseUrlChangeNow + 'v1/exchange-amount/' + ex_amount + '/' + coin_from + '_' + coin_to + '?api_key=' + api_key,
    headers: { }
  };

  var configMinAmount = {
    method: 'get',
    maxBodyLength: Infinity,
    url: baseUrlChangeNow + 'v1/min-amount/' + coin_from + '_' + coin_to + '?api_key=' + api_key,
    headers: { }
  };

  // var configNetworkFee = {
  //   method: 'get',
  //   maxBodyLength: Infinity,
  //   url: baseUrlChangeNow + 'v2/exchange/network-fee?fromCurrency=' + coin_from + '&toCurrency=' + coin_to + '&fromNetwork=' + coin_from + '&toNetwork=' + coin_to + '&fromAmount=' + ex_amount + '&convertedCurrency=usd&convertedNetwork=usd',
  //   headers: { 
  //     'x-changenow-api-key': api_key
  //   }
  // };

  await axios(configEstimate)
    .then(async function (response) {
      resultEstimate = response.data;
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });

  await axios(configMinAmount)
    .then(async function (response) {
      resultMinAmount = response.data;
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });

  // await axios(configNetworkFee)
  //   .then(async function (response) {
  //     resultNetworkFee = response.data;
  //     console.log(JSON.stringify(response.data));
  //   })
  //   .catch(function (error) {
  //     console.log(error);
  //   });


  json = {
    "status": 200,
    "from": coin_from,
    "to": coin_to,
    "amount": ex_amount,
    "result_estimate": resultEstimate,
    "result_min_amt": resultMinAmount,
    // "result_net_fee": resultNetworkFee,
    "timestamp": moment().format()
  };
  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/changenow/create-txn', async function(req, res, next) {

  var json = {
    "status": 200,
    "timestamp": moment().format()
  };
  const api_key = await get_checknow_apikey();

  var dataCreateTxn = JSON.stringify({
    "from": req.query.from,
    "to": req.query.to,
    "address": req.query.deposit_address,
    "amount": req.query.amount,
    "extraId": "",
    "userId": "",
    "contactEmail": req.query.user_email,
    "refundAddress": req.query.refund_address,
    "refundExtraId": ""
  });

  var configCreateTxn = {
    method: 'post',
    maxBodyLength: Infinity,
    url: baseUrlChangeNow + 'v1/transactions/' + api_key,
    headers: { 
      'Content-Type': 'application/json',
    },
    data: dataCreateTxn
  };

  await axios(configCreateTxn)
    .then(async function (response) {
      json = {
        "status": 200,
        "from": req.query.from,
        "to": req.query.to,
        "amount": req.query.amount,
        "result_estimate": response.data,
        "timestamp": moment().format()
      };
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      json = {
        "status": 400,
        "from": req.query.from,
        "to": req.query.to,
        "amount": req.query.amount,
        "error_message": error.response.data,
        "timestamp": moment().format()
      };
      console.log(error.response.data.error, error.response.data.message);
    });


  
  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/changenow/txn-status', async function(req, res, next) {

  var json = {
    "status": 200,
    "timestamp": moment().format()
  };
  const txnid = req.query.txnid;
  const api_key = await get_checknow_apikey();

  var configNetworkFee = {
    method: 'get',
    maxBodyLength: Infinity,
    url: baseUrlChangeNow + 'v1/transactions/' + txnid + '/'+ api_key,
    headers: { }
  };

  await axios(configNetworkFee)
    .then(async function (response) {
      json = {
        "status": 200,
        "result": response.data,
        "timestamp": moment().format()
      };
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      json = {
        "status": 400,
        "error_message": error.response.data,
        "timestamp": moment().format()
      };
      console.log(JSON.stringify(error.response.statusText));
    });

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});


module.exports = router;
