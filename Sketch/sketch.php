<?php

$UPLOAD_DIR = __DIR__ . '/uploads/';
$SKETCH_DIR = __DIR__ . '/sketches/';
$MAX_FILE_SIZE = 10 * 1024 * 1024;
$ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function ensureDir($path) {
    if (!file_exists($path)) mkdir($path, 0755, true);
    return $path;
}

ensureDir($UPLOAD_DIR);
ensureDir($SKETCH_DIR);

// 用于保存上传的原图到服务器
$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 处理文件上传（原图）
    if (isset($_FILES['image'])) {
        $file = $_FILES['image'];
        if ($file['error'] === UPLOAD_ERR_OK && $file['size'] <= $MAX_FILE_SIZE && in_array($file['type'], $ALLOWED_TYPES)) {
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $uniqueId = uniqid() . '_' . time();
            $dateDir = date('Y-m-d') . '/';
            $uploadPath = ensureDir($UPLOAD_DIR . $dateDir) . $uniqueId . '_original.' . $ext;
            if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                $serverOriginalUrl = 'uploads/' . $dateDir . $uniqueId . '_original.' . $ext;
                $message = '图片已上传到服务器';
                $messageType = 'success';
            }
        }
    }

    // 处理素描图base64数据保存
    if (isset($_POST['sketchData']) && isset($_POST['fileName'])) {
        $sketchData = $_POST['sketchData'];
        $fileName = preg_replace('/[^a-zA-Z0-9\-_\.]/', '', $_POST['fileName']);

        // 提取base64数据
        $imgData = substr($sketchData, strpos($sketchData, ",") + 1);
        $imgData = str_replace(' ', '+', $imgData);
        $decodedData = base64_decode($imgData);

        if ($decodedData !== false) {
            $dateDir = date('Y-m-d') . '/';
            $uniqueId = uniqid() . '_' . time();
            $sketchPath = ensureDir($SKETCH_DIR . $dateDir) . $uniqueId . '_sketch.png';

            if (file_put_contents($sketchPath, $decodedData)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => true, 'path' => str_replace(__DIR__ . '/', '', $sketchPath)]);
                exit;
            }
        }

        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => '保存失败']);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎨 照片转素描工具</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
            background: #f0f0f0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .title {
            font-size: 28px; font-weight: bold; color: #333;
            margin: 20px 0; text-align: center;
        }
        .btn-area {
            display: flex; gap: 15px; margin-bottom: 15px;
            flex-wrap: wrap; justify-content: center;
        }
        .btn {
            font-family: "Microsoft YaHei", sans-serif; font-size: 14px;
            color: white; border: none; border-radius: 4px;
            padding: 12px 24px; cursor: pointer; transition: opacity 0.2s;
            min-width: 140px; height: 44px;
            display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .btn:hover { opacity: 0.9; }
        .btn:active { opacity: 0.8; }
        .btn-upload { background: #4CAF50; }
        .btn-download { background: #2196F3; }
        .btn-download:disabled { background: #90CAF9; cursor: not-allowed; }
        .btn-clear { background: #f44336; }
        .display-area {
            display: flex; align-items: center; gap: 20px;
            margin: 15px 0; flex-wrap: wrap; justify-content: center;
        }
        .img-box {
            width: 450px; height: 450px; background: white;
            border: 2px solid #ddd; border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            position: relative; overflow: hidden;
        }
        .img-box-title {
            position: absolute; top: 10px; left: 15px;
            font-size: 14px; font-weight: bold; color: #333;
            background: rgba(255,255,255,0.9); padding: 4px 10px;
            border-radius: 4px; z-index: 10;
        }
        .img-box canvas, .img-box img {
            max-width: 100%; max-height: 100%; object-fit: contain;
        }
        .placeholder-text {
            color: #666; font-size: 16px; text-align: center; line-height: 1.6;
        }
        .arrow { font-size: 30px; color: #666; }
        .param-area {
            display: flex; align-items: center; gap: 15px;
            margin: 10px 0; background: white; padding: 12px 24px;
            border-radius: 8px; border: 1px solid #ddd;
        }
        .param-area label { font-size: 14px; color: #333; white-space: nowrap; }
        .slider-container { display: flex; align-items: center; gap: 10px; }
        input[type="range"] { width: 200px; cursor: pointer; }
        .blur-value { font-size: 14px; color: #666; min-width: 30px; }
        .btn-apply {
            background: #FF9800; min-width: 80px; height: 36px; padding: 0 16px;
        }
        .status-bar {
            width: 100%; max-width: 1000px; padding: 10px 20px;
            font-size: 13px; color: #666; background: #f0f0f0;
            border-top: 1px solid #ddd; margin-top: auto;
        }
        #fileInput { display: none; }
        .hidden-canvas { display: none; }

        /* 历史记录 */
        .history-area {
            margin-top: 30px; padding-top: 20px;
            border-top: 2px solid #eee;
            width: 100%; max-width: 1000px;
        }
        .history-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; }
        .history-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }
        .history-item {
            background: #f8f9fa; border-radius: 8px; overflow: hidden;
            cursor: pointer; transition: transform 0.2s; position: relative;
        }
        .history-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .history-item img { width: 100%; height: 150px; object-fit: cover; }
        .history-item-info {
            padding: 10px; font-size: 12px; color: #666;
            display: flex; justify-content: space-between; align-items: center;
        }
        .history-delete-btn {
            background: #f44336; color: white; border: none;
            border-radius: 4px; padding: 4px 8px; font-size: 11px;
            cursor: pointer; transition: opacity 0.2s;
        }
        .history-delete-btn:hover { opacity: 0.8; }
        .message {
            padding: 12px 20px; border-radius: 8px; margin-bottom: 15px;
            text-align: center; font-size: 14px;
            width: 100%; max-width: 1000px;
        }
        .message.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .message.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .file-info {
            background: #f8f9fa; padding: 12px 20px; border-radius: 8px;
            margin: 15px 0; font-size: 13px; color: #666;
            width: 100%; max-width: 1000px;
        }
        .file-info strong { color: #333; }

        @media (max-width: 1000px) {
            .img-box { width: 90vw; height: 90vw; max-width: 450px; max-height: 450px; }
            .arrow { transform: rotate(90deg); }
            .display-area { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="title">🎨 照片转素描工具</div>

    <?php if ($message): ?>
    <div class="message <?php echo $messageType; ?>">
        <?php echo htmlspecialchars($message); ?>
    </div>
    <?php endif; ?>

    <div class="btn-area">
        <button type="button" class="btn btn-upload" onclick="document.getElementById('fileInput').click()">
            📁 上传图片
        </button>
        <button type="button" class="btn btn-download" id="downloadBtn" onclick="downloadImage()" disabled>
            💾 下载素描图
        </button>
        <button type="button" class="btn btn-clear" onclick="clearAll()">
            🗑️ 清空
        </button>
    </div>

    <input type="file" id="fileInput" accept="image/*" onchange="handleFile(event)">

    <div class="param-area">
        <label>模糊强度:</label>
        <div class="slider-container">
            <input type="range" id="blurSlider" min="1" max="100" value="19" oninput="updateBlurValue(this.value)">
            <span class="blur-value" id="blurValue">19</span>
        </div>
        <button type="button" class="btn btn-apply" onclick="reapplySketch()">应用</button>
    </div>

    <div class="display-area">
        <div class="img-box" id="originalBox">
            <div class="img-box-title">原图预览</div>
            <div class="placeholder-text" id="originalPlaceholder">
                暂无图片<br>点击上方按钮上传
            </div>
            <canvas id="originalCanvas" class="hidden-canvas"></canvas>
        </div>

        <div class="arrow">➡️</div>

        <div class="img-box" id="resultBox">
            <div class="img-box-title">素描结果预览</div>
            <div class="placeholder-text" id="resultPlaceholder">
                处理后的素描图<br>将显示在这里
            </div>
            <canvas id="resultCanvas" class="hidden-canvas"></canvas>
        </div>
    </div>

    <div class="status-bar" id="statusBar">就绪 - 请上传图片</div>

    <!-- 历史记录 -->
    <div class="history-area">
        <div class="history-title">📚 最近处理记录</div>
        <div class="history-grid" id="historyGrid">
            <!-- 历史记录由JS从IndexedDB动态加载 -->
        </div>
    </div>

    <script>
        let originalImageData = null;
        let originalFileName = '';
        let originalWidth = 0;
        let originalHeight = 0;
        let currentServerUrl = '';

        // ========== IndexedDB 管理 ==========
        const DB_NAME = 'SketchToolDB';
        const DB_VERSION = 1;
        const STORE_NAME = 'history';
        let db = null;

        function initDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    db = request.result;
                    resolve(db);
                };

                request.onupgradeneeded = (event) => {
                    const database = event.target.result;
                    if (!database.objectStoreNames.contains(STORE_NAME)) {
                        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                        store.createIndex('time', 'time', { unique: false });
                    }
                };
            });
        }

        async function saveToHistory(originalDataUrl, sketchDataUrl, fileName, width, height, blurValue) {
            if (!db) await initDB();

            const id = 'sketch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const record = {
                id: id,
                originalDataUrl: originalDataUrl,
                sketchDataUrl: sketchDataUrl,
                fileName: fileName,
                width: width,
                height: height,
                blurValue: blurValue,
                time: Date.now()
            };

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.add(record);

                request.onsuccess = () => {
                    // 只保留最近20条记录
                    cleanupOldHistory();
                    resolve(id);
                };
                request.onerror = () => reject(request.error);
            });
        }

        async function getAllHistory() {
            if (!db) await initDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const index = store.index('time');
                const request = index.openCursor(null, 'prev');

                const results = [];
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        results.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(results);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        }

        async function deleteHistoryById(id) {
            if (!db) await initDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(id);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        async function cleanupOldHistory() {
            if (!db) return;

            const all = await getAllHistory();
            if (all.length > 20) {
                const toDelete = all.slice(20);
                for (const item of toDelete) {
                    await deleteHistoryById(item.id);
                }
            }
        }

        // ========== 渲染历史记录 ==========
        async function renderHistory() {
            const grid = document.getElementById('historyGrid');
            const history = await getAllHistory();

            if (history.length === 0) {
                grid.innerHTML = '<div style="color:#999;text-align:center;padding:20px;">暂无历史记录</div>';
                return;
            }

            grid.innerHTML = history.map(item => `
                <div class="history-item" id="history-${item.id}" onclick="loadHistoryItem('${item.id}')">
                    <img src="${item.sketchDataUrl}" alt="历史记录">
                    <div class="history-item-info">
                        <span>${new Date(item.time).toLocaleString('zh-CN')}</span>
                        <button type="button" class="history-delete-btn" onclick="event.stopPropagation(); deleteHistoryItem('${item.id}')">
                            删除记录
                        </button>
                    </div>
                </div>
            `).join('');
        }

        async function loadHistoryItem(id) {
            if (!db) await initDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(id);

                request.onsuccess = () => {
                    const item = request.result;
                    if (!item) {
                        alert('记录不存在');
                        return;
                    }

                    // 加载原图
                    const img = new Image();
                    img.onload = function() {
                        const origCanvas = document.getElementById('originalCanvas');
                        origCanvas.width = img.width;
                        origCanvas.height = img.height;
                        const origCtx = origCanvas.getContext('2d');
                        origCtx.drawImage(img, 0, 0);
                        originalImageData = origCtx.getImageData(0, 0, img.width, img.height);
                        originalWidth = img.width;
                        originalHeight = img.height;
                        originalFileName = item.fileName;
                        showCanvas('originalCanvas', 'originalPlaceholder');
                    };
                    img.src = item.originalDataUrl;

                    // 加载素描图
                    const img2 = new Image();
                    img2.onload = function() {
                        const resultCanvas = document.getElementById('resultCanvas');
                        resultCanvas.width = img2.width;
                        resultCanvas.height = img2.height;
                        const resultCtx = resultCanvas.getContext('2d');
                        resultCtx.drawImage(img2, 0, 0);
                        showCanvas('resultCanvas', 'resultPlaceholder');
                        document.getElementById('downloadBtn').disabled = false;
                    };
                    img2.src = item.sketchDataUrl;

                    // 恢复模糊参数
                    document.getElementById('blurSlider').value = item.blurValue || 19;
                    document.getElementById('blurValue').textContent = item.blurValue || 19;

                    document.getElementById('statusBar').textContent = '已加载历史记录 | ' + item.fileName;
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        }

        async function deleteHistoryItem(itemId) {
            if (!confirm('确定要删除这条记录吗？此操作将从浏览器本地存储中永久删除。')) return;

            await deleteHistoryById(itemId);

            const item = document.getElementById('history-' + itemId);
            if (item) {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '0';
                item.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    item.remove();
                    const grid = document.getElementById('historyGrid');
                    if (grid.children.length === 0) {
                        grid.innerHTML = '<div style="color:#999;text-align:center;padding:20px;">暂无历史记录</div>';
                    }
                }, 300);
            }

            document.getElementById('statusBar').textContent = '记录已删除';
        }

        function updateBlurValue(val) {
            document.getElementById('blurValue').textContent = val;
        }

        function handleFile(event) {
            const file = event.target.files[0];
            if (!file) return;

            // 上传到服务器（用于历史记录）
            uploadToServer(file);

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    originalWidth = img.width;
                    originalHeight = img.height;
                    originalFileName = file.name;

                    const origCanvas = document.getElementById('originalCanvas');
                    origCanvas.width = originalWidth;
                    origCanvas.height = originalHeight;
                    const origCtx = origCanvas.getContext('2d');
                    origCtx.drawImage(img, 0, 0);

                    originalImageData = origCtx.getImageData(0, 0, originalWidth, originalHeight);

                    showCanvas('originalCanvas', 'originalPlaceholder');

                    document.getElementById('statusBar').textContent = 
                        '已加载: ' + file.name + ' | 尺寸: ' + originalWidth + 'x' + originalHeight;

                    // 自动生成素描
                    generateSketch();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function uploadToServer(file) {
            const formData = new FormData();
            formData.append('image', file);

            fetch(window.location.pathname, {
                method: 'POST',
                body: formData
            }).then(response => response.text()).then(() => {
                // 静默上传，不处理返回
            }).catch(err => console.log('上传失败:', err));
        }

        function showCanvas(canvasId, placeholderId) {
            document.getElementById(canvasId).classList.remove('hidden-canvas');
            document.getElementById(placeholderId).style.display = 'none';
        }

        function hideCanvas(canvasId, placeholderId) {
            document.getElementById(canvasId).classList.add('hidden-canvas');
            document.getElementById(placeholderId).style.display = 'block';
        }

        // ========== 纯 JS 高斯模糊实现 ==========
        function getGaussianKernel(size, sigma) {
            const kernel = [];
            const center = (size - 1) / 2;
            let sum = 0;
            for (let i = 0; i < size; i++) {
                const x = i - center;
                const val = Math.exp(-(x * x) / (2 * sigma * sigma));
                kernel.push(val);
                sum += val;
            }
            for (let i = 0; i < size; i++) {
                kernel[i] /= sum;
            }
            return kernel;
        }

        function gaussianBlur(srcData, width, height, kernelSize) {
            const sigma = 0.3 * ((kernelSize - 1) * 0.5 - 1) + 0.8;
            const kernel = getGaussianKernel(kernelSize, sigma);
            const half = Math.floor(kernelSize / 2);

            const temp = new Float32Array(width * height);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let sum = 0;
                    for (let k = 0; k < kernelSize; k++) {
                        const px = x + k - half;
                        const clampedX = Math.max(0, Math.min(width - 1, px));
                        sum += srcData[y * width + clampedX] * kernel[k];
                    }
                    temp[y * width + x] = sum;
                }
            }

            const dst = new Float32Array(width * height);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let sum = 0;
                    for (let k = 0; k < kernelSize; k++) {
                        const py = y + k - half;
                        const clampedY = Math.max(0, Math.min(height - 1, py));
                        sum += temp[clampedY * width + x] * kernel[k];
                    }
                    dst[y * width + x] = sum;
                }
            }

            return dst;
        }

        // ========== 核心素描算法 ==========
        async function generateSketch(saveToDb = true) {
            if (!originalImageData) return;

            const w = originalWidth;
            const h = originalHeight;
            const totalPixels = w * h;
            const origData = originalImageData.data;

            // 1. 灰度转换
            const gray = new Uint8Array(totalPixels);
            for (let i = 0; i < totalPixels; i++) {
                const idx = i * 4;
                gray[i] = 0.114 * origData[idx] + 0.587 * origData[idx + 1] + 0.299 * origData[idx + 2];
            }

            // 2. 反转灰度图
            const invGray = new Uint8Array(totalPixels);
            for (let i = 0; i < totalPixels; i++) {
                invGray[i] = 255 - gray[i];
            }

            // 3. 高斯模糊
            let blurVal = parseInt(document.getElementById('blurSlider').value);
            if (blurVal % 2 === 0) blurVal += 1;

            const blurred = gaussianBlur(invGray, w, h, blurVal);

            // 4. 反转模糊图
            const invBlurred = new Float32Array(totalPixels);
            for (let i = 0; i < totalPixels; i++) {
                invBlurred[i] = 255 - blurred[i];
            }

            // 5. cv2.divide(gray, inverted_blurred, scale=256.0)
            const sketch = new Uint8Array(totalPixels);
            for (let i = 0; i < totalPixels; i++) {
                const grayVal = gray[i];
                const invBlurVal = invBlurred[i];

                let sketchVal;
                if (invBlurVal <= 0) {
                    sketchVal = 255;
                } else {
                    sketchVal = Math.min(255, (grayVal / invBlurVal) * 256.0);
                }
                sketch[i] = sketchVal;
            }

            // 绘制到结果 canvas
            const resultCanvas = document.getElementById('resultCanvas');
            resultCanvas.width = w;
            resultCanvas.height = h;
            const resultCtx = resultCanvas.getContext('2d');
            const resultImgData = resultCtx.createImageData(w, h);
            const resultData = resultImgData.data;

            for (let i = 0; i < totalPixels; i++) {
                const idx = i * 4;
                const val = sketch[i];
                resultData[idx] = val;
                resultData[idx + 1] = val;
                resultData[idx + 2] = val;
                resultData[idx + 3] = 255;
            }
            resultCtx.putImageData(resultImgData, 0, 0);

            showCanvas('resultCanvas', 'resultPlaceholder');
            document.getElementById('downloadBtn').disabled = false;
            document.getElementById('statusBar').textContent = '素描生成完成 | 模糊强度: ' + blurVal;

            // 保存到 IndexedDB 历史记录（仅在首次生成时保存，重新应用参数时不重复保存）
            if (saveToDb) {
                const origCanvas = document.getElementById('originalCanvas');
                const originalDataUrl = origCanvas.toDataURL('image/png');
                const sketchDataUrl = resultCanvas.toDataURL('image/png');

                // 保存到本地 IndexedDB
                await saveToHistory(originalDataUrl, sketchDataUrl, originalFileName, w, h, blurVal);
                await renderHistory();

                // 同时保存素描图到服务器
                try {
                    const formData = new FormData();
                    formData.append('sketchData', sketchDataUrl);
                    formData.append('fileName', originalFileName);

                    fetch(window.location.pathname, {
                        method: 'POST',
                        body: formData
                    }).then(response => response.json()).then(result => {
                        if (result.success) {
                            console.log('素描图已保存到服务器:', result.path);
                        }
                    }).catch(err => console.log('服务器保存素描图失败:', err));
                } catch (err) {
                    console.log('服务器保存素描图失败:', err);
                }
            }
        }

        function reapplySketch() {
            if (originalImageData) {
                generateSketch(true);  // 保存到历史记录，每次调整参数都保存
                document.getElementById('statusBar').textContent = '已重新应用模糊参数并保存';
            } else {
                alert('请先上传图片！');
            }
        }

        async function downloadImage() {
            const resultCanvas = document.getElementById('resultCanvas');
            if (resultCanvas.classList.contains('hidden-canvas')) {
                alert('没有可下载的图片！');
                return;
            }

            const sketchDataUrl = resultCanvas.toDataURL('image/png');
            const downloadName = 'sketch_' + originalFileName.replace(/\.[^/.]+$/, '') + '.png';

            // 1. 本地浏览器下载
            const link = document.createElement('a');
            link.download = downloadName;
            link.href = sketchDataUrl;
            link.click();

            // 2. 同时保存到服务器
            document.getElementById('statusBar').textContent = '正在保存到服务器...';

            try {
                const formData = new FormData();
                formData.append('sketchData', sketchDataUrl);
                formData.append('fileName', downloadName);

                const response = await fetch(window.location.pathname, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (result.success) {
                    document.getElementById('statusBar').textContent = '已下载并保存到服务器: ' + downloadName;
                } else {
                    document.getElementById('statusBar').textContent = '已下载（服务器保存失败）: ' + downloadName;
                }
            } catch (err) {
                document.getElementById('statusBar').textContent = '已下载（服务器保存失败）: ' + downloadName;
                console.log('服务器保存失败:', err);
            }
        }

        function clearAll() {
            originalImageData = null;
            originalFileName = '';
            originalWidth = 0;
            originalHeight = 0;

            hideCanvas('originalCanvas', 'originalPlaceholder');
            hideCanvas('resultCanvas', 'resultPlaceholder');

            document.getElementById('downloadBtn').disabled = true;
            document.getElementById('statusBar').textContent = '就绪 - 请上传图片';
            document.getElementById('fileInput').value = '';
        }

        // ========== 初始化 ==========
        document.addEventListener('DOMContentLoaded', async function() {
            await initDB();
            await renderHistory();
        });
    </script>
</body>
</html>