require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const { generalLimiter } = require("./middleware/rateLimiter");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000" },
});

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
// Local React development can issue repeated API requests during reloads.
// Keep rate limiting enabled for deployed environments.
if (process.env.NODE_ENV === "production") {
  app.use("/api", generalLimiter);
}

// Routes (sẽ thêm dần)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/listings", require("./routes/listing"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/reviews", require("./routes/review"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/seller", require("./routes/seller"));
app.use("/api/vouchers", require("./routes/voucher"));
app.use("/api/disputes", require("./routes/dispute"));
// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// Socket.io (sẽ thêm dần)
const chatHandler = require("./socket/chatHandler");
chatHandler(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
