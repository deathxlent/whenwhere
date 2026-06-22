window.HSD = window.HSD || {};

HSD.utils = {
  dateToTs(year, month, day, isBce) {
    let y = parseInt(year) || 0;
    if (isBce && y > 0) y = -y;
    const m = parseInt(month) || 1;
    const d = parseInt(day) || 1;
    if (y >= 0) {
      return y * 10000 + m * 100 + d;
    } else {
      return y * 10000 - m * 100 - d;
    }
  },

  tsToYearMonthDay(ts) {
    if (ts === null || ts === undefined) return { year: '', month: '', day: '', isBce: false };
    const sign = ts < 0 ? -1 : 1;
    const absTs = Math.abs(ts);
    const day = absTs % 100;
    const rest = Math.floor(absTs / 100);
    const month = rest % 100;
    const year = Math.floor(rest / 100) * sign;
    return { year: Math.abs(year).toString(), month: month.toString(), day: day.toString(), isBce: year < 0 };
  },

  formatTs(ts) {
    const p = HSD.utils.tsToYearMonthDay(ts);
    if (!p || !p.year) return '';
    if (p.isBce) {
      return `${p.year}BC${parseInt(p.month) > 0 ? '-' + p.month + (parseInt(p.day) > 0 ? '-' + p.day : '') : ''}`;
    }
    return `${p.year}-${p.month}-${p.day}`;
  },

  tileTypeName(t) {
    return { xyz: '标准XYZ', tms: 'TMS', wms: 'WMS', arcgis: 'ArcGIS', custom: '自定义' }[t] || t;
  },

  buildTileUrl(map) {
    if (!map) return '';
    if (map.tile_type === 'wms') return map.tile_url || '';
    let url = map.tile_url || '';
    if (!url) return '';
    if (url.startsWith('local://')) {
      const rest = url.slice('local://'.length);
      return `/tiles/${rest}`;
    }
    return url;
  },

  crsName(t) {
    return { simple: 'Simple (0,0在左下)', epsg3857: 'EPSG:3857 WebMercator', epsg4326: 'EPSG:4326' }[t] || t;
  },

  tsRange(events) {
    if (!events || events.length === 0) return null;
    let min = Infinity, max = -Infinity;
    for (const e of events) {
      if (e.start_ts !== null && e.start_ts < min) min = e.start_ts;
      if (e.end_ts !== null && e.end_ts > max) max = e.end_ts;
      else if (e.start_ts !== null && e.start_ts > max) max = e.start_ts;
    }
    if (!isFinite(min) || !isFinite(max)) return null;
    return { min, max };
  },

  precisionName(p) {
    return ['年', '月', '日'][p] || '年';
  }
};
