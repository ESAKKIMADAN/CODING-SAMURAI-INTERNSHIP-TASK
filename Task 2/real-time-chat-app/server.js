const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const session = require("express-session");
const { Server } = require("socket.io");
const path = require("path");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1/chat-app", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "chatappsecret",
    resave: false,
    saveUninitialized: true,
  })
);

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Schemas
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  inviteCode: { type: String, required: true },
});

const messageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  user: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
});

const Group = mongoose.model("Group", groupSchema);
const Message = mongoose.model("Message", messageSchema);
const User = mongoose.model("User", userSchema);

// Auth Routes
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.username = user.username;
    res.redirect("/group/General");
  } else {
    res.render("login", { error: "Invalid credentials" });
  }
});

app.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) {
    return res.render("signup", { error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ username, password: hashedPassword });
  res.redirect("/login");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Group Routes
app.get("/group/:room", async (req, res) => {
  if (!req.session.username) return res.redirect("/login");

  const room = req.params.room;
  const groupDocs = await Group.find();
  const groups = groupDocs.map((g) => ({
    name: g.name,
    code: g.inviteCode,
  }));

  res.render("chat", {
    room,
    groups,
    username: req.session.username,
  });
});

app.get("/join/:inviteCode", async (req, res) => {
  const group = await Group.findOne({ inviteCode: req.params.inviteCode });
  if (group) {
    res.redirect(`/group/${group.name}`);
  } else {
    res.send("Invalid invite code");
  }
});

app.get("/create-group/:groupName", async (req, res) => {
  const groupName = req.params.groupName;
  const existing = await Group.findOne({ name: groupName });

  if (!existing) {
    const inviteCode = crypto.randomBytes(3).toString("hex"); // 6-character code
    await Group.create({ name: groupName, inviteCode });
  }

  res.redirect(`/group/${groupName}`);
});

// Socket.io for chat functionality
io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ username, room }) => {
    socket.join(room);

    const messages = await Message.find({ room }).sort("timestamp");
    socket.emit("loadMessages", messages);

    socket.to(room).emit("message", {
      user: "System",
      text: `${username} joined the room`,
      timestamp: new Date(),
    });
  });

  socket.on("chatMessage", async ({ username, message, room }) => {
    const msg = await Message.create({
      room,
      user: username,
      text: message,
    });

    io.to(room).emit("message", msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server started on http://localhost:${PORT}`)
);
