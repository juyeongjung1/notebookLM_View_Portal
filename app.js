// ==========================================
// ポータルサイトの動的UI生成スクリプト
// ==========================================

// YouTube URLからビデオIDを抽出する
function extractYouTubeId(url) {
  if (!url) return null;
  // https://www.youtube.com/watch?v=VIDEO_ID
  let match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  // https://youtu.be/VIDEO_ID
  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  // https://www.youtube.com/embed/VIDEO_ID
  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  return null;
}

// Googleドライブ URLからファイルIDを抽出する
function extractGoogleDriveId(url) {
  if (!url) return null;
  // https://drive.google.com/file/d/FILE_ID/view
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// localStorageの管理データを取得
function getStoredItems() {
  try {
    const data = localStorage.getItem('notebookLM_portal_items');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// すべてのデータの統合（data.js + localStorage）
function getAllItems() {
  const baseItems = (typeof contentData !== 'undefined') ? contentData : [];
  const storedItems = getStoredItems();
  return [...baseItems, ...storedItems];
}

document.addEventListener('DOMContentLoaded', () => {
  const listContainer = document.getElementById('content-list');
  const tabsContainer = document.getElementById('category-tabs');

  let currentCategory = 'すべて';

  // カテゴリ一覧の再計算
  function getCategories() {
    const allItems = getAllItems();
    return ['すべて', ...new Set(allItems.map(item => item.category || 'その他'))];
  }

  // 1. カテゴリタブの生成
  window.renderTabs = function () {
    const categories = getCategories();
    tabsContainer.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `tab-btn ${cat === currentCategory ? 'active' : ''}`;
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        currentCategory = cat;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCards();
      });
      tabsContainer.appendChild(btn);
    });
  };

  // 2. カードの生成処理
  window.renderCards = function () {
    const allItems = getAllItems();
    listContainer.innerHTML = '';

    if (allItems.length === 0) {
      listContainer.innerHTML = '<p style="text-align:center; color:#6b7280;">コンテンツがまだ登録されていません。</p>';
      return;
    }

    const filteredData = currentCategory === 'すべて'
      ? allItems
      : allItems.filter(item => (item.category || 'その他') === currentCategory);

    if (filteredData.length === 0) {
      listContainer.innerHTML = '<p style="text-align:center; color:#6b7280;">該当するコンテンツがありません。</p>';
      return;
    }

    filteredData.forEach((item, index) => {
      const delay = index * 0.05;
      const isVideo = item.type === 'video' || item.type === 'video-drive';
      const badgeClass = isVideo ? 'badge video' : 'badge audio';
      const badgeText = isVideo ? '動画' : '音声';
      const categoryText = item.category || 'その他';

      // YouTube or Googleドライブ の埋め込み生成
      let mediaHtml = '';
      const youtubeId = extractYouTubeId(item.url);
      const driveId = extractGoogleDriveId(item.url);

      if (youtubeId) {
        // YouTubeをiframeで埋め込み
        mediaHtml = `
          <div class="video-embed-container">
            <iframe src="https://www.youtube.com/embed/${youtubeId}" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
          </div>`;
      } else if (driveId && isVideo) {
        // Googleドライブの動画をiframeプレビューで埋め込み
        mediaHtml = `
          <div class="video-embed-container">
            <iframe src="https://drive.google.com/file/d/${driveId}/preview" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen></iframe>
          </div>`;
      } else if (driveId && !isVideo) {
        // Googleドライブの音声をHTMLプレイヤーで埋め込み
        mediaHtml = `
          <div class="audio-player">
            <audio controls preload="none">
              <source src="https://drive.google.com/uc?export=download&id=${driveId}" type="audio/mpeg">
              お使いのブラウザでは音声を再生できません。
            </audio>
          </div>`;
      } else {
        // その他の場合は外部リンクボタン
        const iconSvg = isVideo
          ? `<svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z"/></svg>`
          : `<svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1a7 7 0 0 1 14 0v1h-4v8h4a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z"/></svg>`;
        mediaHtml = `
          <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-play">
            ${iconSvg}
            <span>いますぐ再生する</span>
          </a>`;
      }

      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.style.animationDelay = `${delay}s`;

      cardEl.innerHTML = `
        <div class="card-header">
          <h2 class="card-title">${item.title}</h2>
          <div class="badges-container">
            <span class="badge category-badge">${categoryText}</span>
            <span class="${badgeClass}">${badgeText}</span>
          </div>
        </div>
        <p class="card-desc">${item.description}</p>
        ${mediaHtml}
      `;

      listContainer.appendChild(cardEl);
    });
  };

  // 初回描画の実行
  renderTabs();
  renderCards();
});
