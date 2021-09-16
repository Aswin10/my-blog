import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();
app.use(express.static(path.join(__dirname, '/build')));
app.use(express.json());

const withDB = async (operations, res)=> {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-blog');
        await operations(db);
        client.close();
    } catch (e) {
        res.status(500).json({message: 'Error connecting to db', e});
    }
} 


app.get('/api/articles-list', async (req, res) => {
    withDB(async (db) => {
        const articlesInfo = await db.collection('articles').find();
        res.status(200).json(articlesInfo);
    }, res);
})

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const name = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({ name: name });
        res.status(200).json(articlesInfo);
    }, res);
})

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const name = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({ name: name });
        await db.collection('articles').updateOne({ name: name }, {
            '$set' : {
                upvotes: articlesInfo.upvotes + 1,
            },
        });
        const updatedArticlesInfo = await db.collection('articles').findOne({ name: name });
        res.status(200).json(updatedArticlesInfo);
    }, res);
})

app.post('/api/articles/:name/add-comment', (req, res) => {
    const name = req.params.name;
    const { username, text } = req.body;
    withDB(async (db) => {
        const articlesInfo = await db.collection('articles').findOne({ name: name });
        await db.collection('articles').updateOne({ name: name }, {
            '$set' : {
                comments: articlesInfo.comments.concat({username, text}),
            },
        });
        const updatedArticlesInfo = await db.collection('articles').findOne({ name: name });
        res.status(200).json(updatedArticlesInfo);
    }, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, ()=> {
    console.log('Started!!')
})