const express = require('express');
const router = express.Router();
const karaokeController = require('../controllers/karaokeController');

// Route lấy danh sách phòng
router.get('/rooms', karaokeController.getRooms);

// Route đặt phòng
router.post('/bookings', karaokeController.createBooking);

// Route thêm dịch vụ
router.post('/services', karaokeController.addService);

// Route chốt hóa đơn thanh toán
router.post('/checkout', karaokeController.checkout);

// Route rollback thanh toán hóa đơn
router.post('/checkout/rollback', karaokeController.rollbackCheckout);

// Route chốt lương hệ thống theo tháng/năm
router.post('/salary/close', karaokeController.closeSalary);

// Route thanh toán lương cho nhân viên
router.post('/salary/pay', karaokeController.paySalary);

// Route lấy danh sách bảng lương đã chốt
router.get('/salary/list', karaokeController.getSalaryList);

// Route lấy hóa đơn và đặt phòng active của một phòng
router.get('/rooms/:roomId/active', karaokeController.getActiveBooking);

// Route sửa và xóa dịch vụ đã gọi
router.post('/services/update', karaokeController.updateServiceQuantity);
router.post('/services/delete', karaokeController.deleteService);

// ==================== CÁC ROUTE MỚI NÂNG CẤP ====================

// 1. Meta data & Lookup dropdowns
router.get('/products', karaokeController.getProducts);
router.get('/room-types', karaokeController.getRoomTypes);
router.get('/salary-levels', karaokeController.getSalaryLevels);

// 2. CRUD Phòng (Rooms)
router.post('/rooms', karaokeController.createRoom);
router.put('/rooms/:id', karaokeController.updateRoom);
router.delete('/rooms/:id', karaokeController.deleteRoom);

// 3. CRUD Khách hàng (Customers)
router.get('/customers', karaokeController.getCustomers);
router.post('/customers', karaokeController.createCustomer);
router.put('/customers/:id', karaokeController.updateCustomer);
router.delete('/customers/:id', karaokeController.deleteCustomer);

// 4. CRUD Nhân viên (Employees)
router.get('/employees', karaokeController.getEmployees);
router.post('/employees', karaokeController.createEmployee);
router.put('/employees/:id', karaokeController.updateEmployee);
router.delete('/employees/:id', karaokeController.deleteEmployee);

// 5. Views SQL
router.get('/stats/invoices', karaokeController.getInvoicesFromView);
router.get('/stats/inventory-alerts', karaokeController.getInventoryAlerts);

module.exports = router;
