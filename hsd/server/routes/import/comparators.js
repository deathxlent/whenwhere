function mapsAreEqual(m1, m2) {
  const keys = ['name', 'tile_type', 'tile_url', 'tile_subdomains',
    'min_zoom', 'max_zoom', 'crs_type', 'bounds_south', 'bounds_west',
    'bounds_north', 'bounds_east', 'tile_ext', 'tile_size',
    'center_lat', 'center_lng', 'default_zoom'];
  for (const key of keys) {
    const v1 = m1[key];
    const v2 = m2[key];
    if ((v1 === null || v1 === undefined) && (v2 === null || v2 === undefined)) continue;
    if (v1 === null || v2 === null) {
      if (v1 !== null || v2 !== null) return false;
    } else if (v1 !== v2) {
      return false;
    }
  }
  return true;
}

function categoriesAreEqual(c1, c2) {
  return c1.name === c2.name && c1.sort_order === c2.sort_order;
}

function subCategoriesAreEqual(sc1, sc2) {
  const keys = ['name', 'sort_order', 'center_lat', 'center_lng',
    'default_zoom', 'min_zoom', 'max_zoom'];
  for (const key of keys) {
    const v1 = sc1[key];
    const v2 = sc2[key];
    if ((v1 === null || v1 === undefined) && (v2 === null || v2 === undefined)) continue;
    if (v1 === null || v2 === null) {
      if (v1 !== null || v2 !== null) return false;
    } else if (v1 !== v2) {
      return false;
    }
  }
  return true;
}

module.exports = {
  mapsAreEqual,
  categoriesAreEqual,
  subCategoriesAreEqual
};
