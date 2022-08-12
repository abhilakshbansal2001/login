const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_CONNECTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: true,
    });
    console.log("Database connected")
    
  } catch (error) {
    console.log("Database connection Problem")
  }

  console.log("MongoDB Connected");
};

module.exports = connectDB;
