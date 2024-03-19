var express = require('express');
var router = express.Router();
const axios = require('axios');
var moment = require('moment');
const nodeCron = require("node-cron");
const fs = require('fs');

// const fcdURL = 'https://terra-classic-fcd.publicnode.com/v1/';
// const fcdURLRebels = 'https://fcd.terrarebels.net/';
const coinGeckoURL = 'https://api.coingecko.com/';

var res1 = "pricesapi endpoint working";
var pswd_valid = 0;
let response = null;

const { MongoClient } = require('mongodb');
// Connection URL
const dbUrl = 'mongodb://localhost:27017';
const dbCclient = new MongoClient(dbUrl);
// Database Name
const dbName = 'ustc_db_alt_1';

function anagramsStr(original, str, collections) {  
  let splitted = str.split(''); // convert the string to array. Why? Its easy to handle
  for(let i =0; i < (splitted.length - 1); i++){ // Run a for loop till last but 1 character.
    const char = splitted[i]; // copy the character at that index
    splitted.splice(i, 1, str[i+1]); // shift the immediate next character to index
    splitted.splice(i+1, 1,char); // insert the copied character to the position of the next
    const joined = splitted.join(''); // join the splitted
    if(collections.indexOf(joined) === -1){ // confirm the string is not previously formed
      collections.push(joined)      // put it inside the collection
    }
  }
  const lastCollection =  collections[collections.length-1]; // take the last collection
  if(lastCollection !== original){ // compare it with the original, if not matches, call anagram function again
   return anagramsStr(original, lastCollection, collections); 
  }
  
  return collections; // else return the collections
}

router.get('/anagrams', async function(req, res, next) {

  var ogStr = 'CAI.O8433GAUN370509files', finalStr = 'CAI.O8433GAUN370509files', finalArr = [];

  console.log(anagramsStr(ogStr, finalStr, finalArr));
  if (finalArr)
  {
    const finalArrStr = finalArr.join('\r\n');
    console.log(finalArrStr);
    fs.writeFile('./wordlist-mh370.txt', finalArrStr, {encoding: 'utf8'}, (error) => {
      if (error) {
        console.error(error);
        return;
      }
    });
  }

  const json = {
    "status": 200,
    "timestamp": moment().format()
  };

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

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

router.get('/', function(req, res, next) {
  
  res.send(res1);

});

router.get('/coingecko/lunc/price', async function(req, res, next) {

  // await check_pwd(req.query.username, req.query.password);

  // if( pswd_valid == 1 ) {
  //   console.log("Password Valid");
  // }
  // else if( pswd_valid == 0 ) {
  //   console.log("Password Invalid");
  //   return;
  // }

  const json = {
    "status": 200,
    "timestamp": moment().format()
  };

  const job = nodeCron.schedule("*/30 * * * * *", () => {

    console.log(moment().format());

    new Promise(async (resolve, reject) => {

    try {
        response = await axios.get(coinGeckoURL + 'api/v3/simple/price?ids=terra-luna%2Cterrausd&vs_currencies=usd%2Ceur%2Cgbp&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true&precision=18', {
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
        const collection1 = db.collection('coingecko_prices');
        // await collection1.deleteMany({});
        const insertResult = await collection1.insertOne(respjson1);
        console.log('Inserted documents =>', insertResult);

      }

    });

  });

  job.start();

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/coingecko/lunc/price-history', async function(req, res, next) {

  // await check_pwd(req.query.username, req.query.password);

  // if( pswd_valid == 1 ) {
  //   console.log("Password Valid");
  // }
  // else if( pswd_valid == 0 ) {
  //   console.log("Password Invalid");
  //   return;
  // }

  const json = {
    "status": 200,
    "timestamp": moment().format()
  };

  // const job = nodeCron.schedule("*/30 * * * * *", () => {

    const startDateTime = moment().subtract(1, "days").valueOf();
    const endDateTime = moment().subtract(10, "minutes").valueOf();
    console.log(startDateTime, endDateTime);

  //   new Promise(async (resolve, reject) => {

  //   try {
  //       response = await axios.get(coinGeckoURL + 'https://api.coingecko.com/api/v3/coins/terra-luna/market_chart/range?vs_currency=usd&from=1701475200&to=1701604800&precision=12', {
  //       });
  //     } catch(ex) {
  //       response = null;
  //       // error
  //       console.log(ex);
  //       // reject(ex);
  //     }

  //     if (response) {

  //       const respjson1 = {
  //         "status": 200,
  //         "result": response.data,
  //         "timestamp": moment().valueOf()
  //       };

  //       // Use connect method to connect to the server
  //       await dbCclient.connect();
  //       console.log('Connected successfully to MongoDB Server');
  //       const db = dbCclient.db(dbName);
  //       const collection1 = db.collection('coingecko_prices');
  //       // await collection1.deleteMany({});
  //       const insertResult = await collection1.insertOne(respjson1);
  //       console.log('Inserted documents =>', insertResult);

  //     }

  //   });

  // });

  // job.start();

  res.header("Access-Control-Allow-Origin", "*");
  res.send(json);

});

router.get('/coingecko/lunc/ohlc', async function(req, res, next) {

  // await check_pwd(req.query.username, req.query.password);

  // if( pswd_valid == 1 ) {
  //   console.log("Password Valid");
  // }
  // else if( pswd_valid == 0 ) {
  //   console.log("Password Invalid");
  //   return;
  // }

  // var respjson1 = {
  //   "status": 200,
  //   "timestamp": moment().format()
  // };

  var highDay = 0, lowDay = 999999999999999999, averageDayTemp = 0;
  var highTime, lowTime, averageDay, highLowVar, highLowVarTemp;
  var highArr = [], lowArr = [], avgArr = [], highLowVarArr = [];

  // const job = nodeCron.schedule("*/30 * * * * *", () => {

    console.log(moment().format());

    new Promise(async (resolve, reject) => {

    try {
        response = await axios.get(coinGeckoURL + 'api/v3/coins/terra-luna/ohlc?vs_currency=usd&days=1&precision=full', {
        });
      } catch(ex) {
        response = null;
        // error
        console.log(ex);
        // reject(ex);
      }

      if (response) {

        for(i = 0; i < response.data.length; i++)
        {

          if (response.data[i][2] > highDay)
          {
            highDay = response.data[i][2];
            highTime = response.data[i][0];
          }

          if (response.data[i][3] < lowDay)
          {
            lowDay = response.data[i][3];
            lowTime = response.data[i][0];
          }

          highArr.push(response.data[i][2]);
          lowArr.push(response.data[i][3]);

          averageDayTemp += ( ( response.data[i][2] + response.data[i][3] ) / 2 );
          avgArr.push( ( ( response.data[i][2] + response.data[i][3] ) / 2 ) );

          highLowVarTemp = ( ( ( response.data[i][2] -  response.data[i][3] ) / response.data[i][3] ) * 100 );
          highLowVarArr.push(highLowVarTemp);

        }

        averageDay = ( averageDayTemp / response.data.length );
        highLowVar = ( ( ( highDay -  lowDay ) / lowDay ) * 100 );

        console.log('Average  - ' + averageDay);
        console.log('Variation  - ' + highLowVar);
        console.log('High  - ' + highDay + ' at ' + highTime);
        console.log('Low  - ' + lowDay + ' at ' + lowTime);

        console.log(highArr);
        console.log(lowArr);
        console.log(avgArr);
        console.log(highLowVarArr);

        resInsertOhlc = {
          "status": 200,
          "result": {
            "timePeriod": "30mins",
            "averageDay": averageDay,
            "highLowVar": highLowVar,
            "highDay": highDay,
            "highTime": highTime,
            "lowDay": lowDay,
            "lowTime": lowTime,
            "highArr": highArr,
            "lowArr": lowArr,
            "avgArr": avgArr,
            "highLowVarArr": highLowVarArr
          },
          "timestamp": moment().valueOf()
        };
        // Use connect method to connect to the server
        await dbCclient.connect();
        console.log('Connected successfully to MongoDB Server');
        const db = dbCclient.db(dbName);
        const collection1 = db.collection('coingecko_ohlc');
        // await collection1.deleteMany({});
        const insertResultOhlc = await collection1.insertOne(resInsertOhlc);
        console.log(insertResultOhlc);

        res.header("Access-Control-Allow-Origin", "*");
        res.send(resInsertOhlc);

      }

    });

  // });

  // job.start();

  // res.header("Access-Control-Allow-Origin", "*");
  // res.send(respjson1);

});


module.exports = router;
