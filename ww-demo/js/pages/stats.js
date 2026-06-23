function renderStatsPage() {
  cleanupGame();
  appState.currentPage = 'stats';

  if (!appState.statsPeriod) {
    appState.statsPeriod = 'all';
  }

  const stats = getStats();
  const daily = stats.daily || [];
  const totals = stats.totals || {
    total_games: 0,
    avg_distance: 0,
    avg_time_diff: 0,
    avg_elapsed: 0,
    total_distance: 0,
    total_time_diff: 0,
    total_elapsed: 0,
    total_precise_location: 0,
    total_precise_time: 0,
    avg_precise_location: 0,
    avg_precise_time: 0
  };

  const periodName = { all: '全部', week: '本周', month: '本月', year: '本年' }[appState.statsPeriod] || '全部';

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="stats-page">
      <div class="stats-container">
        <div class="stats-title">个人统计</div>
        <div class="stats-period-tabs" id="stats-period-tabs">
          <button class="period-tab ${appState.statsPeriod === 'all' ? 'active' : ''}" data-period="all">全部</button>
          <button class="period-tab ${appState.statsPeriod === 'week' ? 'active' : ''}" data-period="week">本周</button>
          <button class="period-tab ${appState.statsPeriod === 'month' ? 'active' : ''}" data-period="month">本月</button>
          <button class="period-tab ${appState.statsPeriod === 'year' ? 'active' : ''}" data-period="year">本年</button>
        </div>
        <div class="stats-subtitle" style="color:rgba(255,255,255,0.6);font-size:13px;margin-bottom:16px;text-align:center;">当前范围：${periodName}</div>
        <div class="stats-summary">
          <div class="stats-card">
            <div class="num">${totals.total_games}</div>
            <div class="lbl">总局数</div>
          </div>
          <div class="stats-card">
            <div class="num">${(totals.avg_distance ?? 0).toFixed(1)}</div>
            <div class="lbl">平均距离</div>
          </div>
          <div class="stats-card">
            <div class="num">${(totals.avg_time_diff ?? 0).toFixed(1)}</div>
            <div class="lbl">平均时间差(年)</div>
          </div>
          <div class="stats-card">
            <div class="num">${(totals.avg_elapsed ?? 0).toFixed(1)}</div>
            <div class="lbl">平均耗时(秒)</div>
          </div>
        </div>
        <div class="stats-summary" style="grid-template-columns:repeat(7,1fr);margin-top:12px;">
          <div class="stats-card small">
            <div class="num">${Math.round(totals.total_distance ?? 0)}</div>
            <div class="lbl">总距离</div>
          </div>
          <div class="stats-card small">
            <div class="num">${Math.round(totals.total_time_diff ?? 0)}</div>
            <div class="lbl">总时间差(年)</div>
          </div>
          <div class="stats-card small">
            <div class="num">${Math.round(totals.total_elapsed ?? 0)}</div>
            <div class="lbl">总耗时(秒)</div>
          </div>
          <div class="stats-card small precise-location-card">
            <div class="num">${totals.total_precise_location ?? 0}</div>
            <div class="lbl">精准位置数</div>
          </div>
          <div class="stats-card small precise-time-card">
            <div class="num">${totals.total_precise_time ?? 0}</div>
            <div class="lbl">精准时间数</div>
          </div>
          <div class="stats-card small precise-location-card">
            <div class="num">${(totals.avg_precise_location ?? 0).toFixed(1)}</div>
            <div class="lbl">精准位置率(%)</div>
          </div>
          <div class="stats-card small precise-time-card">
            <div class="num">${(totals.avg_precise_time ?? 0).toFixed(1)}</div>
            <div class="lbl">精准时间率(%)</div>
          </div>
        </div>
        ${daily.length > 0 ? `
          <table class="stats-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>局数</th>
                <th>距离</th>
                <th>时间差(年)</th>
                <th>耗时(秒)</th>
                <th>精准位置</th>
                <th>精准时间</th>
              </tr>
            </thead>
            <tbody>
              ${daily.map(d => `
                <tr>
                  <td>${d.stat_date}</td>
                  <td>${d.games_played}</td>
                  <td>${Math.round(d.total_distance)}</td>
                  <td>${d.total_time_diff}</td>
                  <td>${Math.round(d.total_elapsed * 10) / 10}</td>
                  <td>${d.precise_location_count || 0}</td>
                  <td>${d.precise_time_count || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div style="text-align:center;color:rgba(255,255,255,0.4);padding:40px;">暂无游戏记录</div>'}
        <div class="stats-back">
          <button class="btn btn-secondary" id="stats-back-btn">返回</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('stats-back-btn').addEventListener('click', renderMainPage);

  document.getElementById('stats-period-tabs').querySelectorAll('.period-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.statsPeriod = btn.dataset.period;
      renderStatsPage();
    });
  });
}
