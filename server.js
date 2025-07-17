// Node.js Express server to serve static files and index.html
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from the existing 'static' folder
app.use(express.static(path.join(__dirname, 'static')));

// Default route to serve index.html from the Flask templates folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
