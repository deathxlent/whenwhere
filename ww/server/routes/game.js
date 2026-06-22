const express = require('express');
const router = express.Router();

const { getRandomEvent, submitAnswer } = require('./game/events');
const { getUserStats, getLeaderboard } = require('./game/stats');
const { submitVote, getVoteStats } = require('./game/votes');
const { toggleFavorite, getFavorites, checkFavorite } = require('./game/favorites');
const { getEventAnswers } = require('./game/answers');

router.get('/random-event', (req, res) => {
  try {
    const data = getRandomEvent(req.query.sub_codes);
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.post('/submit', (req, res) => {
  try {
    const { user_id, event_id, guess_lat, guess_lng, guess_year, guess_month, guess_day, elapsed_seconds, timed_out } = req.body;
    const data = submitAnswer(user_id, event_id, guess_lat, guess_lng, guess_year, guess_month, guess_day, elapsed_seconds, timed_out);
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.get('/stats/:userId', (req, res) => {
  try {
    const data = getUserStats(req.params.userId, req.query.period);
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.post('/vote', (req, res) => {
  try {
    const { user_id, event_id, vote_type } = req.body;
    const data = submitVote(user_id, event_id, vote_type);
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.get('/vote/:eventId', (req, res) => {
  try {
    const data = getVoteStats(req.params.eventId, req.query.user_id);
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.post('/favorite', (req, res) => {
  try {
    const { user_id, event_id } = req.body;
    const result = toggleFavorite(user_id, event_id);
    res.json({ success: true, data: { is_favorite: result.is_favorite }, message: result.message });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.get('/favorites/:userId', (req, res) => {
  try {
    const data = getFavorites(req.params.userId, req.query.keyword);
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.get('/favorite/check/:eventId', (req, res) => {
  try {
    const data = checkFavorite(req.query.user_id, req.params.eventId);
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.get('/leaderboard', (req, res) => {
  try {
    const data = getLeaderboard(req.query.period);
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.get('/event/:eventId/answers', (req, res) => {
  try {
    const data = getEventAnswers(req.params.eventId, req.query.user_id);
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

module.exports = router;
