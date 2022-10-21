const express = require("express");
const bodyParse = require('body-parser')
const cors = require('cors')
var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
const axios = require('axios');

var url = "mongodb://dana:root@74.208.16.217:28018"


const router = express.Router();
router.use(express.json());
router.use(bodyParse.text());

router.use(cors())

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
        console.log("!!!!!!! DATO NO ENCONTRADO !!!!!!!")
        
    } else {
        console.log("!!!!!!! DATO ENCONTRADO !!!!!!!")
    }
    return result
}

//
function horaActual() {
    let hoy = moment().utcOffset("-5:00");
    let dia = hoy.date().toString();
    let mes = (hoy.month() + 1).toString();
    let ano = hoy.year().toString();
    let hora = hoy.hours().toString();
    let minuto = hoy.minutes().toString();
    let segundo = hoy.seconds().toString();
    if (mes.length == 1) {
        mes = "0" + mes
    }
    if (dia.length == 1) {
        dia = "0" + dia
    }
    if (minuto.length == 1) {
        minuto = "0" + minuto
    }
    if (hora.length == 1) {
        hora = "0" + hora
    }
    if (segundo.length == 1) {
        segundo = "0" + segundo
    }
    let horaAct = ano + "-" + mes + "-" + dia + " " + hora + ":" + minuto + ":" + segundo
    return horaAct
}

/******************************************************
*           GET /
* ***************************************************** */

router.get('/', (req, res_api) => {
    let body
    try {
        body = JSON.parse(req.body)
    } catch (error) {
        body = req.body
    }
    console.log("---------------------------------")
    console.log("Llego un mensaje a GET: ");
    console.log(body);
    res_api.json({
        body: body,
        status: true
    })
});

/******************************************************
*           POST
* ***************************************************** */
router.post('/', async (req, res_api) => {
    let body
    try {
        body = JSON.parse(req.body)
    } catch (error) {
        body = req.body
    }
    console.log("---------------------------------")
    console.log("Llego un mensaje al apiDana: ");
    console.log(body);
    body.hora = horaActual();
    
    // 
    let result = false
    if (body.rgb != "xxx" ) {
        // BUSCAR SI HAY REGISTRO
        result = await FindReg(body.can, body.pin, "DISPOSITIVOS")
        console.log(result[0])
        if (result[0]) {
            body.rgb = result[0].rgb
            body.percentage = result[0].percentage
        }
    }

    UpdateReg(body, "DISPOSITIVOS")
    res_api.send(result[0]);
});

/******************************************************
*           POST = HEARTBEAT
* ***************************************************** */
router.post('/status', (req, res_api) => {
    let body
    try {
        body = JSON.parse(req.body)
    } catch (error) {
        body = req.body
    }
    console.log("---------------------------------")
    console.log("Llego un mensaje a status: ");
    console.log(body);
    body.hora = horaActual();
    body.heardBeat = true;
    //

    res_api.send(UpdateReg(body, "STATUS"));
})

// /******************************************************
// *           ENVIO A TARJETAS DE ENLACE
// * ***************************************************** */

// router.put('/sendEsp32', async (req, res_api) => {
//     let body
//     try {
//         body = JSON.parse(req.body)
//     } catch (error) {
//         body = req.body
//     }
//     console.log("---------------------------------")
//     console.log("Llego un mensaje a sendEsp32: ");
//     console.log(body);
//     //
//     if (body.rgb != "xxx") {
//         UpdateReg(body, "DISPOSITIVOS")
//     }
//     // buscar REGISTRO
//     let result = await FindReg(0, 0, "STATUS")
//     console.log(result)
//     let ip_compu = result[0].ipEsp
//     console.log(ip_compu)
//     ip_compu = "http://" + ip_compu

//     // Send a POST request
//     axios({
//         method: 'post',
//         url: ip_compu,
//         data: {
//             can: body.can.toString(),
//             pin: body.pin.toString(),
//             percentage: body.percentage.toString(),
//             rgb: body.rgb.toString()
//         }
//     });

//     res_api.send(result);
// });

module.exports = router