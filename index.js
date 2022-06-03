const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();

app.use(cors());
app.use(express.json());


function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m0aff.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        await client.connect();
        const partsCollection = client.db('iParts').collection('parts');
        const ordersCollection = client.db('iParts').collection('orders');
        const usersCollection = client.db('iParts').collection('users');
        const reviewsCollection = client.db('iParts').collection('reviews');
        
        //all parts
        app.get('/parts', async(req, res) =>{
            const query = {};
            const cursor = partsCollection.find(query);
            const parts = await cursor.toArray();

            res.send(parts);
        });

        //add parts
        app.post('/parts', async(req, res) =>{
            const newParts = req.body;
            const result = await partsCollection.insertOne(newParts);
            res.send(result);
          });

        //Get all reviews
        app.get('/reviews', async(req, res) =>{
            const query = {};
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();

            res.send(reviews);
        });

        //add review
        app.post('/reviews', async(req, res) =>{
            const newParts = req.body;
            const result = await reviewsCollection.insertOne(newParts);
            res.send(result);
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
        app.get('/userorders', verifyToken, async(req, res) =>{
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = {email};
                const cursor = ordersCollection.find(query);
                const order = await cursor.toArray();

                res.send(order);
            }
            else{
                return res.status(403).send({ message: 'Forbidden access' });
            }
        });

        // delete user order 
        app.delete('/userorders/:id', async(req, res) => {
           const id = req.params.id;
           const query = {_id: ObjectId(id)};
           const result = await ordersCollection.deleteOne(query);
           res.send(result);
       })
        
       // payment user order 
        app.delete('/userorders/:id', verifyToken, async(req, res) => {
           const id = req.params.id;
           const query = {_id: ObjectId(id)};
           const result = await ordersCollection.findOne(query);
           res.send(result);
       })
        
        //Add user
        app.put('/users/:email', async(req, res) =>{
            const email = req.params.email;
            const user = req.body;
            const filter = {email: email};
            const options = {upsert: true};
            const updateDoc ={
                $set: {
                        email: user.email,
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '2h'})
            res.send({result, token});
        })

        //Update user profile
        app.put('/user/:email', async(req, res) =>{
            const email = req.params.email;
            const user = req.body;
            const filter = {email: email};
            const options = {upsert: true};
            const updateDoc ={
                $set: {
                        name: user.name,
                        occupation: user.occupation,
                        number: user.number,
                        address: user.address,
                        description: user.description,
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        //all user
        app.get('/users', verifyToken, async(req, res) =>{
            const query = {};
            const cursor = usersCollection.find(query);
            const users = await cursor.toArray();

            res.send(users);
        });

        //set user admin
        app.put('/users/admin/:email',verifyToken, async(req, res) =>{
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await usersCollection.findOne({email: requester});
            if (requesterAccount.role == 'admin') {
                
            const filter = {email: email};
            const updateDoc ={
                $set: {
                        role: 'admin',
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
            }
            else{
                return res.status(403).send({ message: 'Forbidden access' });
            }
        })

        //admin role check
        app.get('/users/:email', async(req, res) =>{
            const email = req.params.email;
            const user = await usersCollection.findOne({email: email});
            const isAdmin = user.role === 'admin'
            res.send({admin: isAdmin});
        })
       
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