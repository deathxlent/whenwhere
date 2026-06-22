window.HSD = window.HSD || {};

HSD.app = {
  async init() {
    try {
      const [catRes, mapRes] = await Promise.all([
        API.get('/categories'),
        API.get('/maps')
      ]);
      if (catRes.success) HSD.state.categories = catRes.data;
      if (mapRes.success) HSD.state.maps = mapRes.data;
      HSD.app.bindNavLinks();
      HSD.app.renderView('home');
    } catch (e) {
      toast('加载数据失败: ' + e.message, 'error');
    }
  },

  bindNavLinks() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const view = link.dataset.view;
        if (HSD.state.map) { HSD.state.map.remove(); HSD.state.map = null; }
        HSD.app.renderView(view);
      });
    });
  },

  renderView(view) {
    HSD.state.currentView = view;
    const mainView = document.getElementById('main-view');

    switch (view) {
      case 'home':
        HSD.homeView.render(mainView);
        break;
      case 'categories':
        HSD.categoriesView.render(mainView);
        break;
      case 'maps':
        HSD.mapsView.render(mainView);
        break;
      case 'import':
        HSD.importView.render(mainView);
        break;
    }
  }
};
