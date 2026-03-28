require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const { verifyToken } = require("./utils/jwt.util");

const app = express();
const httpServer = http.createServer(app);

const defaultClientOrigins = ["http://localhost:5173", "http://localhost:5174"];
const allowedClientOrigins = (process.env.CLIENT_URL || defaultClientOrigins.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

const isOriginAllowed = (origin) =>
  allowedClientOrigins.includes(origin) ||
  (process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin));

const corsOriginDelegate = (origin, callback) => {
  // Allow non-browser clients (Postman/curl) that do not send an Origin header.
  if (!origin) return callback(null, true);
  if (isOriginAllowed(origin)) return callback(null, true);
  return callback(new Error(`Not allowed by CORS: ${origin}`));
};

// Socket.io
const io = new Server(httpServer, {
  cors: { origin: corsOriginDelegate, credentials: true },
});

// Socket.io auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  const decoded = verifyToken(token);
  if (!decoded) return next(new Error("Invalid token"));
  socket.userId = decoded.userId;
  socket.userRole = decoded.role;
  next();
});

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.userId;

  // Track online status
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);
  io.emit("user-online", userId);

  // Join personal room for direct messages
  socket.join(`user:${userId}`);

  socket.on("join-conversation", (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on("leave-conversation", (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on("typing", ({ conversationId, recipientId }) => {
    socket.to(`conversation:${conversationId}`).emit("typing", {
      userId,
      conversationId,
    });
    // Also send to recipient's personal room in case they haven't joined conversation
    socket.to(`user:${recipientId}`).emit("typing", {
      userId,
      conversationId,
    });
  });

  socket.on("stop-typing", ({ conversationId, recipientId }) => {
    socket.to(`conversation:${conversationId}`).emit("stop-typing", {
      userId,
      conversationId,
    });
    socket.to(`user:${recipientId}`).emit("stop-typing", {
      userId,
      conversationId,
    });
  });

  socket.on("disconnect", () => {
    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit("user-offline", userId);
      }
    }
  });
});

// Make io accessible to controllers
app.set("io", io);
app.set("onlineUsers", onlineUsers);

// Middleware
app.use(
  cors({
    origin: corsOriginDelegate,
    credentials: true,
  }),
);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// NoSQL injection prevention (Express 5 compatible — req.query is read-only)
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") mongoSanitize.sanitize(req.body);
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiter
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});

app.use("/api", generalLimiter);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
if (!process.env.MONGODB_URI) {
  console.error("✗ Missing MONGODB_URI environment variable.");
  console.error("  Create server/.env and set MONGODB_URI, or copy values from .env.example.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✓ MongoDB connected successfully"))
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "MEDXI API Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/health-metrics", require("./routes/healthMetrics.routes"));
app.use("/api/appointments", require("./routes/appointment.routes"));
app.use("/api/messages", require("./routes/message.routes"));
app.use("/api/alerts", require("./routes/alert.routes"));
app.use("/api/chatbot", require("./routes/chatbot.routes"));
app.use("/api/googlefit", require("./routes/googlefit.routes"));
app.use("/api/medications", require("./routes/medication.routes"));
app.use("/api/gamification", require("./routes/gamification.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/export", require("./routes/export.routes"));
app.use("/api/feedback", require("./routes/feedback.routes"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
  console.log(`✓ Allowed client origins: ${allowedClientOrigins.join(", ")}`);
});

module.exports = { app, httpServer, io };
