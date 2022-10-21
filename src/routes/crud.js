var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://dana:root@74.208.16.217:28018"
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

    if (result[0] == undefined) {
        console.log("!!!!!!! DATO NO ENCONTRADO !!!!!!!")
        result = false
    } else {
        console.log("!!!!!!! DATO ENCONTRADO !!!!!!!")
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

export default (FindReg, UpdateReg)