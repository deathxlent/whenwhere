window.HSD = window.HSD || {};

HSD.state = {
  categories: [],
  maps: [],
  currentCategory: null,
  currentSubCategory: null,
  currentEvents: [],
  currentImages: [],
  currentEditingEvent: null,
  map: null,
  mapClickMarker: null,
  mapClickRect: null,
  mapDrawingRect: null,
  drawMode: 'point',
  rectStartLatLng: null,
  mapDraggingWasEnabled: false,
  provinceLayer: null,
  admin1Labels: [],
  pendingImages: [],
  currentView: 'home'
};
