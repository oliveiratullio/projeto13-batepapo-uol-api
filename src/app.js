import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import Joi from "joi"
import dotenv from "dotenv"
import { MongoClient, ObjectId } from "mongodb"

const app = express();
app.use(cors());
app.use(express.json())
dotenv.config() 

let db
const mongoClient = new MongoClient(process.env.DATABASE_URL)
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => res.status(500).send(err.message));
//
const schema = Joi.object({
    name: Joi.string().min(1).required;
})
const messageSchema = Joi.object({
    from: Joi.string().required(),
    to: Joi.string().min(1).required(),
    text: Joi.string().min(1).required(),
    type: Joi.string().valid("message", "private_message").required(),
    time: Joi.string()
})

app.post('/participants', async (req, res) => {
    try {
      const { name } = await participantSchema.validateAsync(req.body);
      const db = await dbPromise;
      const participant = await db.collection('participants').findOne({ name });
      if (participant) {
        res.sendStatus(409);
      } else {
        await db.collection('participants').insertOne({
          name,
          lastStatus: Date.now(),
        });
        const now = dayjs().format('HH:mm:ss');
        await db.collection('messages').insertOne({
          from: name,
          to: 'Todos',
          text: 'entra na sala...',
          type: 'status',
          time: now,
        });
        res.sendStatus(201);
      }
    } catch (err) {
      if (err.isJoi) {
        res.status(422).send('Invalid input');
      } else {
        console.error(err);
        res.sendStatus(500);
      }
    }
  });

const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))