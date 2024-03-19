var express = require('express');
var router = express.Router();
const axios = require('axios');
var moment = require('moment');
const nodeCron = require('node-cron');
// const fetch = require('isomorphic-fetch');
// const { Coins, LCDClient } = require('@terra-money/terra.js');

const fcdURL = 'https://terra-classic-fcd.publicnode.com/v1/';
const fcdURLRebels = 'https://fcd.terrarebels.net/';

var res1 = "supply jobs api endpoint working";
var pswd_valid = 0;
let response = null;

const { MongoClient } = require('mongodb');
// Connection URL
const dbUrl = 'mongodb://localhost:27017';
const dbCclient = new MongoClient(dbUrl);
// Database Name
const dbName = 'luncdb_onchain';

// const lcd = new LCDClient({
//   URL: "https://terra-classic-lcd.publicnode.com/",
//   chainID: "columbus-5"
// });
// console.log(lcd);

const burn_account_main = 'terra1sk06e3dyexuq4shw77y3dsv480xv42mq73anxu';


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

router.get('/onchain/lcd-mock', async function(req, res, next) {

  const json = {
    "status": 200,
    "timestamp": moment().format()
  };

  // const res2 = await lcd.txs({});
  // console.log(res2);

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/onchain/burn-mock', async function(req, res, next) {

  var offset = 0;

  await check_pwd(req.query.username, req.query.password);

  if( pswd_valid == 1 ) {
    console.log("Password Valid");
  }
  else if( pswd_valid == 0 ) {
    console.log("Password Invalid");
    return;
  }

  const json = {
    "status": 200,
    "timestamp": moment().valueOf()
  };

  console.log(moment().valueOf());

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

  new Promise(async (resolve, reject) => {

  try {
      response = await axios.get(fcdURL + 'txs?offset=' + offset + '&limit=100&account=' + req.query.account, {});
    } catch(ex) {
      response = null;
      // error
      console.log(ex);
      // reject(ex);
    }

    if (response) {

      const respjson1 = {
        "status": 200,
        "result": response.data,
        "timestamp": moment().valueOf()
      };

      offset = response.data.next;
      console.log(offset);

      // Use connect method to connect to the server
      await dbCclient.connect();
      console.log('Connected successfully to MongoDB Server');
      const db = dbCclient.db(dbName);
      const collection_txs = db.collection('txs_burn_account');
      // await collection_txs.deleteMany({});
      const insertResult = await collection_txs.insertOne(respjson1);
      console.log('Inserted documents =>', insertResult);

    }

  });

});

router.get('/onchain/cron-clean-burn-account', async function(req, res, next) {

  await check_pwd(req.query.username, req.query.password);

  if( pswd_valid == 1 ) {
    console.log("Password Valid");
  }
  else if( pswd_valid == 0 ) {
    console.log("Password Invalid");
    return;
  }

  const json = {
    "status": 200,
    "timestamp": moment().valueOf()
  };

  console.log(moment().format());

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

  var offset = 0, insertResult, respjson1, respjson2, a, filteredDocs1, filteredDocs2, query1;

  await dbCclient.connect();
  console.log('Connected successfully to MongoDB Server');
  const db = dbCclient.db(dbName);
  const collection_burn_acc_clean = await db.collection('txs_burn_account_clean');
  // await collection_burn_acc_clean.deleteMany({});
  const collection_burn_account = await db.collection('txs_burn_account');

  const job = nodeCron.schedule("*/5 * * * * *", async () => {

    console.log(moment().format());
    
    filteredDocs1 = await collection_burn_account.find({}).skip(offset).sort( { 'timestamp': 1 } ).limit(1).toArray();
    if (filteredDocs1.length == 0)
      offset = 0;
    console.log(filteredDocs1.length, offset);

    for (a = 0; a < filteredDocs1[0].result.txs.length; a++) {

      if ( filteredDocs1[0].result.txs[a].tx ) {

        if (filteredDocs1[0].result.txs[a].tx.value.msg[0].type == 'wasm/MsgExecuteContract') {

          respjson1 = {
            "status": 200,
            "result": {
              "type": "Contract",
              "burner": filteredDocs1[0].result.txs[a].tx.value.memo,
              "burner_add": filteredDocs1[0].result.txs[a].tx.value.msg[0].value.sender,
              "contract_add": filteredDocs1[0].result.txs[a].tx.value.msg[0].value.contract,
              "amount": filteredDocs1[0].result.txs[a].tx.value.fee.amount,
              "height": filteredDocs1[0].result.txs[a].height,
              "txhash": filteredDocs1[0].result.txs[a].txhash,
              "gas_wanted": filteredDocs1[0].result.txs[a].gas_wanted,
              "gas_used": filteredDocs1[0].result.txs[a].gas_used,
              "tx_id": filteredDocs1[0].result.txs[a].id,
              "tx_timestamp": moment(filteredDocs1[0].result.txs[a].timestamp).valueOf()
            },
            "timestamp": moment().valueOf()
          };

          query1 = {"result.tx_id": filteredDocs1[0].result.txs[a].id};
          filteredDocs2 = await collection_burn_acc_clean.find(query1).toArray();
          if (filteredDocs2.length == 0) {
            insertResult = await collection_burn_acc_clean.insertOne(respjson1);
            console.log(filteredDocs2.length, insertResult);
          }

        }
        else if ((filteredDocs1[0].result.txs[a].tx.value.msg[0].type == 'bank/MsgSend') &&
          (filteredDocs1[0].result.txs[a].tx.value.msg[0].value.to_address == burn_account_main)) {

          respjson2 = {
            "status": 200,
            "result": {
              "type": "Transaction",
              "burner": filteredDocs1[0].result.txs[a].tx.value.memo,
              "burner_add": filteredDocs1[0].result.txs[a].tx.value.msg[0].value.from_address,
              "burn_add": burn_account_main,
              "amount": filteredDocs1[0].result.txs[a].tx.value.fee.amount,
              "height": filteredDocs1[0].result.txs[a].height,
              "txhash": filteredDocs1[0].result.txs[a].txhash,
              "gas_wanted": filteredDocs1[0].result.txs[a].gas_wanted,
              "gas_used": filteredDocs1[0].result.txs[a].gas_used,
              "tx_id": filteredDocs1[0].result.txs[a].id,
              "tx_timestamp": moment(filteredDocs1[0].result.txs[a].timestamp).valueOf()
            },
            "timestamp": moment().valueOf()
          };

          query1 = {"result.tx_id": filteredDocs1[0].result.txs[a].id};
          filteredDocs2 = await collection_burn_acc_clean.find(query1).toArray();
          if (filteredDocs2.length == 0) {
            insertResult = await collection_burn_acc_clean.insertOne(respjson2);
            console.log(filteredDocs2.length, insertResult);
          }

        }

      }
    }

    offset++;

  });

  job.start();

  

});

router.get('/onchain/cron-burn-account', async function(req, res, next) {

  var offset = 0;

  await check_pwd(req.query.username, req.query.password);

  if( pswd_valid == 1 ) {
    console.log("Password Valid");
  }
  else if( pswd_valid == 0 ) {
    console.log("Password Invalid");
    return;
  }

  const json = {
    "status": 200,
    "timestamp": moment().format()
  };

  // Use connect method to connect to the server
  await dbCclient.connect();
  console.log('Connected successfully to MongoDB Server');
  const db = dbCclient.db(dbName);
  const collection_txs = db.collection('txs_burn_account');
  // await collection_txs.deleteMany({});

  const job = nodeCron.schedule("15 * * * * *", () => {

    console.log(moment().format());

    new Promise(async (resolve, reject) => {

    try {
        response = await axios.get(fcdURL + 'txs?offset=' + offset + '&limit=100&account=' + burn_account_main, {});
      } catch(ex) {
        response = null;
        // error
        console.log(ex);
        // reject(ex);
      }

      if (response) {

        const respjson1 = {
          "status": 200,
          "result": response.data,
          "timestamp": moment().valueOf()
        };

        offset = response.data.next;
        console.log(offset);
        const insertResult = await collection_txs.insertOne(respjson1);
        console.log('Inserted documents =>', insertResult);

      }

    });
  });

  job.start();

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/onchain/csupply', async function(req, res, next) {

  await check_pwd(req.query.username, req.query.password);

  if( pswd_valid == 1 ) {
    console.log("Password Valid");
  }
  else if( pswd_valid == 0 ) {
    console.log("Password Invalid");
    return;
  }

  const json = {
    "status": 200,
    "timestamp": moment().valueOf()
  };

  console.log(moment().valueOf());

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

  new Promise(async (resolve, reject) => {

  try {
      response = await axios.get(fcdURL + 'circulatingsupply/uluna', {
        // timeout: 50000, // Timeout of 10 seconds
      });
    } catch(ex) {
      response = null;
      // error
      console.log(ex);
      // reject(ex);
    }

    if (response) {

      const respjson1 = {
        "status": 200,
        "result": response.data,
        "timestamp": moment().valueOf()
      };

      // Use connect method to connect to the server
      await dbCclient.connect();
      console.log('Connected successfully to MongoDB Server');
      const db = dbCclient.db(dbName);
      const collection_csupply = db.collection('circulating_supply');
      // await collection_csupply.deleteMany({});
      const insertResult = await collection_csupply.insertOne(respjson1);
      console.log('Inserted documents =>', insertResult);

    }

  });
  

});

router.get('/onchain/tsupply', async function(req, res, next) {

  await check_pwd(req.query.username, req.query.password);

  if( pswd_valid == 1 ) {
    console.log("Password Valid");
  }
  else if( pswd_valid == 0 ) {
    console.log("Password Invalid");
    return;
  }

  const json = {
    "status": 200,
    "timestamp": moment().valueOf()
  };

  console.log(moment().valueOf());

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

  new Promise(async (resolve, reject) => {

  try {
      response = await axios.get(fcdURL + 'totalsupply/uluna', {
        // timeout: 50000, // Timeout of 10 seconds
      });
    } catch(ex) {
      response = null;
      // error
      console.log(ex);
      // reject(ex);
    }

    if (response) {

      const respjson1 = {
        "status": 200,
        "result": response.data,
        "timestamp": moment().valueOf()
      };

      // Use connect method to connect to the server
      await dbCclient.connect();
      console.log('Connected successfully to MongoDB Server');
      const db = dbCclient.db(dbName);
      const collection_tsupply = db.collection('total_supply');
      // await collection_tsupply.deleteMany({});
      const insertResult = await collection_tsupply.insertOne(respjson1);
      console.log('Inserted documents =>', insertResult);

    }

  });
  

});

router.get('/onchain/community-pool', async function(req, res, next) {

  await check_pwd(req.query.username, req.query.password);

  if( pswd_valid == 1 ) {
    console.log("Password Valid");
  }
  else if( pswd_valid == 0 ) {
    console.log("Password Invalid");
    return;
  }

  const json = {
    "status": 200,
    "timestamp": moment().valueOf()
  };

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

  new Promise(async (resolve, reject) => {

  try {
      response = await axios.get(fcdURLRebels + 'cosmos/distribution/v1beta1/community_pool', {
        // timeout: 50000, // Timeout of 10 seconds
      });
    } catch(ex) {
      response = null;
      // error
      console.log(ex);
      // reject(ex);
    }

    if (response) {

      console.log(response.data);

      const respjson1 = {
        "status": 200,
        "result": response.data,
        "timestamp": moment().valueOf()
      };

      // Use connect method to connect to the server
      await dbCclient.connect();
      console.log('Connected successfully to MongoDB Server');
      const db = dbCclient.db(dbName);
      const collection_community_pool = db.collection('community_pool');
      // await collection_community_pool.deleteMany({});
      const insertResult = await collection_community_pool.insertOne(respjson1);
      console.log('Inserted documents =>', insertResult);

    }

  });
  

});

router.get('/onchain/lcd-community-pool', async function(req, res, next) {

  await check_pwd(req.query.username, req.query.password);

  if( pswd_valid == 1 ) {
    console.log("Password Valid");
  }
  else if( pswd_valid == 0 ) {
    console.log("Password Invalid");
    return;
  }

  const cpdata = await lcd.distribution.communityPool();
  console.log(cpdata);

  const respjson1 = {
    "status": 200,
    "result": cpdata,
    "timestamp": moment().valueOf()
  };

  // Use connect method to connect to the server
  await dbCclient.connect();
  console.log('Connected successfully to MongoDB Server');
  const db = dbCclient.db(dbName);
  const collection_community_pool = db.collection('lcd_community_pool');
  // await collection_community_pool.deleteMany({});
  const insertResult = await collection_community_pool.insertOne(respjson1);
  console.log('Inserted documents =>', insertResult);
  
  const json = {
    "status": 200,
    "timestamp": moment().valueOf()
  };

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/onchain/cron-csupply', async function(req, res, next) {

  await check_pwd(req.query.username, req.query.password);

  if( pswd_valid == 1 ) {
    console.log("Password Valid");
  }
  else if( pswd_valid == 0 ) {
    console.log("Password Invalid");
    return;
  }

  const json = {
    "status": 200,
    "timestamp": moment().format()
  };

  const job = nodeCron.schedule("0 * * * * *", () => {

    console.log(moment().format());

    new Promise(async (resolve, reject) => {

    try {
        response = await axios.get(fcdURL + 'circulatingsupply/uluna', {});
      } catch(ex) {
        response = null;
        // error
        console.log(ex);
        // reject(ex);
      }

      if (response) {

        const respjson1 = {
          "status": 200,
          "result": response.data,
          "timestamp": moment().valueOf()
        };

        // Use connect method to connect to the server
        await dbCclient.connect();
        console.log('Connected successfully to MongoDB Server');
        const db = dbCclient.db(dbName);
        const collection_csupply = db.collection('circulating_supply');
        // await collection_csupply.deleteMany({});
        const insertResult = await collection_csupply.insertOne(respjson1);
        console.log('Inserted documents =>', insertResult);

      }

    });
  });

  job.start();

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/onchain/cron-tsupply', async function(req, res, next) {

  await check_pwd(req.query.username, req.query.password);

  if( pswd_valid == 1 ) {
    console.log("Password Valid");
  }
  else if( pswd_valid == 0 ) {
    console.log("Password Invalid");
    return;
  }

  const json = {
    "status": 200,
    "timestamp": moment().format()
  };

  const job = nodeCron.schedule("30 * * * * *", () => {

    console.log(moment().format());

    new Promise(async (resolve, reject) => {

    try {
        response = await axios.get(fcdURL + 'totalsupply/uluna', {});
      } catch(ex) {
        response = null;
        // error
        console.log(ex);
        // reject(ex);
      }

      if (response) {

        // console.log(response);

        const respjson1 = {
          "status": 200,
          "result": response.data,
          "timestamp": moment().valueOf()
        };

        // Use connect method to connect to the server
        await dbCclient.connect();
        console.log('Connected successfully to MongoDB Server');
        const db = dbCclient.db(dbName);
        const collection_tsupply = db.collection('total_supply');
        // await collection_tsupply.deleteMany({});
        const insertResult = await collection_tsupply.insertOne(respjson1);
        console.log('Inserted documents =>', insertResult);

      }

    });
  });

  job.start();

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/onchain/cron-community-pool', async function(req, res, next) {

  await check_pwd(req.query.username, req.query.password);

  if( pswd_valid == 1 ) {
    console.log("Password Valid");
  }
  else if( pswd_valid == 0 ) {
    console.log("Password Invalid");
    return;
  }

  const json = {
    "status": 200,
    "timestamp": moment().format()
  };

  const job = nodeCron.schedule("15 */10 * * * *", () => {

    console.log(moment().format());

    new Promise(async (resolve, reject) => {

    try {
        response = await axios.get(fcdURLRebels + 'cosmos/distribution/v1beta1/community_pool', {});
      } catch(ex) {
        response = null;
        // error
        console.log(ex);
        // reject(ex);
      }

      if (response) {

        // console.log(response);

        const respjson1 = {
          "status": 200,
          "result": response.data,
          "timestamp": moment().valueOf()
        };

        // Use connect method to connect to the server
        await dbCclient.connect();
        console.log('Connected successfully to MongoDB Server');
        const db = dbCclient.db(dbName);
        const collection_community_pool = db.collection('community_pool');
        // await collection_community_pool.deleteMany({});
        const insertResult = await collection_community_pool.insertOne(respjson1);
        console.log('Inserted documents =>', insertResult);

      }

    });
  });

  job.start();

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});


module.exports = router;
