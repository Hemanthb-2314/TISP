const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session for tracking login
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',  // Your MySQL host
  user: 'root',       // Your MySQL user
  password: 'password', // Your MySQL password
  database: 'home48' // Your MySQL database
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/home', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get('/forum', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'views', 'forum.html'));
});

// API Routes

// Login Authentication
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) return res.status(500).send('Database error');
    
    if (results.length > 0) {
      req.session.loggedIn = true;
      req.session.userId = results[0].id;
      res.redirect('/home');
    } else {
      res.send('Invalid login credentials');
    }
  });
});

// Add a Threat
app.post('/api/add-threat', (req, res) => {
  const { threat_description } = req.body;
  // For simplicity, we're not storing threats in the database yet.
  res.send('Threat added: ' + threat_description);
});

// Get Forum Posts
app.get('/api/forum-posts', (req, res) => {
  const query = 'SELECT * FROM forum_posts ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to retrieve posts' });
    res.json(results);
  });
});

// Submit a Forum Post
app.post('/api/forum-post', (req, res) => {
  const { post_content } = req.body;
  const userId = req.session.userId;

  if (!post_content || !userId) {
    return res.status(400).json({ error: 'Post content and user ID are required' });
  }

  const query = 'INSERT INTO forum_posts (post_content, user_id) VALUES (?, ?)';
  db.query(query, [post_content, userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to create post' });
    res.json({ success: true, postId: result.insertId });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
