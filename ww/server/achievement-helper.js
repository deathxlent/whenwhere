const RANK_CONFIG = [
  { level: 0, name: '未定级', icon: '⚪', color: '#9ca3af', minScore: 0 },
  { level: 1, name: '青铜', icon: '🥉', color: '#cd7f32', minScore: 1 },
  { level: 2, name: '白银', icon: '🥈', color: '#c0c0c0', minScore: 3 },
  { level: 3, name: '黄金', icon: '🥇', color: '#ffd700', minScore: 6 },
  { level: 4, name: '铂金', icon: '💎', color: '#e5e4e2', minScore: 10 },
  { level: 5, name: '钻石', icon: '💠', color: '#b9f2ff', minScore: 15 },
  { level: 6, name: '大师', icon: '🏆', color: '#ff4500', minScore: 20 },
  { level: 7, name: '王者', icon: '👑', color: '#ff1493', minScore: 30 }
];

function getRankByScore(score) {
  let currentRank = RANK_CONFIG[0];
  for (const rank of RANK_CONFIG) {
    if (score >= rank.minScore) {
      currentRank = rank;
    }
  }
  return currentRank;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

module.exports = {
  RANK_CONFIG,
  getRankByScore,
  getCurrentMonthKey
};
