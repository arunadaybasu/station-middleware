var express = require('express');
var router = express.Router();
const axios = require('axios');
var moment = require('moment');
const nodeCron = require('node-cron');
const { Coins, LCDClient } = require('@terra-money/terra.js');

const fcdURLPublicNode = 'https://terra-classic-fcd.publicnode.com/';
const lcdURLPublicNode = 'https://terra-classic-lcd.publicnode.com/';
const fcdURLRebels = 'https://fcd.terrarebels.net/';

var res1 = "terra js api endpoint working";
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
const collection_proposals = db.collection('proposals');

const lcd = new LCDClient({
  URL: lcdURLPublicNode,
  chainID: "columbus-5"
});
console.log(lcd);

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

router.get('/gov/add-proposals', async function(req, res, next) {

  var res1 = await lcd.gov.proposals();
  var proposals = res1[0];
  const next_key_first = res1[1].next_key;
  var total = res1[1].total;
  console.log(next_key, total);

  // await collection_proposals.deleteMany({});
  insertResult1 = await collection_proposals.insertMany(proposals);
  console.log(insertResult1);

  const job = nodeCron.schedule("*/60 * * * * *", async () => {

    console.log(moment().format());

    if (next_key == "" || next_key == null || next_key == undefined)
      return;

    res1 = await lcd.gov.proposals({"next_key": next_key});
    proposals = res1[0];
    next_key = res1[1].next_key;
    total = res1[1].total;
    console.log(next_key, total);

    // await collection_proposals.deleteMany({});
    insertResult1 = await collection_proposals.insertMany(proposals);
    console.log(insertResult1);

  });

  job.start();

  var json = {
    "status": 200,
    "result": proposals,
    "timestamp": moment().format()
  };

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/gov/clean-proposals', async function(req, res, next) {

  var res1 = await lcd.gov.proposals();
  var proposals = res1[0];
  const next_key_first = res1[1].next_key;
  var total = res1[1].total;
  console.log(next_key, total);

  // await collection_proposals.deleteMany({});
  insertResult1 = await collection_proposals.insertMany(proposals);
  console.log(insertResult1);

  const job = nodeCron.schedule("*/60 * * * * *", async () => {

    console.log(moment().format());

    if (next_key == "" || next_key == null || next_key == undefined)
      return;

    res1 = await lcd.gov.proposals({"next_key": next_key});
    proposals = res1[0];
    next_key = res1[1].next_key;
    total = res1[1].total;
    console.log(next_key, total);

    // await collection_proposals.deleteMany({});
    insertResult1 = await collection_proposals.insertMany(proposals);
    console.log(insertResult1);

  });

  job.start();

  var json = {
    "status": 200,
    "result": proposals,
    "timestamp": moment().format()
  };

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/gov/proposals', async function(req, res, next) {

  const filteredDocs1 = await collection_proposals.find({"status": parseInt(req.query.status)}).sort({"submit_time": -1}).limit(parseInt(req.query.limit)).skip(parseInt(req.query.skip)).toArray();
  
  const json = {
    "status": 200,
    "result": filteredDocs1,
    "timestamp": moment().format()
  };

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});


module.exports = router;
