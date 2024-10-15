const mongoose = require('mongoose');

require('dotenv').config();

const MONGODB_URL = process.env.MONGO_URL;

mongoose.connection.once('open', () => {
  console.log('MongoDB connection ready!');
});

mongoose.connection.on('error', (err) => {
  console.error(err);
});

async function connectToMongoDB() {
  await mongoose.connect(MONGODB_URL);
}

async function disconnectFromMongoDB() {
  await mongoose.disconnect()
}

module.exports = {
  connect: connectToMongoDB,
  disconnect: disconnectFromMongoDB
};