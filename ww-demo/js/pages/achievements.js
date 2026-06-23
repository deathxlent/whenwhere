function renderAchievementsPage() {
  appState.currentPage = 'achievements';
  const app = document.getElementById('app');
  const achievements = getAchievements();
  const stats = getStats();
  
  const achievementList = [
    { id: ACHIEVEMENT_CONFIG.PRECISE_LOCATION, name: '精准定位', desc: '位置得分达到95分以上', icon: '🎯' },
    { id: ACHIEVEMENT_CONFIG.PRECISE_TIME, name: '时间大师', desc: '时间得分达到95分以上', icon: '⏰' },
    { id: ACHIEVEMENT_CONFIG.GAMES_PLAYED, name: '游戏达人', desc: '累计完成10局游戏', icon: '🎮' },
    { id: ACHIEVEMENT_CONFIG.NEITHER_PRECISE_STREAK, name: '全能选手', desc: '连续3局位置和时间都达到80分以上', icon: '🏆' }
  ];
  
  const achievementsHtml = achievementList.map(ach => {
    const unlocked = achievements[ach.id];
    return `
      <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">${ach.icon}</div>
        <div class="achievement-info">
          <div class="achievement-name">${ach.name}</div>
          <div class="achievement-desc">${ach.desc}</div>
          ${unlocked ? `<div class="achievement-unlocked-time">解锁于 ${formatDate(unlocked.unlockedAt)}</div>` : '<div class="achievement-locked">未解锁</div>'}
        </div>
      </div>
    `;
  }).join('');
  
  app.innerHTML = `
    <div class="achievements-page">
      ${createHeader('成就系统', true)}
      <div class="achievements-list">
        ${achievementsHtml}
      </div>
      ${createBottomNav('achievements')}
    </div>
  `;
  
  document.getElementById('back-btn')?.addEventListener('click', () => renderMainPage());
  initBottomNav();
}
