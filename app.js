// ==========================================
// ポータルサイトの動的UI生成スクリプト
// Googleスプレッドシート連携版
// ==========================================

// --- 設定 ---
// Googleスプレッドシートの公開URL（CSV形式）
// ※ スプレッドシートを「ウェブに公開」→ CSV形式で公開したURLを設定
const SHEET_CSV_URL = ''; // ← ここにURLを貼り付け

// YouTube URLからビデオIDを抽出する
function extractYouTubeId(url) {
  if (!url) return null;
  let match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  return null;
}

// Googleドライブ URLからファイルIDを抽出する
function extractGoogleDriveId(url) {
  if (!url) return null;
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// --- CSVパーサー（簡易版） ---
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return []; // ヘッダーのみ or 空

  const headers = parseCSVLine(lines[0]);
  const items = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const item = {};
    headers.forEach((header, index) => {
      const key = header.trim().toLowerCase();
      item[key] = (values[index] || '').trim();
    });
    // IDの自動付番
    item.id = i;
    // 必須フィールドがあれば追加
    if (item.title && item.url) {
      items.push(item);
    }
  }
  return items;
}

// CSVの1行をパース（ダブルクォート対応）
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else if (char !== '\r') {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

// --- Googleスプレッドシートからデータ取得 ---
async function fetchSheetData() {
  if (!SHEET_CSV_URL) {
    console.log('スプレッドシートURLが未設定です。data.jsのデータを使用します。');
    return (typeof contentData !== 'undefined') ? contentData : [];
  }

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csvText = await response.text();
    const items = parseCSV(csvText);
    console.log(`スプレッドシートから ${items.length} 件のデータを読み込みました。`);
    return items;
  } catch (error) {
    console.warn('スプレッドシートの読み込みに失敗しました。data.jsのデータを使用します。', error);
    return (typeof contentData !== 'undefined') ? contentData : [];
  }
}

// --- メイン処理 ---
document.addEventListener('DOMContentLoaded', async () => {
  const listContainer = document.getElementById('content-list');
  const tabsContainer = document.getElementById('category-tabs');
  const loadingEl = document.getElementById('loading-indicator');

  let allItems = [];
  let currentCategory = 'すべて';

  // ローディング表示
  if (loadingEl) loadingEl.style.display = 'block';

  // データ取得
  allItems = await fetchSheetData();

  // ローディング非表示
  if (loadingEl) loadingEl.style.display = 'none';

  // カテゴリ一覧の計算
  function getCategories() {
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
    listContainer.innerHTML = '';

    if (allItems.length === 0) {
      listContainer.innerHTML = '<p style="text-align:center; color:#6b7280; padding: 2rem;">コンテンツがまだ登録されていません。<br>管理者がGoogleスプレッドシートにデータを追加してください。</p>';
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

      // メディア埋め込みの生成
      let mediaHtml = '';
      const youtubeId = extractYouTubeId(item.url);
      const driveId = extractGoogleDriveId(item.url);

      if (youtubeId) {
        mediaHtml = `
          <div class="video-embed-container">
            <iframe src="https://www.youtube.com/embed/${youtubeId}" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
          </div>`;
      } else if (driveId && isVideo) {
        mediaHtml = `
          <div class="video-embed-container">
            <iframe src="https://drive.google.com/file/d/${driveId}/preview" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen></iframe>
          </div>`;
      } else if (driveId && !isVideo) {
        mediaHtml = `
          <div class="audio-player">
            <audio controls preload="none">
              <source src="https://drive.google.com/uc?export=download&id=${driveId}" type="audio/mpeg">
              お使いのブラウザでは音声を再生できません。
            </audio>
          </div>`;
      } else {
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
        <p class="card-desc">${item.description || ''}</p>
        ${mediaHtml}
      `;

      listContainer.appendChild(cardEl);
    });
  };

  // 初回描画
  renderTabs();
  renderCards();
});
