import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Välkommen till API:et!' });
});

app.listen(port, () => {
  console.log(`Server är igång på port ${port}`);
}); 