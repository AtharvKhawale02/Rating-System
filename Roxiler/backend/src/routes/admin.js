const express = require('express');
const bcrypt = require('bcrypt');
const { User, Store, Rating } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.count({ where: { role: { [Op.ne]: 'admin' } } });
    const totalStores = await Store.count();
    const totalRatings = await Rating.count();

    res.json({
      totalUsers,
      totalStores,
      totalRatings
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Add new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    // Validate name length
    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({ error: 'Name must be between 20 and 60 characters' });
    }

    // Validate address length
    if (!address || address.length > 400) {
      return res.status(400).json({ error: 'Address must not exceed 400 characters' });
    }

    // Validate password
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must be 8-16 characters with at least one uppercase letter and one special character' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      address,
      role: role || 'user'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// Add new store
router.post('/stores', async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    // Validate name length
    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({ error: 'Name must be between 20 and 60 characters' });
    }

    // Validate address length
    if (!address || address.length > 400) {
      return res.status(400).json({ error: 'Address must not exceed 400 characters' });
    }

    // Check if owner exists
    const owner = await User.findByPk(ownerId);
    if (!owner) {
      return res.status(400).json({ error: 'Owner not found' });
    }

    // Update owner role if not already owner
    if (owner.role !== 'owner') {
      await owner.update({ role: 'owner' });
    }

    const store = await Store.create({
      name,
      email,
      address,
      ownerId
    });

    res.status(201).json({
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Failed to create store', details: error.message });
  }
});

// Get all stores with ratings
router.get('/stores', async (req, res) => {
  try {
    const { name, email, address, sortBy, sortOrder } = req.query;
    const where = {};

    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (email) where.email = { [Op.iLike]: `%${email}%` };
    if (address) where.address = { [Op.iLike]: `%${address}%` };

    const order = sortBy ? [[sortBy, sortOrder === 'desc' ? 'DESC' : 'ASC']] : [['name', 'ASC']];

    const stores = await Store.findAll({
      where,
      include: [
        {
          model: Rating,
          as: 'ratings',
          attributes: ['rating']
        }
      ],
      order
    });

    const storesWithRating = stores.map(store => {
      const ratings = store.ratings;
      const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
        : 'N/A';

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        rating: avgRating
      };
    });

    res.json(storesWithRating);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { name, email, address, role, sortBy, sortOrder } = req.query;
    const where = {};

    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (email) where.email = { [Op.iLike]: `%${email}%` };
    if (address) where.address = { [Op.iLike]: `%${address}%` };
    if (role) where.role = role;

    const order = sortBy ? [[sortBy, sortOrder === 'desc' ? 'DESC' : 'ASC']] : [['name', 'ASC']];

    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'address', 'role'],
      order
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'address', 'role'],
      include: [
        {
          model: Store,
          as: 'stores',
          include: [
            {
              model: Rating,
              as: 'ratings',
              attributes: ['rating']
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role
    };

    if (user.role === 'owner' && user.stores.length > 0) {
      const storesWithRatings = user.stores.map(store => {
        const ratings = store.ratings;
        const avgRating = ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
          : 'N/A';
        return {
          storeId: store.id,
          storeName: store.name,
          rating: avgRating
        };
      });
      response.stores = storesWithRatings;
    }

    res.json(response);
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

module.exports = router;
