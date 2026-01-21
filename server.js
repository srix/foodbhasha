const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Serve static files from the src directory
app.use(express.static(path.join(__dirname, 'src')));

// SPA fallback - redirect all non-file requests to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('SPA fallback routing enabled - all routes will serve index.html');
});
