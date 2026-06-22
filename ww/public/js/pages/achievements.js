async function renderAchievementsPage() {
  cleanupGame();
  if (!appState.user || !appState.user.id) {
    alert('请先登录');
    return;
  }

  const res = await API.get(`/achievements/user/${appState.user.id}`);
  if (!res.success) {
    alert(res.message || '加载成就失败');
    renderMainPage();
    return;
  }

  const { unlocked_count, total_count, all_achievements, current_rank, next_rank, monthly_stats } = res.data;
  appState._achievementsData = all_achievements;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="favorites-page">
      <div class="page-header">
        <button class="btn btn-secondary" id="ach-back-btn">← 返回主界面</button>
        <h2>🏅 成就系统</h2>
        <div></div>
      </div>

      <div class="stats-summary" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px;">
        <div class="stats-card">
          <div class="num">${unlocked_count} / ${total_count}</div>
          <div class="lbl">已解锁成就</div>
        </div>
        <div class="stats-card" style="border-color:${current_rank.color};box-shadow:0 0 20px rgba(255,255,255,0.1);">
          <div class="num" style="color:${current_rank.color};">${current_rank.icon} ${current_rank.name}</div>
          <div class="lbl">当前段位</div>
        </div>
        <div class="stats-card small precise-location-card">
          <div class="num">${monthly_stats.total_precise_location}</div>
          <div class="lbl">本月精准位置</div>
        </div>
        <div class="stats-card small precise-time-card">
          <div class="num">${monthly_stats.total_precise_time}</div>
          <div class="lbl">本月精准时间</div>
        </div>
      </div>

      ${next_rank ? `
        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:16px;margin-bottom:20px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div>
              <div style="font-size:14px;color:rgba(255,255,255,0.6);margin-bottom:6px;">下一段位</div>
              <div style="font-size:20px;color:${next_rank.color};font-weight:700;">${next_rank.icon} ${next_rank.name}</div>
            </div>
            <div style="flex:1;">
              <div style="background:rgba(255,255,255,0.1);border-radius:100px;height:10px;overflow:hidden;">
                <div style="background:linear-gradient(90deg,${current_rank.color},${next_rank.color});height:100%;width:${Math.round((unlocked_count / next_rank.minScore) * 100)}%;transition:width 0.5s ease;"></div>
              </div>
              <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:6px;text-align:right;">${unlocked_count} / ${next_rank.minScore} 个成就</div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="achievement-tabs" id="achievement-tabs">
        <button class="ach-tab ${appState.currentAchievementTab === 'all' ? 'active' : ''}" data-tab="all">全部 (${total_count})</button>
        <button class="ach-tab ${appState.currentAchievementTab === 'unlocked' ? 'active' : ''}" data-tab="unlocked">已解锁 (${unlocked_count})</button>
        <button class="ach-tab ${appState.currentAchievementTab === 'locked' ? 'active' : ''}" data-tab="locked">未解锁 (${total_count - unlocked_count})</button>
      </div>

      <div class="favorites-list" id="achievements-list">
        ${renderAchievementList(all_achievements, appState.currentAchievementTab)}
      </div>
    </div>
  `;

  document.getElementById('ach-back-btn').addEventListener('click', () => {
    renderMainPage();
  });

  document.getElementById('achievement-tabs').querySelectorAll('.ach-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('achievement-tabs').querySelectorAll('.ach-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.currentAchievementTab = btn.dataset.tab;
      document.getElementById('achievements-list').innerHTML = renderAchievementList(appState._achievementsData, appState.currentAchievementTab);
    });
  });
}

function renderAchievementList(achievements, filter) {
  let filtered = achievements;
  if (filter === 'unlocked') {
    filtered = achievements.filter(a => a.unlocked);
  } else if (filter === 'locked') {
    filtered = achievements.filter(a => !a.unlocked);
  }

  if (filtered.length === 0) {
    return '<div style="text-align:center;padding:60px;color:rgba(255,255,255,0.4);font-size:15px;">暂无成就数据</div>';
  }

  return `<div class="achievement-grid">
    ${filtered.map(a => `
      <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon" style="${a.unlocked ? `background:rgba(255,215,0,0.15);border-color:rgba(255,215,0,0.4);` : ''}">
          ${a.icon || '🏆'}
        </div>
        <div class="achievement-info">
          <div class="achievement-name">
            ${a.name}
            <span class="achievement-tier">
              ${a.tier === 1 ? '🥉 铜' : a.tier === 2 ? '🥈 银' : a.tier === 3 ? '🥇 金' : '💎 钻石'}
            </span>
          </div>
          <div class="achievement-desc">${a.description}</div>
          ${!a.unlocked ? `
            <div class="achievement-progress">
              <div style="background:rgba(255,255,255,0.1);border-radius:100px;height:6px;overflow:hidden;">
                <div style="background:linear-gradient(90deg,#667eea,#764ba2);height:100%;width:${a.progress}%;transition:width 0.3s ease;"></div>
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">${a.current_value} / ${a.target_value}</div>
            </div>
          ` : `
            <div class="achievement-unlocked-date">
              ✅ ${new Date(a.unlocked_at).toLocaleDateString('zh-CN')} 解锁
            </div>
          `}
        </div>
      </div>
    `).join('')}
  </div>`;
}

async function renderRankHistoryPage() {
  cleanupGame();
  if (!appState.user || !appState.user.id) {
    alert('请先登录');
    return;
  }

  const res = await API.get(`/achievements/rank-history/${appState.user.id}`);
  if (!res.success) {
    alert(res.message || '加载段位历史失败');
    renderMainPage();
    return;
  }

  const history = res.data;
  appState._rankHistoryData = history;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="favorites-page">
      <div class="page-header">
        <button class="btn btn-secondary" id="rank-back-btn">← 返回主界面</button>
        <h2>📜 段位历史</h2>
        <div></div>
      </div>

      <div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;margin-bottom:20px;">
        <div style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;">
          💡 <strong>段位系统说明</strong><br>
          段位根据每月解锁的成就数量进行评定，每个自然月第一天自动重置。<br>
          段位等级：未定级 → 青铜 → 白银 → 黄金 → 铂金 → 钻石 → 大师 → 王者
        </div>
      </div>

      ${history.length === 0 ? `
        <div style="text-align:center;padding:80px;color:rgba(255,255,255,0.4);font-size:15px;">
          暂无段位历史记录<br>
          <span style="font-size:13px;">下个月月初结算后将显示您的第一个段位</span>
        </div>
      ` : `
        <div class="rank-timeline">
          ${history.map(h => `
            <div class="rank-timeline-item">
              <div class="rank-month-label">${h.rank_month}</div>
              <div class="rank-card" style="border-color:${h.rank_color};background:linear-gradient(135deg, ${h.rank_color}22, transparent);">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="font-size:48px;">${h.rank_icon}</div>
                  <div>
                    <div style="font-size:24px;font-weight:700;color:${h.rank_color};">${h.rank_name}</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">
                      🏅 解锁成就 ${h.achievement_count} 个 | 🎮 游戏 ${h.total_games} 局<br>
                      📍 精准位置 ${h.total_precise_location} 次 | ⏰ 精准时间 ${h.total_precise_time} 次
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  document.getElementById('rank-back-btn').addEventListener('click', () => {
    renderMainPage();
  });
}
