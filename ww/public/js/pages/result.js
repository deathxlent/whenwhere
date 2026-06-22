function renderResultPage(result, elapsedSeconds, isTimedOut) {
  appState.currentView = 'result';

  const shownImages = appState.shownImageIndices.map(i => appState.currentImages[i]).filter(Boolean);
  const isPreciseLocation = result.precise_location === true;
  const isPreciseTime = result.precise_time === true;
  const distanceUnit = result.distance_unit || 'km';
  const isLocationOnly = result.location_only === true;

  const timeDiffSigned = result.time_diff_years;
  const timeColorClass = timeDiffSigned === null ? 'wrong' : (timeDiffSigned === 0 ? 'correct' : (timeDiffSigned > 0 ? 'time-positive' : 'time-negative'));
  const distanceColor = result.distance_km === null ? 'wrong' : (result.distance_km <= 500 ? 'correct' : 'wrong');
  const distanceText = result.distance_km === null ? '未作答' : `${result.distance_km} ${distanceUnit}`;
  const timeDiffAbs = timeDiffSigned === null ? null : Math.abs(timeDiffSigned);
  const timeDiffText = timeDiffSigned === null ? '未作答' : (timeDiffSigned === 0 ? '完全正确！' : `${timeDiffSigned > 0 ? '+' : ''}${timeDiffSigned} 年`);

  const titleText = isTimedOut ? '时间到！结果揭晓' : '结果揭晓';
  const eventId = appState.currentEvent ? appState.currentEvent.id : null;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="result-page-with-map">
      <div class="result-map-layer" id="result-map-layer">
        <div id="result-map"></div>
      </div>
      <div class="result-overlay" id="result-overlay">
        <div class="result-overlay-content">
          <div class="result-title">${titleText}</div>
          ${(isPreciseLocation || isPreciseTime ? `
            <div class="precise-banner">
              ${isPreciseLocation ? '<span class="precise-badge precise-location">🎯 精准位置猜中！</span>' : ''}
              ${isPreciseTime ? '<span class="precise-badge precise-time">⏱️ 精准时间猜中！</span>' : ''}
            </div>
          ` : '')}
          ${(result.new_achievements && result.new_achievements.length > 0 ? `
            <div class="achievement-unlock-banner">
              <div class="achievement-unlock-title">🎉 新成就解锁！</div>
              ${result.new_achievements.map(a => `
                <div class="achievement-unlock-item">
                  <span class="achievement-unlock-icon">${a.icon || '🏆'}</span>
                  <div class="achievement-unlock-info">
                    <div class="achievement-unlock-name">${a.name}</div>
                    <div class="achievement-unlock-desc">${a.description}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '')}
          <div class="result-card">
            <h3>正确答案</h3>
            <div class="result-info">
              <div>
                <span class="label">事件：</span>
                <span class="value event-title-row">
                  <span class="event-title-text">${result.correct_title}</span>
                  <button class="icon-btn search-event-btn" title="用 Bing 搜索此事件" id="search-event-btn">🔍</button>
                </span>
              </div>
              ${result.correct_description ? `<div><span class="label">说明：</span><span class="value">${result.correct_description}</span></div>` : ''}
              ${result.correct_tips ? `<div><span class="label">小贴士：</span><span class="value">${result.correct_tips}</span></div>` : ''}
              ${result.correct_video_url ? `
                <div class="result-media-item">
                  <span class="label">视频：</span>
                  <div class="result-video-thumbnail" onclick="openVideoPlayer('${escapeHtml(result.correct_video_url)}')">
                    <span class="video-play-icon-small">▶</span>
                    <span class="result-video-url">${escapeHtml(result.correct_video_url)}</span>
                  </div>
                </div>
              ` : ''}
              ${result.correct_audio_url ? `
                <div class="result-media-item">
                  <span class="label">音频：</span>
                  ${(/\.mp3(\?.*)?$/i.test(result.correct_audio_url) ? `
                    <audio controls class="result-audio-player" src="${escapeHtml(result.correct_audio_url)}"></audio>
                  ` : `
                    <div class="result-audio-link" onclick="window.open('${escapeHtml(result.correct_audio_url)}', '_blank')">
                      🔗 在新窗口打开
                    </div>
                  `)}
                </div>
              ` : ''}
              ${!isLocationOnly ? `<div><span class="label">时间：</span><span class="value">${result.correct_start_display}${result.correct_end_display && result.correct_end_display !== result.correct_start_display ? ' ~ ' + result.correct_end_display : ''}</span></div>` : ''}
              <div><span class="label">地点：</span><span class="value">${result.correct_location_name || '未知'}</span></div>
            </div>
            <div class="event-actions-row" id="event-actions-row">
              <button class="vote-btn vote-up-btn" id="vote-up-btn" title="点赞">
                <span class="vote-icon">👍</span>
                <span class="vote-count" id="vote-up-count">0</span>
              </button>
              <button class="vote-btn vote-down-btn" id="vote-down-btn" title="踩">
                <span class="vote-icon">👎</span>
                <span class="vote-count" id="vote-down-count">0</span>
              </button>
              <button class="vote-btn favorite-btn" id="favorite-btn" title="收藏">
                <span class="vote-icon" id="favorite-icon">☆</span>
                <span class="vote-count">收藏</span>
              </button>
            </div>
          </div>
          <div class="result-card">
            <h3>得分</h3>
            <div class="result-score">
              <div class="score-item">
                <div class="score-value ${distanceColor}">${distanceText}</div>
                <div class="score-label">距离</div>
                ${isPreciseLocation ? '<div class="precise-tag">精准</div>' : ''}
              </div>
              ${!isLocationOnly ? `
              <div class="score-item">
                <div class="score-value ${timeColorClass}">${timeDiffText}</div>
                <div class="score-label">时间偏差</div>
                ${isPreciseTime ? '<div class="precise-tag">精准</div>' : ''}
              </div>
              ` : ''}
              <div class="score-item">
                <div class="score-value">${elapsedSeconds.toFixed(1)}</div>
                <div class="score-label">耗时（秒）</div>
              </div>
            </div>
          </div>
          <div class="result-actions">
            <button class="btn btn-success" id="play-again-btn">再来一局</button>
            <button class="btn btn-secondary" id="back-main-btn">返回主界面</button>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    initResultMap(result);
  }, 50);

  document.getElementById('play-again-btn').addEventListener('click', () => {
    cleanupGame();
    startGame();
  });
  document.getElementById('back-main-btn').addEventListener('click', () => {
    cleanupGame();
    renderMainPage();
  });

  document.getElementById('search-event-btn').addEventListener('click', () => {
    const query = encodeURIComponent(result.correct_title);
    window.open(`https://www.bing.com/search?q=${query}`, '_blank');
  });

  if (eventId && appState.user) {
    loadEventVotesAndFavorite(eventId);
    initVoteAndFavoriteHandlers(eventId);
  }
}
