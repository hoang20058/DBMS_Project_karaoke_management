const express = require('express');
const cors = require('cors');
const karaokeRoutes = require('./routes/karaokeRoutes');

const app = express();

// Middlewares
app.use(cors()); // Cho phép Frontend khác domain (CORS) gọi API
app.use(express.json()); // Parser JSON requests
app.use(express.urlencoded({ extended: true })); // Parser URL-encoded requests

// Định tuyến các RESTful API với tiền tố /api
app.use('/api', karaokeRoutes);

// Route mặc định cho root path
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Karaoke Management API Server is running!'
  });
});

// Middleware xử lý cho các route không tồn tại (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint không tồn tại!'
  });
});

module.exports = app;
