const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');
const blogRoutes = require('./routes/blogRoutes');
const multer = require('multer');
const Blog = require('./models/Blog');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Admin routes
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'views/admin.html')));
app.get('/admin/create', (req, res) => res.sendFile(path.join(__dirname, 'views/create-post.html')));

// Create blog post
app.post('/admin/create', upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, content, tags } = req.body;
    const slug = title.toLowerCase().replace(/ /g, '-');
    const images = req.files.map(file => '/uploads/' + file.filename);
    const newBlog = new Blog({ title, slug, description, content, tags: tags.split(','), images });
    await newBlog.save();
    res.redirect('/admin');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Serve frontend pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views/index.html')));
app.get('/post/:slug', (req, res) => res.sendFile(path.join(__dirname, 'views/post.html')));

// API routes
app.use('/api', blogRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
