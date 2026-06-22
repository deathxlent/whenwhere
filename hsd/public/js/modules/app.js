window.HSD = window.HSD || {};

HSD.app = {
  init() {
    HSD.app.bindNavLinks();
    HSD.app.renderView('home');
  },

  bindNavLinks() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        HSD.app.renderView(view);
      });
    });
  },

  renderView(view, data) {
    HSD.state.currentView = view;
    const mainView = document.getElementById('main-view');
    const breadcrumb = document.getElementById('breadcrumb-text');
    mainView.innerHTML = '';

    const titleMap = {
      home: '首页',
      categories: '📂 类别管理',
      maps: '🗺️ 地图管理',
      'category-edit': '编辑分类',
      'subcategory-edit': '编辑子分类',
      'map-edit': '编辑地图',
      main: '主视图',
      import: '📥 数据导入'
    };

    if (breadcrumb && titleMap[view]) {
      breadcrumb.textContent = titleMap[view];
    }

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
      case 'category-edit':
        HSD.categoriesView.renderCategoryDetail(mainView, data);
        break;
      case 'subcategory-edit':
        HSD.categoriesView.renderSubCategoryDetail(mainView, data);
        break;
      case 'map-edit':
        HSD.mapsView.renderMapDetail(mainView, data);
        break;
      case 'main':
        HSD.mapView.renderMainView(mainView, data);
        break;
      case 'import':
        HSD.importView.render(mainView);
        break;
    }
  }
};
