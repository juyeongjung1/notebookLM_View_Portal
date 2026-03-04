// ==========================================
// 管理者パネル用スクリプト
// ==========================================

const ADMIN_PASSWORD_HASH = '151a0ca68cec13f4817ae9324514ff9a09c84a2cc237e6f68b44b163eabf124f';
const STORAGE_KEY = 'notebookLM_portal_items';

// SHA-256ハッシュ生成
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// localStorageからデータを取得
function getStoredItems() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

// localStorageにデータを保存
function saveStoredItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// 管理者パネル全体の制御
document.addEventListener('DOMContentLoaded', () => {
    const adminBtn = document.getElementById('admin-btn');
    const passwordModal = document.getElementById('password-modal');
    const adminPanel = document.getElementById('admin-panel');
    const passwordInput = document.getElementById('admin-password');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordCancel = document.getElementById('password-cancel');
    const passwordError = document.getElementById('password-error');
    const adminClose = document.getElementById('admin-close');

    // フォーム要素
    const addForm = document.getElementById('add-content-form');
    const inputTitle = document.getElementById('input-title');
    const inputCategory = document.getElementById('input-category');
    const inputType = document.getElementById('input-type');
    const inputUrl = document.getElementById('input-url');
    const inputDesc = document.getElementById('input-desc');

    // 管理アイテム一覧
    const adminItemList = document.getElementById('admin-item-list');

    // エクスポートボタン
    const exportBtn = document.getElementById('export-btn');

    let isAuthenticated = false;

    // --- 管理者ボタンのクリック ---
    adminBtn.addEventListener('click', () => {
        if (isAuthenticated) {
            adminPanel.classList.add('visible');
            renderAdminItems();
        } else {
            passwordModal.classList.add('visible');
            passwordInput.value = '';
            passwordError.style.display = 'none';
            passwordInput.focus();
        }
    });

    // --- パスワード認証 ---
    passwordSubmit.addEventListener('click', async () => {
        const hash = await sha256(passwordInput.value);
        if (hash === ADMIN_PASSWORD_HASH) {
            isAuthenticated = true;
            passwordModal.classList.remove('visible');
            adminPanel.classList.add('visible');
            renderAdminItems();
        } else {
            passwordError.style.display = 'block';
        }
    });

    // Enterキーでもパスワード送信
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') passwordSubmit.click();
    });

    // キャンセル
    passwordCancel.addEventListener('click', () => {
        passwordModal.classList.remove('visible');
    });

    // 管理パネルを閉じる
    adminClose.addEventListener('click', () => {
        adminPanel.classList.remove('visible');
        // コンテンツ一覧を再描画（更新があった場合）
        if (typeof renderTabs === 'function') renderTabs();
        if (typeof renderCards === 'function') renderCards();
    });

    // --- コンテンツ追加フォームの送信 ---
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const items = getStoredItems();
        const maxId = items.length > 0 ? Math.max(...items.map(i => i.id)) : (contentData.length > 0 ? Math.max(...contentData.map(i => i.id)) : 0);
        const newItem = {
            id: maxId + 1,
            title: inputTitle.value.trim(),
            category: inputCategory.value.trim(),
            type: inputType.value,
            url: inputUrl.value.trim(),
            description: inputDesc.value.trim()
        };
        items.push(newItem);
        saveStoredItems(items);

        // フォームリセット
        addForm.reset();
        renderAdminItems();

        // メイン画面も更新
        if (typeof renderTabs === 'function') renderTabs();
        if (typeof renderCards === 'function') renderCards();
    });

    // --- 管理アイテム一覧の描画 ---
    function renderAdminItems() {
        adminItemList.innerHTML = '';

        // data.js のデータ
        const baseItems = (typeof contentData !== 'undefined') ? contentData : [];
        // localStorage のデータ
        const storedItems = getStoredItems();

        const allItems = [...baseItems, ...storedItems];

        if (allItems.length === 0) {
            adminItemList.innerHTML = '<p style="color:#6b7280; text-align:center;">まだコンテンツが登録されていません。</p>';
            return;
        }

        allItems.forEach(item => {
            const isStored = storedItems.some(s => s.id === item.id);
            const row = document.createElement('div');
            row.className = 'admin-item-row';
            row.innerHTML = `
        <div class="admin-item-info">
          <strong>${item.title}</strong>
          <span class="badge ${(item.type === 'video' || item.type === 'video-drive') ? 'video' : 'audio'}">${(item.type === 'video' || item.type === 'video-drive') ? '動画' : '音声'}</span>
          <span class="badge category-badge">${item.category || 'その他'}</span>
          ${isStored ? '<span class="badge new-badge">新規</span>' : '<span class="badge base-badge">初期データ</span>'}
        </div>
        <div class="admin-item-url">${item.url}</div>
        ${isStored ? `<button class="admin-delete-btn" data-id="${item.id}">削除</button>` : ''}
      `;
            adminItemList.appendChild(row);
        });

        // 削除ボタンのイベント
        adminItemList.querySelectorAll('.admin-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const items = getStoredItems().filter(i => i.id !== id);
                saveStoredItems(items);
                renderAdminItems();
                if (typeof renderTabs === 'function') renderTabs();
                if (typeof renderCards === 'function') renderCards();
            });
        });
    }

    // --- エクスポート機能 ---
    exportBtn.addEventListener('click', () => {
        const baseItems = (typeof contentData !== 'undefined') ? contentData : [];
        const storedItems = getStoredItems();
        const allItems = [...baseItems, ...storedItems];

        let jsContent = `// ==========================================\n`;
        jsContent += `// 研修コンテンツのリンク管理ファイル\n`;
        jsContent += `// ==========================================\n`;
        jsContent += `// エクスポート日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
        jsContent += `const contentData = [\n`;

        allItems.forEach((item, index) => {
            jsContent += `  {\n`;
            jsContent += `    id: ${index + 1},\n`;
            jsContent += `    category: "${item.category}",\n`;
            jsContent += `    title: "${item.title}",\n`;
            jsContent += `    type: "${item.type}",\n`;
            jsContent += `    description: "${item.description}",\n`;
            jsContent += `    url: "${item.url}"\n`;
            jsContent += `  }${index < allItems.length - 1 ? ',' : ''}\n`;
        });

        jsContent += `];\n`;

        // ダウンロード
        const blob = new Blob([jsContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.js';
        a.click();
        URL.revokeObjectURL(url);
    });
});
