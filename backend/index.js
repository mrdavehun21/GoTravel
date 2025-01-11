const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const PORT = 5000;

app.use(cors()); // Allow requests from other origins
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
