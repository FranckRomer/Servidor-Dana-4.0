const express = require("express");
const bodyParse = require('body-parser')
const cors = require('cors')
var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
const axios = require('axios');
// const { FindReg, UpdateReg  } = require ("./crud.js"); 

var url = "mongodb://dana:root@74.208.16.217:28018"

const router = express.Router();
router.use(express.json());
router.use(bodyParse.text());

router.use(cors())

//
async function FindReg(can, pin, collection) {
    let query = { "can": can, "pin": pin }
    if (can == 0) {
        query = ""
    }
    const db = await MongoClient.connect(url);
    const dbo = db.db("dana");
    const MyCollection = dbo.collection(collection);
    const result = await MyCollection.find(query).toArray();
    db.close();

    if (result[0] == undefined) {
        // console.log("!!!!!!! DATO NO ENCONTRADO !!!!!!!")
        result = false
    } else {
        // console.log("!!!!!!! DATO ENCONTRADO !!!!!!!")
    }
    return result
}

// Funcion que Insera el nuevo dato de TIEMPO_REAL
function InsertUpdate(body, collection) {
    console.log("Insertando documento NUEVO");
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("dana");
        dbo.collection(collection).insertOne(body, function (err, res) {
            if (err) throw err;
            console.log("---------------DOCUMUENTO INSERTADO---------------");
            db.close();
            // RESPUESTA AL SERVIDOR ESP32
            return true
        });
    });
}

function UpdateReg(body, collection) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("dana");
        var myquery = { can: body.can, pin: body.pin };
        var newvalues = { $set: body };
        dbo.collection(collection).updateOne(myquery, newvalues, function (err, res_db) {
            if (err) throw err;
            // console.log(res_db);
            db.close();
            if (res_db.modifiedCount == 0 && res_db.upsertedCount == 0 && res_db.matchedCount == 0) {
                console.log("!undefined!    !undefined!    !undefined!    !undefined!    !undefined!")
                let result = InsertUpdate(body, collection)
                return true
            } else {
                console.log("---------------DOCUMUENTO ACTUALIZADO---------------");
                return true
            }
            // RESPUESTA AL SERVIDOR ESP32

        });
    });
}

/******************************************************
*           ENVIO A TARJETAS DE ENLACE
* ***************************************************** */

router.put('/', async (req, res_api) => {
    let body
    try {
        body = JSON.parse(req.body)
    } catch (error) {
        body = req.body
    }
    console.log("---------------------------------")
    console.log("Llego un mensaje a sendEsp32: ");
    console.log(body);
    //
    if (body.rgb != "xxx") {
        
        UpdateReg(body, "DISPOSITIVOS")
        
    }
    // buscar REGISTRO
    let result = await FindReg(0, 0, "STATUS")
    // console.log(result)
    let ip_compu = result[0].ipEsp
    console.log(ip_compu)
    ip_compu = "http://" + ip_compu

    if (body.percentage == "000" && body.rgb != "xxx") {
        body.percentage = "100"
        body.rgb = "000"
    }
    // Send a POST request
    try {
        await axios({
            method: 'post',
            url: ip_compu,
            data: {
                can: body.can.toString(),
                pin: body.pin.toString(),
                percentage: body.percentage.toString(),
                rgb: body.rgb.toString()
            }
        });
    } catch (error) {
        console.log("DATO NO SE PUDO ENVIAR AL ESP32");
    }
    res_api.send(result);
});


/******************************************************
*           GET
* ***************************************************** */

router.get('/getDispositivos', async (req, res_api) => {
    // console.log("---------------------------------")
    // console.log("Llego un mensaje a GETDISPOSITIVOS: ");
    let result = await FindReg(0, 0, "DISPOSITIVOS")
    result = sortJSON(result, 'pin', 'asc');
    result = sortJSON(result, 'can', 'asc');
    res_api.send(result);
});

function sortJSON(data, key, orden) {
    return data.sort(function (a, b) {
      var x = a[key],
        y = b[key];
  
      if (orden === 'asc') {
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      }
  
      if (orden === 'desc') {
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
      }
    });
  }

module.exports = router