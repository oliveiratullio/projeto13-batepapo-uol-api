import express from "express"
import cors from "cors"
import Joi from "joi"
import dotenv from "dotenv"
import { MongoClient, ObjectId } from "mongodb"

const app = express();
app.use(cors());
app.use(express.json())
dotenv.config() 

const mongoClient = new MongoClient(process.env.DATABASE_URL)
try{
  await mongoClient.connect
  console.log('MongoDB Conectado')
} catch(err) {
  console.log(err.message)
}

const db = mongoClient.db()

const participantSchema = Joi.object({
    name: Joi.string().min(1).required()
})
const messageSchema = Joi.object({
    from: Joi.string().required(),
    to: Joi.string().min(1).required(),
    text: Joi.string().min(1).required(),
    type: Joi.string().valid("message", "private_message").required(),
})

app.post('/participants', async (req, res) => {
      const { name } = req.body;
      const validation = participantSchema.validate(req.body, {abortEarly: false})
      if (validation.error) {
        return res.status(422).send(validation.error.details.map(detail => detail.message))
      }
      try{
        const participant = await db.collection("participants").findOne({name: name})
        if (!participant){
          return res.sendStatus(409)
        }
        await db.collection("participants").insertOne({name, lastStatus: Date.now()})
        const message ={
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
    });

  app.get("/participants", async (req, res) => {
    try {
      const participants = await db.collection("participants").find().toArray();
      res.send(participants);
    } catch (err) {
      res.status(500).send(err.message);
    }
    
  });

  app.post("/messages", async (req, res) => {
    try {
      const { error, value } = messageSchema.validate(req.body);
      if (error) {
        return res.status(422).send("Campos inválidos");
      }
      const { to, text, type } = value;
      const from = req.headers.user;
      if (!from) {
        return res.status(422).send("Problema com o usuário!");
      }
      const db = mongoClient.db();
      const participant = await db
        .collection("participants")
        .findOne({ name: from });
      if (!participant) {
        return res.status(422).send(`Participante '${from}' não encontrado!`);
      }
      const now = dayjs().utc().tz("America/Sao_Paulo").format("HH:mm:ss");
      const message = {
        from,
        to,
        text,
        type,
        time: now,
      };
      await db.collection("messages").insertOne(message);
      return res.sendStatus(201);
    } catch (err) {
      console.error(err);
      return res.sendStatus(500);
    }
  });
  app.get("/messages", async (req, res) => {
    try {
      const user = req.header("User");
      const limit = parseInt(req.query.limit);
      const { error } = schema.validate({ limit });
      if (error) {
        return res.status(422).json({ error: error.details[0].message });
      }
      await client.connect();
      const db = client.db("chat");
      const messages = await db
        .collection("messages")
        .find({
          $or: [
            { type: "message" },
            { from: "Todos" },
            { to: user, type: "private_message" },
            { from: user, type: "private_message" },
          ],
        })
        .sort({ time: -1 })
        .limit(limit)
        .toArray();
      await client.close();
      res.status(200).json(messages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))