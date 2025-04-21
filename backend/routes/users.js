const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// All routes require admin privileges
router.use(admin);

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router; 