window.HSD = window.HSD || {};

HSD.mapDrawing = {
  initDrawMode() {
    HSD.state.pendingImages = [];
    HSD.state.drawMode = 'point';

    const drawModeBtn = document.getElementById('toggle-draw-mode');
    if (drawModeBtn) {
      drawModeBtn.addEventListener('click', () => {
        if (HSD.state.drawMode === 'point') {
          HSD.state.drawMode = 'rect';
          drawModeBtn.textContent = '▢ 框选模式';
          HSD.state.map.getContainer().style.cursor = 'crosshair';
          HSD.state.map.off('click', HSD.mapDrawing.onMapClick);
          HSD.state.map.on('mousedown', HSD.mapDrawing.onMapMouseDown);
          toast('已切换为框选模式，在地图上按住鼠标拖拽画框', 'info');
        } else {
          HSD.state.drawMode = 'point';
          drawModeBtn.textContent = '📍 选点模式';
          HSD.state.map.getContainer().style.cursor = '';
          HSD.state.map.off('mousedown', HSD.mapDrawing.onMapMouseDown);
          HSD.state.map.on('click', HSD.mapDrawing.onMapClick);
          toast('已切换为选点模式，点击地图选择位置', 'info');
        }
      });
    }

    HSD.state.map.getContainer().style.cursor = '';
    HSD.state.map.on('click', HSD.mapDrawing.onMapClick);
  },

  onMapClick(e) {
    if (HSD.state.drawMode === 'rect') return;

    const { lat, lng } = e.latlng;

    if (HSD.state.mapClickMarker) {
      HSD.state.mapClickMarker.setLatLng([lat, lng]);
    } else {
      HSD.state.mapClickMarker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: '/shared/lib/leaflet/images/marker-icon.png',
          shadowUrl: '/shared/lib/leaflet/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        })
      }).addTo(HSD.state.map);
    }

    if (HSD.state.mapClickRect) {
      HSD.state.map.removeLayer(HSD.state.mapClickRect);
      HSD.state.mapClickRect = null;
      document.getElementById('disp-lat2').textContent = '-';
      document.getElementById('disp-lng2').textContent = '-';
    }

    document.getElementById('disp-lat').textContent = lat.toFixed(6);
    document.getElementById('disp-lng').textContent = lng.toFixed(6);
    document.getElementById('f-locname').focus();

    const panel = document.getElementById('add-panel');
    if (!panel.classList.contains('open')) {
      panel.classList.add('open');
    }

    const hint = document.getElementById('map-hint');
    if (hint) hint.style.opacity = '0';
  },

  onMapMouseDown(e) {
    if (HSD.state.drawMode !== 'rect') return;

    HSD.state.rectStartLatLng = e.latlng;
    HSD.state.mapDraggingWasEnabled = HSD.state.map.dragging.enabled();

    if (HSD.state.mapDraggingWasEnabled) {
      HSD.state.map.dragging.disable();
    }

    HSD.state.map.on('mousemove', HSD.mapDrawing.onMapMouseMove);
    HSD.state.map.on('mouseup', HSD.mapDrawing.onMapMouseUp);
  },

  onMapMouseMove(e) {
    if (!HSD.state.rectStartLatLng) return;

    const bounds = L.latLngBounds(HSD.state.rectStartLatLng, e.latlng);

    if (HSD.state.mapDrawingRect) {
      HSD.state.mapDrawingRect.setBounds(bounds);
    } else {
      HSD.state.mapDrawingRect = L.rectangle(bounds, {
        color: '#e53e3e',
        weight: 2,
        fillOpacity: 0.15
      }).addTo(HSD.state.map);
    }
  },

  onMapMouseUp(e) {
    if (!HSD.state.rectStartLatLng) return;

    HSD.state.map.off('mousemove', HSD.mapDrawing.onMapMouseMove);
    HSD.state.map.off('mouseup', HSD.mapDrawing.onMapMouseUp);

    if (HSD.state.mapDraggingWasEnabled) {
      HSD.state.map.dragging.enable();
    }

    if (HSD.state.mapDrawingRect) {
      const bounds = HSD.state.mapDrawingRect.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      if (HSD.state.mapClickRect) {
        HSD.state.map.removeLayer(HSD.state.mapClickRect);
      }
      HSD.state.mapClickRect = HSD.state.mapDrawingRect;
      HSD.state.mapDrawingRect = null;

      document.getElementById('disp-lat').textContent = ne.lat.toFixed(6);
      document.getElementById('disp-lng').textContent = sw.lng.toFixed(6);
      document.getElementById('disp-lat2').textContent = sw.lat.toFixed(6);
      document.getElementById('disp-lng2').textContent = ne.lng.toFixed(6);

      if (HSD.state.mapClickMarker) {
        HSD.state.map.removeLayer(HSD.state.mapClickMarker);
        HSD.state.mapClickMarker = null;
      }

      const panel = document.getElementById('add-panel');
      if (!panel.classList.contains('open')) {
        panel.classList.add('open');
      }

      const hint = document.getElementById('map-hint');
      if (hint) hint.style.opacity = '0';
    }

    HSD.state.rectStartLatLng = null;
  }
};
