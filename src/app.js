import cors from "cors"
import dayjs from "dayjs"
import dotenv from "dotenv"
import express from "express"
import joi from "joi"
import { MongoClient } from "mongodb"

const app = express()

app.use(cors())
app.use(express.json())
dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL)
try {
    await mongoClient.connect()
    console.log('MongoDB conectado!')
} catch (err) {
    console.log(err.message)
}

const db = mongoClient.db()

const participantSchema = joi.object({ name: joi.string().required() })
const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().valid("message", "private_message")
})


app.post("/participants", async (req, res) => {
    const { name } = req.body

    const validation = participantSchema.validate(req.body, { abortEarly: false })
    if (validation.error) {
        return res.status(422).send(validation.error.details.map(detail => detail.message))
    }

    try {
        const participant = await db.collection("participants").findOne({ name })
        if (participant) return res.sendStatus(409)
        await db.collection("participants").insertOne({ name, lastStatus: Date.now() })
        const message = {
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs(Date.now()).format("HH:mm:ss")
        }
        await db.collection("messages").insertOne(message)
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/participants", async (req, res) => {
    try {
      const participants = await db.collection("participants").find().toArray();
      res.send(participants);
    } catch (err) {
      res.status(500).send(err.message);
    }
    
  });

app.post("/messages", async (req, res) => {
    const { user } = req.headers
    const validation = messageSchema.validate({ ...req.body, from: user }, { abortEarly: false })
    if (validation.error) {
        return res.status(422).send(validation.error.details.map(detail => detail.message))
    }
    try {
        const participant = await db.collection("participants").findOne({ name: user })
        if (!participant) return res.sendStatus(422)
        const message = { ...req.body, from: user, time: dayjs().format("HH:mm:ss") }
        await db.collection("messages").insertOne(message)
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})
app.get("/messages", async (req, res) => {
  const user = req.header("User");
  const limit = req.query
  const numberLimit = Number(limit)
  if (limit !== undefined && (numberLimit <= 0 || isNaN(numberLimit))){ 
    return res.status(422)
  }  
  try {
      const messages = await db.collection("messages")
        .find({
          $or: [
            { type: "message" },
            { from: user },
            { to: { $in: ["Todos", user] }  },
            { from: user, type: "message" },
          ]
        })
        .sort(({ $natural: -1 }))
        .limit(limit === undefined ? 0 : numberLimit)
        .toArray()
      res.status(200)
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message)
    }
});
const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))