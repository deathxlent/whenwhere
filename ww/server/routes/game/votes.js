const db = require('../../db');

function submitVote(user_id, event_id, vote_type) {
  if (!user_id || !event_id || vote_type === undefined) {
    throw new Error('参数不完整');
  }

  const voteTypeInt = parseInt(vote_type);
  if (voteTypeInt !== 1 && voteTypeInt !== -1) {
    throw new Error('vote_type 只能是 1(赞) 或 -1(踩)');
  }

  const existing = db.prepare('SELECT * FROM event_votes WHERE user_id = ? AND event_id = ?').get(user_id, event_id);

  if (existing) {
    if (existing.vote_type === voteTypeInt) {
      db.prepare('DELETE FROM event_votes WHERE user_id = ? AND event_id = ?').run(user_id, event_id);
    } else {
      db.prepare('UPDATE event_votes SET vote_type = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ? AND event_id = ?').run(voteTypeInt, user_id, event_id);
    }
  } else {
    db.prepare('INSERT INTO event_votes (user_id, event_id, vote_type) VALUES (?, ?, ?)').run(user_id, event_id, voteTypeInt);
  }

  return getVoteStats(event_id, user_id);
}

function getVoteStats(event_id, user_id = null) {
  const stats = db.prepare(`
    SELECT
      SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END) as up_count,
      SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END) as down_count
    FROM event_votes WHERE event_id = ?
  `).get(event_id);

  let myVote = 0;
  if (user_id) {
    const current = db.prepare('SELECT vote_type FROM event_votes WHERE user_id = ? AND event_id = ?').get(user_id, event_id);
    myVote = current ? current.vote_type : 0;
  }

  return {
    up_count: stats.up_count || 0,
    down_count: stats.down_count || 0,
    my_vote: myVote
  };
}

module.exports = {
  submitVote,
  getVoteStats
};
