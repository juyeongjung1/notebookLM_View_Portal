// ==========================================
// ポータルサイトの動的UI生成スクリプト
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  const listContainer = document.getElementById('content-list');
  const tabsContainer = document.getElementById('category-tabs');

  // データがない場合の処理
  if (!contentData || contentData.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center; color:#6b7280;">コンテンツがまだ登録されていません。</p>';
    return;
  }

  // カテゴリ一覧の抽出 (重複排除)
  const categories = ['すべて', ...new Set(contentData.map(item => item.category || 'その他'))];

  // 現在選択されているカテゴリ
  let currentCategory = 'すべて';

  // 1. カテゴリタブの生成
  function renderTabs() {
    tabsContainer.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `tab-btn ${cat === currentCategory ? 'active' : ''}`;
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        currentCategory = cat;
        // タブの見た目を更新
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // リストを再描画
        renderCards();
      });
      tabsContainer.appendChild(btn);
    });
  }

  // 2. カードの生成処理
  function renderCards() {
    listContainer.innerHTML = ''; // クリア

    // カテゴリでフィルタリング
    const filteredData = currentCategory === 'すべて'
      ? contentData
      : contentData.filter(item => (item.category || 'その他') === currentCategory);

    if (filteredData.length === 0) {
      listContainer.innerHTML = '<p style="text-align:center; color:#6b7280;">該当するコンテンツがありません。</p>';
      return;
    }

    filteredData.forEach((item, index) => {
      // アニメーション遅延を設定して順に表示（少しのリッチ感）
      const delay = index * 0.05;

      const isVideo = item.type === 'video';
      const badgeClass = isVideo ? 'badge video' : 'badge audio';
      const badgeText = isVideo ? '動画' : '音声';
      const categoryText = item.category || 'その他';

      const iconSvg = isVideo
        ? `<svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z"/></svg>`
        : `<svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1a7 7 0 0 1 14 0v1h-4v8h4a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z"/></svg>`;

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
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-play">
          ${iconSvg}
          <span>いますぐ再生する</span>
        </a>
      `;

      listContainer.appendChild(cardEl);
    });
  }

  // 初回描画の実行
  renderTabs();
  renderCards();
});
