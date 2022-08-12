require("dotenv").config({ path: "./config.env" });
const express = require("express");
const app = express();
const cors = require("cors")
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error");

connectDB()


let corsOption  = {
  origin: 'http://localhost:3003/',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors())

app.use(express.json());

app.get("/", (req, res, next) => {
  res.send("Api running");
});


// Connecting Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/private", require("./routes/private"));

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log(`Sever running on port ${PORT}`)
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Logged Error: ${err.message}`);
  server.close(() => process.exit(1));
});
