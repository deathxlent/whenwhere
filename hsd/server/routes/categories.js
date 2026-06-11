const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM sub_categories sc WHERE sc.category_id = c.id AND sc.is_active = 1) as sub_count
    FROM categories c 
    WHERE c.is_active = 1 
    ORDER BY c.sort_order, c.id
  `).all();
  res.json({ success: true, data: categories });
});

router.get('/:id/sub-categories', (req, res) => {
  const { id } = req.params;
  const subCategories = db.prepare(`
    SELECT * FROM sub_categories 
    WHERE category_id = ? AND is_active = 1 
    ORDER BY sort_order, id
  `).all(id);
  res.json({ success: true, data: subCategories });
});

module.exports = router;
