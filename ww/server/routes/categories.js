const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM sub_categories sc WHERE sc.category_id = c.id AND sc.is_active = 1) as total_sub_count,
      (SELECT COUNT(*) FROM sub_categories sc
        WHERE sc.category_id = c.id AND sc.is_active = 1
        AND sc.map_id IS NOT NULL
        AND (SELECT COUNT(*) FROM events e WHERE e.sub_category_id = sc.id AND e.is_active = 1) > 0
      ) as available_sub_count,
      (SELECT COUNT(*) FROM events e
        JOIN sub_categories sc ON e.sub_category_id = sc.id
        WHERE sc.category_id = c.id AND e.is_active = 1
      ) as total_event_count
    FROM categories c
    WHERE c.is_active = 1
    ORDER BY c.sort_order, c.id
  `).all();

  res.json({ success: true, data: categories });
});

router.get('/:id/sub-categories', (req, res) => {
  const { id } = req.params;

  const subCategories = db.prepare(`
    SELECT sc.*,
      m.name as map_name, m.code as map_code,
      m.tile_type as map_tile_type, m.tile_url as map_tile_url,
      m.tile_subdomains as map_tile_subdomains,
      m.min_zoom as map_min_zoom, m.max_zoom as map_max_zoom,
      m.crs_type as map_crs_type,
      m.bounds_south as map_bounds_south, m.bounds_west as map_bounds_west,
      m.bounds_north as map_bounds_north, m.bounds_east as map_bounds_east,
      m.tile_ext as map_tile_ext, m.tile_size as map_tile_size,
      (SELECT COUNT(*) FROM events e WHERE e.sub_category_id = sc.id AND e.is_active = 1) as event_count
    FROM sub_categories sc
    LEFT JOIN maps m ON sc.map_id = m.id
    WHERE sc.category_id = ? AND sc.is_active = 1
    ORDER BY sc.sort_order, sc.id
  `).all(id);

  res.json({ success: true, data: subCategories });
});

module.exports = router;
