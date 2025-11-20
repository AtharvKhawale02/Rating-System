const express = require('express');
const bcrypt = require('bcrypt');
const { User, Store, Rating } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// All routes require owner authentication
router.use(authMiddleware);
router.use(roleMiddleware('owner'));

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

// Get dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const stores = await Store.findAll({
      where: { ownerId: req.user.id },
      include: [
        {
          model: Rating,
          as: 'ratings',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    const dashboardData = stores.map(store => {
      const ratings = store.ratings;
      const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
        : 'N/A';

      const ratingsList = ratings.map(r => ({
        userName: r.user.name,
        userEmail: r.user.email,
        rating: r.rating,
        submittedAt: r.createdAt
      }));

      return {
        storeId: store.id,
        storeName: store.name,
        averageRating: avgRating,
        totalRatings: ratings.length,
        ratings: ratingsList
      };
    });

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
