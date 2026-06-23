const appState = {
  user: DEMO_USER,
  currentCategory: null,
  currentSubCategory: null,
  currentEvent: null,
  currentImageIndex: 0,
  gameStartTime: null,
  map: null,
  guessMarker: null,
  correctMarker: null,
  distanceLine: null,
  currentPage: 'main'
};

function getAllEvents() {
  const events = [];
  for (const cat of DEMO_DATA.categories) {
    for (const sub of cat.subCategories) {
      for (const event of sub.events) {
        events.push({ ...event, categoryCode: cat.code, subCategoryCode: sub.code, categoryName: cat.name, subCategoryName: sub.name });
      }
    }
  }
  return events;
}

function getEventById(eventId) {
  for (const cat of DEMO_DATA.categories) {
    for (const sub of cat.subCategories) {
      for (const event of sub.events) {
        if (event.id === eventId) {
          return { ...event, categoryCode: cat.code, subCategoryCode: sub.code, categoryName: cat.name, subCategoryName: sub.name };
        }
      }
    }
  }
  return null;
}

function getCategoryByCode(code) {
  return DEMO_DATA.categories.find(c => c.code === code);
}

function getSubCategoryByCode(categoryCode, subCode) {
  const cat = getCategoryByCode(categoryCode);
  if (!cat) return null;
  return cat.subCategories.find(s => s.code === subCode);
}

function getEventsBySubCategory(categoryCode, subCode) {
  const sub = getSubCategoryByCode(categoryCode, subCode);
  return sub ? sub.events : [];
}
