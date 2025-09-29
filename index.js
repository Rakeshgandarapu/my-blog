 require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const app = express();

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/myblog", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ===== Blog Schema =====
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Blog = mongoose.model("Blog", blogSchema);

// ===== Multer setup for file uploads =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ===== Routes =====

// Root route
app.get("/", (req, res) => res.send("Blog API running. Try GET /api/posts"));

// Get all posts
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Blog.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get a single post by ID
app.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// Create a new post
app.post("/api/posts", upload.single("image"), async (req, res) => {
  try {
    const newPost = new Blog({
      title: req.body.title,
      content: req.body.content,
      image: req.file ? `/uploads/${req.file.filename}` : null
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a post
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// ===== Start server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
