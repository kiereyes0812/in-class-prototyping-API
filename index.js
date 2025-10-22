const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');

require('dotenv').config();

const userRoutes = require('./routes/user');
const postRoutes = require('./routes/post'); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
    origin: ['http://localhost:3000','http://127.0.0.1:3000', 'http://localhost:4000', 'http://localhost:5174', 'http://localhost:5173','http://localhost:5175'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

mongoose.connect(process.env.MONGODB_STRING);
mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas.'));

// Routes
app.use("/users", userRoutes);
app.use("/posts", postRoutes);        

if (require.main === module) {
  app.listen(process.env.PORT || 4000, () =>
    console.log(`API online on port ${process.env.PORT || 3000}`)
  );
}

module.exports = { app, mongoose };
