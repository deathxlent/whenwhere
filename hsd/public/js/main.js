function dateToTs(year, month, day, isBce) {
  return HSD.utils.dateToTs(year, month, day, isBce);
}

function tsToYearMonthDay(ts) {
  return HSD.utils.tsToYearMonthDay(ts);
}

HSD.app.init();
