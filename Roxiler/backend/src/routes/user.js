const express = require('express');
const bcrypt = require('bcrypt');
const { User, Store, Rating } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// All routes require user authentication
router.use(authMiddleware);
router.use(roleMiddleware('user'));

// Update password
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;
    if (!newPassword || !passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be 8-16 characters with at least one uppercase letter and one special character' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Get all stores with user's ratings
router.get('/stores', async (req, res) => {
  try {
    const { name, address, sortBy, sortOrder } = req.query;
    const where = {};

    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (address) where.address = { [Op.iLike]: `%${address}%` };

    const order = sortBy ? [[sortBy, sortOrder === 'desc' ? 'DESC' : 'ASC']] : [['name', 'ASC']];

    const stores = await Store.findAll({
      where,
      include: [
        {
          model: Rating,
          as: 'ratings',
          attributes: ['rating', 'userId']
        }
      ],
      order
    });

    const storesWithRating = stores.map(store => {
      const ratings = store.ratings;
      const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
        : 'N/A';

      const userRating = ratings.find(r => r.userId === req.user.id);

      return {
        id: store.id,
        name: store.name,
        address: store.address,
        overallRating: avgRating,
        userRating: userRating ? userRating.rating : null
      };
    });

    res.json(storesWithRating);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Submit or update rating
router.post('/stores/:storeId/rating', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const [ratingRecord, created] = await Rating.findOrCreate({
      where: {
        userId: req.user.id,
        storeId: parseInt(storeId)
      },
      defaults: {
        rating: parseInt(rating)
      }
    });

    if (!created) {
      await ratingRecord.update({ rating: parseInt(rating) });
    }

    res.json({
      message: created ? 'Rating submitted successfully' : 'Rating updated successfully',
      rating: ratingRecord
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
