// ==========================================
// ポータルサイトの動的UI生成スクリプト
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('content-list');

    // data.jsに定義された contentData をもとにHTMLを生成
    if (!contentData || contentData.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color:#6b7280;">コンテンツがまだ登録されていません。</p>';
        return;
    }

    contentData.forEach(item => {
        // タイプに応じたラベルとSVGアイコンの設定
        const isVideo = item.type === 'video';
        const badgeClass = isVideo ? 'badge video' : 'badge audio';
        const badgeText = isVideo ? '動画' : '音声';

        // アイコン (動画: 再生マーク, 音声: ヘッドフォンマーク風)
        const iconSvg = isVideo
            ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
            : `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`;

        // カード要素の作成
        const cardEl = document.createElement('div');
        cardEl.className = 'card';

        cardEl.innerHTML = `
      <div class="card-header">
        <h2 class="card-title">${item.title}</h2>
        <span class="${badgeClass}">${badgeText}</span>
      </div>
      <p class="card-desc">${item.description}</p>
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-play">
        ${iconSvg}
        <span>いますぐ再生する</span>
      </a>
    `;

        listContainer.appendChild(cardEl);
    });
});
