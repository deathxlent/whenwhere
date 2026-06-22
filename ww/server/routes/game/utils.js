function tsToDisplay(ts, precision) {
  if (ts === null || ts === undefined) return '-';
  const absTs = Math.abs(ts);
  const sign = ts < 0 ? -1 : 1;
  const day = absTs % 100;
  const rest = Math.floor(absTs / 100);
  const month = rest % 100;
  const year = Math.floor(rest / 100) * sign;
  const prefix = year < 0 ? '公元前' : '';
  const absYear = Math.abs(year);
  if (precision === 0) return `${prefix}${absYear}年`;
  if (precision === 1) return `${prefix}${absYear}年${month}月`;
  return `${prefix}${absYear}年${month}月${day}日`;
}

function tsToYear(ts) {
  if (ts === null || ts === undefined) return null;
  const sign = ts < 0 ? -1 : 1;
  const absTs = Math.abs(ts);
  const rest = Math.floor(absTs / 100);
  const year = Math.floor(rest / 100) * sign;
  return year;
}

function getDateRange(period) {
  const now = new Date();
  let start;
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === 'week') {
    const day = now.getDay() === 0 ? 7 : now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - (day - 1));
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    start = new Date(2000, 0, 1);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

module.exports = {
  tsToDisplay,
  tsToYear,
  getDateRange
};
