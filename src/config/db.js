const mysql = require('mysql2/promise');
require('dotenv').config();

// Khởi tạo connection pool kết nối tới MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quanlyKaraoke',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối khi khởi động server
pool.getConnection()
  .then(connection => {
    console.log('✅ Kết nối thành công đến cơ sở dữ liệu MySQL!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối cơ sở dữ liệu MySQL:', err.message);
  });

module.exports = pool;
