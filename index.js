const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { ObjectID } = require('bson');
const port = process.env.PORT || 5000;
const app = express();
require('dotenv').config();

// midleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("Wild Zone Is Running SuccesFully!")
})

// assignment10 IU3jnI20EyJc0tJu


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.06w34xu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.send([{}])
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET_TOKEN, function (err, decoded) {
        if (err) {
            return res.send([{}])
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const service = client.db("wildZone").collection("service");
        const review = client.db("wildZone").collection("reviews");

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '1h' })

            res.send({ token })
        })

        app.get('/services', async (req, res) => {
            const query = {};
            const limitQuery = req.query.limit;
            const cursor = service.find(query);
            sort = { '_id': -1 }
            if (limitQuery) {
                res.send(await cursor.limit(parseInt(limitQuery)).sort(sort).toArray())
            }
            else {
                res.send(await cursor.toArray())
            }
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) }
            const cursor = service.findOne(query);

            res.send(await cursor)
            // res.send(await cursor)
        })

        app.get('/edit-review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) }
            const cursor = review.findOne(query);

            res.send(await cursor)
        })

        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { service_id: id };
            sort = { date: -1 }
            const cursor = review.find(query).sort(sort);
            const result = cursor.toArray();
            res.send(await result)
        })

        app.get('/my-reviews',verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            const email = req.query.email;
            if(decoded.email !== email){
                return res.send([{}])
            }
            const query = { email: email };
            const cursor = review.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.post('/reviews', async (req, res) => {
            const data = req.body;
            console.log(req.body)
            data.date = new Date();
            const result = await review.insertOne(data)
            const query = { _id: ObjectID(result.insertedId) }
            const cursor = await review.findOne(query);
            res.send(cursor);
        })

        app.post('/add-service', async (req, res) => {
            const data = req.body;
            const result = await service.insertOne(data);
            res.send(result);
        })

        app.put('/edit-review/:id', async (req, res) => {
            const id = req.params.id
            const data = req.body
            const filter = { _id: ObjectID(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    review: data.review
                },
            };
            const result = await review.updateOne(filter, updateDoc, options);
            console.log(data.review)
            res.send(result)
        })

        app.delete('/my-reviews/:id', async (req, res) => {
            const id = req.params;
            const query = { _id: ObjectID(id) }
            const result = await review.deleteOne(query);
            res.send(result)
        })
    }
    finally { }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log('success')
})