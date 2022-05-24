const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m0aff.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        await client.connect();
        const partsCollection = client.db('iParts').collection('parts');
        const ordersCollection = client.db('iParts').collection('orders');
        
        //all parts
        app.get('/parts', async(req, res) =>{
            const query = {};
            const cursor = partsCollection.find(query);
            const parts = await cursor.toArray();

            res.send(parts);
        });
       
        //single part
        app.get('/parts/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const parts = await partsCollection.findOne(query);

            res.send(parts);
        });

        //update quantity
        app.put('/parts/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const newQuantity = req.body
            const options = {upsert: true}
            const updateDoc ={
                $set: {
                        availableQuantity: newQuantity.updateQuantity
                }
            }
            const result = await partsCollection.updateOne(query, updateDoc, options);
            res.send(result);
        })

        //add order
        app.post('/orders', async(req, res) =>{
            const newOrder = req.body;
            const result = await ordersCollection.insertOne(newOrder);
            res.send(result);
          });

        //all orders
        app.get('/orders', async(req, res) =>{
            const query = {};
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();

            res.send(orders);
        });

        // user based order
        app.get('/userorders', async(req, res) =>{
            const email = req.query.email   
            const query = {email};
            const cursor = ordersCollection.find(query);
            const order = await cursor.toArray();

            res.send(order);
            
        });
       
    }
    finally{

    }
}
run().catch(console.dir)



app.get('/', (req, res) =>{
    res.send('Running iParts api')
});

app.listen(port, () =>{
    console.log('Server running');
})