// app.js - 在线答题练习系统核心逻辑

// ==================== 示例题目数据 ====================
const demoQuestions = [
    {
        type: 'single',
        title: 'TCP/IP协议中，IP协议位于哪一层？',
        options: ['应用层', '传输层', '网络层', '数据链路层'],
        answer: 'C'
    },
    {
        type: 'multi',
        title: '以下哪些是合法的IP地址？（多选）',
        options: ['192.168.1.1', '256.1.1.1', '10.0.0.1', '172.16.0.1'],
        answer: ['A', 'C', 'D']
    },
    {
        type: 'judge',
        title: '子网掩码中，二进制的"1"代表网络部分。',
        options: ['对', '错'],
        answer: 'A'
    },
    {
        type: 'fill',
        title: 'IPv4地址使用____位二进制数表示。',
        answer: '32'
    },
    {
        type: 'essay',
        title: '请画出TCP三次握手的过程，并简要说明每一步的作用。',
        options: [],
        answer: '第一次握手：客户端发送SYN包到服务器，请求建立连接；\n第二次握手：服务器收到SYN包，回复SYN+ACK包，确认收到请求；\n第三次握手：客户端收到SYN+ACK包，回复ACK包，连接建立。'
    },
    {
        type: 'essay',
        title: '根据下图分析网络拓扑结构，指出其中的单点故障并给出改进方案。',
        attachment: '',
        options: [],
        answer: '单点故障：核心交换机为单点故障；\n改进方案：增加冗余核心交换机，使用HSRP/VRRP协议实现热备份。'
    }
];

// ==================== 状态变量 ====================
let questions = [];
let currentIndex = 0;
let userAnswers = {};
let submitted = false;
let editingIndex = -1;
let tempAttachment = null;

const typeConfig = {
    single: { label: '单选题', class: 'badge-single' },
    multi: { label: '多选题', class: 'badge-multi' },
    judge: { label: '判断题', class: 'badge-judge' },
    fill: { label: '填空题', class: 'badge-fill' },
    essay: { label: '大题', class: 'badge-essay' }
};

const typeLabels = {
    single: '单选',
    multi: '多选',
    judge: '判断',
    fill: '填空',
    essay: '大题'
};

// ==================== 初始化 ====================
function init() {
    renderQuestionList();
    onTypeChange();

    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeJsonModal();
        }
    });
}

// ==================== 题目管理 ====================
function renderQuestionList() {
    const list = document.getElementById('questionList');

    if (questions.length === 0) {
        list.innerHTML = '<div class="empty-list">📭 暂无题目，请添加题目或导入JSON文件</div>';
        document.getElementById('startBtn').style.display = 'none';
        return;
    }

    list.innerHTML = questions.map((q, i) => {
        const typeLabel = typeLabels[q.type];
        const answerPreview = Array.isArray(q.answer) ? q.answer.join(',') : (q.answer || '').substring(0, 30);
        const hasAttachment = q.attachment ? '📷 ' : '';
        return `
            <div class="question-list-item">
                <div class="question-list-num">${i + 1}</div>
                <div class="question-list-info">
                    <div class="question-list-title">${hasAttachment}${escapeHtml(q.title)}</div>
                    <div class="question-list-meta">[${typeLabel}] 答案: ${escapeHtml(answerPreview)}${q.answer && q.answer.length > 30 ? '...' : ''}</div>
                </div>
                <div class="question-list-actions">
                    <button class="btn-small btn-edit" onclick="editQuestion(${i})">✏️ 编辑</button>
                    <button class="btn-small btn-delete" onclick="deleteQuestion(${i})">🗑️ 删除</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('startBtn').style.display = 'inline-flex';
}

function onTypeChange() {
    const type = document.getElementById('formType').value;
    const optionsRow = document.getElementById('formOptionsRow');
    const attachmentRow = document.getElementById('formAttachmentRow');
    const answerInput = document.getElementById('formAnswer');

    if (type === 'essay') {
        optionsRow.style.display = 'none';
        attachmentRow.style.display = 'block';
        answerInput.placeholder = '大题参考答案（提交后会显示给用户对照）';
    } else if (type === 'fill') {
        optionsRow.style.display = 'none';
        attachmentRow.style.display = 'none';
        answerInput.placeholder = '填空答案，多个正确答案用英文逗号分隔';
    } else if (type === 'judge') {
        optionsRow.style.display = 'none';
        attachmentRow.style.display = 'none';
        answerInput.placeholder = '填 A(对) 或 B(错)';
    } else {
        optionsRow.style.display = 'block';
        attachmentRow.style.display = 'none';
        if (type === 'multi') {
            answerInput.placeholder = '多选答案，如: A,C,D';
        } else {
            answerInput.placeholder = '单选答案，如: A';
        }
    }
}

function handleAttachmentUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        tempAttachment = e.target.result;
        document.getElementById('attachmentPreviewImg').src = tempAttachment;
        document.getElementById('attachmentPreview').style.display = 'flex';
        document.querySelector('.upload-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function removeAttachment() {
    tempAttachment = null;
    document.getElementById('attachmentPreview').style.display = 'none';
    const placeholder = document.querySelector('.upload-placeholder');
    if (placeholder) placeholder.style.display = 'block';
    document.getElementById('formAttachment').value = '';
}

function saveQuestion() {
    const type = document.getElementById('formType').value;
    const title = document.getElementById('formTitle').value.trim();
    const optionsText = document.getElementById('formOptions').value.trim();
    const answerText = document.getElementById('formAnswer').value.trim();

    if (!title) {
        alert('请输入题目内容！');
        return;
    }

    let options = [];
    let answer = answerText;
    let attachments = tempAttachments.length > 0 ? [...tempAttachments] : [];

    if (type === 'fill') {
        if (!answerText) {
            alert('请输入正确答案！');
            return;
        }
        answer = answerText.includes(',') ? answerText.split(',').map(s => s.trim()) : answerText;
    } else if (type === 'judge') {
        options = ['对', '错'];
        answer = answerText.toUpperCase();
        if (answer !== 'A' && answer !== 'B') {
            alert('判断题答案只能填 A(对) 或 B(错)！');
            return;
        }
    } else if (type === 'essay') {
        options = [];
    } else {
        if (!optionsText) {
            alert('请输入选项！');
            return;
        }
        options = optionsText.split('\n').map(s => s.trim()).filter(s => s);
        if (options.length < 2) {
            alert('至少需要2个选项！');
            return;
        }

        if (!answerText) {
            alert('请输入正确答案！');
            return;
        }

        if (type === 'multi') {
            answer = answerText.toUpperCase().split(',').map(s => s.trim()).filter(s => s);
            if (answer.length < 2) {
                alert('多选题至少需要2个正确答案！');
                return;
            }
        } else {
            answer = answerText.toUpperCase();
        }
    }

    const question = { type, title, options, answer };
    if (attachments.length > 0) {
        question.attachments = attachments;
    }

    if (editingIndex >= 0) {
        if (!attachment && questions[editingIndex].attachment) {
            question.attachment = questions[editingIndex].attachment;
        }
        questions[editingIndex] = question;
        editingIndex = -1;
    } else {
        questions.push(question);
    }

    renderQuestionList();
    clearForm();
}

function editQuestion(index) {
    const q = questions[index];
    editingIndex = index;

    document.getElementById('formType').value = q.type;
    document.getElementById('formTitle').value = q.title;

    onTypeChange();

    if (q.attachment) {
        tempAttachment = q.attachment;
        document.getElementById('attachmentPreviewImg').src = q.attachment;
        document.getElementById('attachmentPreview').style.display = 'flex';
        const placeholder = document.querySelector('.upload-placeholder');
        if (placeholder) placeholder.style.display = 'none';
    } else {
        removeAttachment();
    }

    if (q.type === 'single' || q.type === 'multi') {
        document.getElementById('formOptions').value = q.options.join('\n');
    }

    if (Array.isArray(q.answer)) {
        document.getElementById('formAnswer').value = q.answer.join(',');
    } else {
        document.getElementById('formAnswer').value = q.answer;
    }

    document.getElementById('addForm').scrollIntoView({ behavior: 'smooth' });
}

function deleteQuestion(index) {
    if (!confirm(`确定要删除第 ${index + 1} 题吗？`)) return;
    questions.splice(index, 1);
    if (editingIndex === index) {
        editingIndex = -1;
        clearForm();
    } else if (editingIndex > index) {
        editingIndex--;
    }
    renderQuestionList();
}

function clearForm() {
    document.getElementById('formType').value = 'single';
    document.getElementById('formTitle').value = '';
    document.getElementById('formOptions').value = '';
    document.getElementById('formAnswer').value = '';
    removeAllAttachments();
    editingIndex = -1;
    onTypeChange();
}

function cancelEdit() {
    clearForm();
}

// ==================== JSON格式说明弹窗 ====================
function openJsonModal() {
    const modal = document.getElementById('jsonModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeJsonModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('jsonModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ==================== 文件导入导出 ====================
function importJsonFile() {
    document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) {
                alert('JSON文件格式错误：根元素必须是数组！');
                return;
            }
            for (let i = 0; i < data.length; i++) {
                const q = data[i];
                if (!q.type || !q.title) {
                    alert(`第 ${i + 1} 题格式不完整，必须包含 type、title 字段！`);
                    return;
                }
                if (q.type !== 'fill' && q.type !== 'essay' && q.type !== 'judge' && (!q.options || !Array.isArray(q.options))) {
                    alert(`第 ${i + 1} 题缺少 options 字段！`);
                    return;
                }
            }
            questions = data;
            renderQuestionList();
            alert(`✅ 成功导入 ${data.length} 道题目！`);
        } catch (err) {
            alert('JSON解析错误：' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportJsonFile() {
    if (questions.length === 0) {
        alert('没有题目可以导出！');
        return;
    }
    const jsonStr = JSON.stringify(questions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `questions_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadDemo() {
    questions = JSON.parse(JSON.stringify(demoQuestions));
    renderQuestionList();
    alert('✅ 已加载示例题目！');
}

// ==================== 答题功能 ====================
function startQuiz() {
    if (questions.length === 0) {
        alert('请先添加题目！');
        return;
    }

    document.getElementById('configPage').style.display = 'none';
    document.getElementById('quizPage').style.display = 'block';
    document.getElementById('headerSubtitle').textContent = `共 ${questions.length} 题 · 答题时答案隐藏 · 提交后自动验证`;

    currentIndex = 0;
    userAnswers = {};
    submitted = false;

    // 隐藏统计面板
    const statsPanel = document.getElementById('statsPanel');
    if (statsPanel) statsPanel.classList.remove('show');

    // 重置按钮
    document.getElementById('submitBtn').style.display = 'inline-flex';
    document.getElementById('resetBtn').style.display = 'none';

    renderNav();
    renderQuestions();

    // 关键修复：延迟执行确保DOM渲染完成
    setTimeout(() => {
        showQuestion(0);
    }, 100);

    updateProgress();
}

function backToConfig() {
    if (!submitted && Object.keys(userAnswers).length > 0) {
        if (!confirm('返回题目管理将丢失当前答题进度，确定吗？')) return;
    }
    document.getElementById('quizPage').style.display = 'none';
    document.getElementById('configPage').style.display = 'block';
    document.getElementById('headerSubtitle').textContent = '答题时答案隐藏 · 提交后自动验证 · 支持多种题型';
    renderQuestionList();
}

function renderNav() {
    const grid = document.getElementById('navGrid');
    grid.innerHTML = questions.map((_, i) => 
        `<div class="nav-item" id="nav-${i}" onclick="jumpTo(${i})">${i + 1}</div>`
    ).join('');
}

function renderQuestions() {
    const container = document.getElementById('questionsContainer');

    container.innerHTML = questions.map((q, i) => {
        const typeInfo = typeConfig[q.type];
        let content = '';

        let attachmentHtml = '';
        if (q.attachment) {
            attachmentHtml = `<img class="question-image" src="${q.attachment}" alt="题目图片" onclick="window.open(this.src)">`;
        }

        if (q.type === 'fill') {
            content = `
                <div class="fill-input-wrapper">
                    <input type="text" 
                           class="fill-input" 
                           id="fill-${i}" 
                           placeholder="请输入答案..."
                           oninput="recordFill(${i}, this.value)"
                           autocomplete="off">
                </div>`;
        } else if (q.type === 'essay') {
            content = `
                <div class="essay-area">
                    <textarea class="essay-textarea" 
                              id="essay-text-${i}" 
                              placeholder="请在此输入文字答案..."
                              oninput="recordEssayText(${i}, this.value)"></textarea>

                    <!-- 作答图片上传（支持多图） -->
                    <div class="essay-image-upload" id="essay-img-section-${i}">
                        <label>📷 上传作答图片（可选，支持多张）</label>
                        <div class="multi-image-upload">
                            <div class="image-upload-btn" onclick="document.getElementById('essay-img-input-${i}').click()">
                                <input type="file" id="essay-img-input-${i}" accept="image/*" multiple style="display:none;" onchange="handleEssayImagesUpload(event, ${i})">
                                <span>➕ 添加图片</span>
                            </div>
                            <div class="multi-image-preview" id="essay-images-preview-${i}"></div>
                        </div>
                    </div>

                    <div class="draw-section">
                        <div class="draw-toolbar">
                            <button class="btn-small btn-edit" onclick="setDrawTool(${i}, 'pen')" id="tool-pen-${i}">✏️ 画笔</button>
                            <button class="btn-small btn-delete" onclick="setDrawTool(${i}, 'eraser')" id="tool-eraser-${i}">🧹 橡皮</button>
                            <label>颜色:</label>
                            <input type="color" id="color-${i}" value="#000000" onchange="setDrawColor(${i}, this.value)">
                            <label>粗细:</label>
                            <input type="range" id="size-${i}" min="1" max="20" value="3" onchange="setDrawSize(${i}, this.value)">
                            <button class="btn-small btn-secondary" onclick="clearCanvas(${i})">🗑️ 清空</button>
                        </div>
                        <div class="draw-canvas-wrapper">
                            <canvas class="draw-canvas" 
                                    id="canvas-${i}" 
                                    width="600" 
                                    height="300"
                                    onmousedown="startDrawing(event, ${i})"
                                    onmousemove="draw(event, ${i})"
                                    onmouseup="stopDrawing(${i})"
                                    onmouseleave="stopDrawing(${i})"
                                    ontouchstart="startDrawingTouch(event, ${i})"
                                    ontouchmove="drawTouch(event, ${i})"
                                    ontouchend="stopDrawing(${i})"></canvas>
                        </div>
                    </div>
                </div>`;
        } else {
            content = `<div class="options-list">${q.options.map((opt, idx) => {
                const marker = ['A','B','C','D','E','F','G','H'][idx];
                return `<div class="option-item" id="opt-${i}-${idx}" onclick="selectOption(${i}, ${idx}, '${q.type}')">
                    <div class="option-marker">${marker}</div>
                    <div class="option-text">${escapeHtml(opt)}</div>
                </div>`;
            }).join('')}</div>`;
        }

        return `
        <div class="question-card" id="q-card-${i}">
            <span class="question-type-badge ${typeInfo.class}">${typeInfo.label}</span>
            <div class="question-title">
                <span class="question-number">${i + 1}</span>
                ${escapeHtml(q.title)}
            </div>
            ${attachmentHtml}
            ${content}
            <div class="result-area" id="result-${i}">
                <div class="result-badge" id="badge-${i}"></div>
                <div class="correct-answer-show" id="correct-show-${i}"></div>
            </div>
        </div>`;
    }).join('');

    // 初始化大题的canvas
    questions.forEach((q, i) => {
        if (q.type === 'essay') {
            initCanvas(i);
        }
    });
}

// ==================== Canvas 画图功能 ====================
const canvasStates = {};

function initCanvas(index) {
    const canvas = document.getElementById(`canvas-${index}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    canvasStates[index] = {
        isDrawing: false,
        tool: 'pen',
        color: '#000000',
        size: 3,
        ctx: ctx,
        canvas: canvas,
        dataUrl: null
    };

    // 设置默认画笔按钮高亮
    const penBtn = document.getElementById(`tool-pen-${index}`);
    const eraserBtn = document.getElementById(`tool-eraser-${index}`);
    if (penBtn) penBtn.style.opacity = '1';
    if (eraserBtn) eraserBtn.style.opacity = '0.5';
}

function getCanvasPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function getTouchCanvasPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
    };
}

function startDrawing(e, index) {
    if (submitted) return;
    const state = canvasStates[index];
    if (!state) return;

    state.isDrawing = true;
    const pos = getCanvasPos(e, state.canvas);
    state.lastX = pos.x;
    state.lastY = pos.y;

    state.ctx.beginPath();
    state.ctx.moveTo(pos.x, pos.y);
}

function startDrawingTouch(e, index) {
    if (submitted) return;
    e.preventDefault();
    const state = canvasStates[index];
    if (!state) return;

    state.isDrawing = true;
    const pos = getTouchCanvasPos(e, state.canvas);
    state.lastX = pos.x;
    state.lastY = pos.y;

    state.ctx.beginPath();
    state.ctx.moveTo(pos.x, pos.y);
}

function draw(e, index) {
    const state = canvasStates[index];
    if (!state || !state.isDrawing) return;

    const pos = getCanvasPos(e, state.canvas);

    state.ctx.lineWidth = state.size;
    state.ctx.lineCap = 'round';
    state.ctx.lineJoin = 'round';

    if (state.tool === 'eraser') {
        state.ctx.globalCompositeOperation = 'destination-out';
    } else {
        state.ctx.globalCompositeOperation = 'source-over';
        state.ctx.strokeStyle = state.color;
    }

    state.ctx.lineTo(pos.x, pos.y);
    state.ctx.stroke();

    state.lastX = pos.x;
    state.lastY = pos.y;
}

function drawTouch(e, index) {
    e.preventDefault();
    const state = canvasStates[index];
    if (!state || !state.isDrawing) return;

    const pos = getTouchCanvasPos(e, state.canvas);

    state.ctx.lineWidth = state.size;
    state.ctx.lineCap = 'round';
    state.ctx.lineJoin = 'round';

    if (state.tool === 'eraser') {
        state.ctx.globalCompositeOperation = 'destination-out';
    } else {
        state.ctx.globalCompositeOperation = 'source-over';
        state.ctx.strokeStyle = state.color;
    }

    state.ctx.lineTo(pos.x, pos.y);
    state.ctx.stroke();

    state.lastX = pos.x;
    state.lastY = pos.y;
}

function stopDrawing(index) {
    const state = canvasStates[index];
    if (!state) return;
    state.isDrawing = false;
    state.ctx.beginPath();

    state.dataUrl = state.canvas.toDataURL();

    if (!userAnswers[index]) userAnswers[index] = {};
    userAnswers[index].drawing = state.dataUrl;
    updateNavState(index);
    updateProgress();
}

function setDrawTool(index, tool) {
    const state = canvasStates[index];
    if (!state) return;
    state.tool = tool;

    const penBtn = document.getElementById(`tool-pen-${index}`);
    const eraserBtn = document.getElementById(`tool-eraser-${index}`);
    if (penBtn) penBtn.style.opacity = tool === 'pen' ? '1' : '0.5';
    if (eraserBtn) eraserBtn.style.opacity = tool === 'eraser' ? '1' : '0.5';
}

function setDrawColor(index, color) {
    const state = canvasStates[index];
    if (state) state.color = color;
}

function setDrawSize(index, size) {
    const state = canvasStates[index];
    if (state) state.size = parseInt(size);
}

function clearCanvas(index) {
    if (submitted) return;
    const state = canvasStates[index];
    if (!state) return;

    state.ctx.globalCompositeOperation = 'source-over';
    state.ctx.fillStyle = '#ffffff';
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
    state.dataUrl = null;

    if (userAnswers[index]) {
        delete userAnswers[index].drawing;
    }
}

// ==================== 题目导航和交互 ====================
function showQuestion(index) {
    // 先隐藏所有题目
    document.querySelectorAll('.question-card').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('current'));

    // 显示当前题目
    const card = document.getElementById(`q-card-${index}`);
    if (card) {
        card.classList.add('active');
        card.style.display = 'block';
    }

    const nav = document.getElementById(`nav-${index}`);
    if (nav) nav.classList.add('current');

    currentIndex = index;

    // 更新按钮状态
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) prevBtn.style.display = index > 0 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = index < questions.length - 1 ? 'inline-flex' : 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function jumpTo(index) {
    showQuestion(index);
}

function selectOption(qIdx, optIdx, type) {
    if (submitted) return;

    const markers = ['A','B','C','D','E','F','G','H'];
    const selected = markers[optIdx];

    if (type === 'single' || type === 'judge') {
        userAnswers[qIdx] = selected;
        questions[qIdx].options.forEach((_, i) => {
            const el = document.getElementById(`opt-${qIdx}-${i}`);
            if (el) el.classList.remove('selected');
        });
        const selectedEl = document.getElementById(`opt-${qIdx}-${optIdx}`);
        if (selectedEl) selectedEl.classList.add('selected');
    } else if (type === 'multi') {
        if (!userAnswers[qIdx]) userAnswers[qIdx] = [];
        const arr = userAnswers[qIdx];
        const pos = arr.indexOf(selected);

        if (pos > -1) {
            arr.splice(pos, 1);
            const el = document.getElementById(`opt-${qIdx}-${optIdx}`);
            if (el) el.classList.remove('selected');
        } else {
            arr.push(selected);
            const el = document.getElementById(`opt-${qIdx}-${optIdx}`);
            if (el) el.classList.add('selected');
        }
        userAnswers[qIdx] = arr.sort();
    }

    updateNavState(qIdx);
    updateProgress();
}

function recordFill(qIdx, value) {
    if (submitted) return;
    userAnswers[qIdx] = value.trim();
    updateNavState(qIdx);
    updateProgress();
}

function recordEssayText(qIdx, value) {
    if (submitted) return;
    if (!userAnswers[qIdx]) userAnswers[qIdx] = {};
    userAnswers[qIdx].text = value.trim();
    updateNavState(qIdx);
    updateProgress();
}

function updateNavState(qIdx) {
    const nav = document.getElementById(`nav-${qIdx}`);
    if (!nav) return;

    const q = questions[qIdx];
    let hasAnswer = false;

    if (q.type === 'essay') {
        const ans = userAnswers[qIdx];
        hasAnswer = ans && (ans.text || ans.drawing);
    } else {
        const ans = userAnswers[qIdx];
        hasAnswer = ans && (Array.isArray(ans) ? ans.length > 0 : (typeof ans === 'string' ? ans !== '' : false));
    }

    if (hasAnswer) {
        nav.classList.add('answered');
    } else {
        nav.classList.remove('answered');
    }
}

function updateProgress() {
    let answered = 0;
    questions.forEach((q, i) => {
        const ans = userAnswers[i];
        if (q.type === 'essay') {
            if (ans && (ans.text || ans.drawing)) answered++;
        } else {
            if (ans && (Array.isArray(ans) ? ans.length > 0 : (typeof ans === 'string' ? ans !== '' : false))) {
                answered++;
            }
        }
    });

    document.getElementById('progressCount').textContent = `${answered}/${questions.length}`;
    document.getElementById('progressFill').style.width = `${(answered / questions.length) * 100}%`;
}

function prevQuestion() {
    if (currentIndex > 0) showQuestion(currentIndex - 1);
}

function nextQuestion() {
    if (currentIndex < questions.length - 1) showQuestion(currentIndex + 1);
}

// ==================== 提交与验证 ====================
function submitAll() {
    if (submitted) return;

    const unanswered = [];
    questions.forEach((q, i) => {
        const ans = userAnswers[i];
        let hasAns = false;
        if (q.type === 'essay') {
            hasAns = ans && (ans.text || ans.drawing);
        } else {
            hasAns = ans && (Array.isArray(ans) ? ans.length > 0 : (typeof ans === 'string' ? ans !== '' : false));
        }
        if (!hasAns) unanswered.push(i + 1);
    });

    if (unanswered.length > 0) {
        if (!confirm(`⚠️ 第 ${unanswered.join('、')} 题尚未作答，确定要提交吗？`)) {
            return;
        }
    }

    submitted = true;
    let correctCount = 0;
    let wrongCount = 0;
    let essayCount = 0;

    questions.forEach((q, i) => {
        const card = document.getElementById(`q-card-${i}`);
        const nav = document.getElementById(`nav-${i}`);
        const userAns = userAnswers[i];
        let isCorrect = false;
        let correctText = '';

        if (q.type === 'essay') {
            // 大题：不计入成绩，只显示参考答案
            essayCount++;

            // 禁用输入
            const textArea = document.getElementById(`essay-text-${i}`);
            if (textArea) {
                textArea.disabled = true;
                textArea.classList.add('submitted');
            }

            // 禁用图片上传
            const imgSection = document.getElementById(`essay-img-section-${i}`);
            if (imgSection) {
                imgSection.style.pointerEvents = 'none';
                imgSection.style.opacity = '0.7';
            }

            // 禁用canvas
            const canvas = document.getElementById(`canvas-${i}`);
            if (canvas) {
                canvas.style.pointerEvents = 'none';
            }

            // 大题导航标记为特殊颜色（蓝色表示已作答的大题）
            if (nav) nav.classList.add('answered');

            // 构建作答内容展示
            let userContent = '';
            const ans = userAnswers[i];

            if (ans) {
                if (ans.text) {
                    userContent += `<div style="margin-bottom:10px;"><strong>📝 文字作答：</strong><pre style="white-space:pre-wrap;font-family:inherit;background:#f5f5f5;padding:10px;border-radius:8px;">${escapeHtml(ans.text)}</pre></div>`;
                }
                if (ans.images && ans.images.length > 0) {
                    userContent += `<div style="margin-bottom:10px;"><strong>📷 作答图片（${ans.images.length}张）：</strong></div>`;
                    ans.images.forEach((src, idx) => {
                        userContent += `<img src="${src}" style="max-width:100%;max-height:300px;border-radius:8px;border:1px solid #e0e0e0;margin-bottom:10px;display:block;">`;
                    });
                } else if (ans.image) {
                    // 兼容旧格式
                    userContent += `<div style="margin-bottom:10px;"><strong>📷 作答图片：</strong><br><img src="${ans.image}" style="max-width:100%;max-height:300px;border-radius:8px;border:1px solid #e0e0e0;"></div>`;
                }
                if (ans.drawing && ans.drawing !== 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==') {
                    userContent += `<div style="margin-bottom:10px;"><strong>✏️ 画图作答：</strong><br><img src="${ans.drawing}" style="max-width:100%;max-height:300px;border-radius:8px;border:1px solid #e0e0e0;"></div>`;
                }
            }

            if (!userContent) {
                userContent = '<div style="color:#999;">未作答</div>';
            }

            correctText = `<div style="margin-bottom:15px;"><strong>👤 你的作答：</strong></div>${userContent}<hr style="margin:15px 0;border:none;border-top:1px solid #e0e0e0;"><span class="label">📖 参考答案：</span><pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(q.answer || '暂无参考答案')}</pre>`;
        } else if (q.type === 'fill') {
            const userVal = (userAns || '').toString().trim();
            const correctVals = Array.isArray(q.answer) ? q.answer : [q.answer];
            isCorrect = correctVals.some(v => v.toString().trim().toLowerCase() === userVal.toLowerCase());

            const input = document.getElementById(`fill-${i}`);
            if (input) {
                input.disabled = true;
                input.classList.add(isCorrect ? 'correct-input' : 'wrong-input');
            }

            correctText = `<span class="label">✓ 正确答案：</span>${correctVals.join(' 或 ')}`;
        } else {
            const correctAns = Array.isArray(q.answer) ? q.answer : [q.answer];
            const userArr = Array.isArray(userAns) ? userAns : (userAns ? [userAns] : []);

            if (q.type === 'multi') {
                isCorrect = correctAns.length === userArr.length && 
                           correctAns.every(a => userArr.includes(a));
            } else {
                isCorrect = userArr.length === 1 && correctAns.includes(userArr[0]);
            }

            const markers = ['A','B','C','D','E','F','G','H'];
            q.options.forEach((_, idx) => {
                const optEl = document.getElementById(`opt-${i}-${idx}`);
                if (!optEl) return;
                const marker = markers[idx];
                optEl.style.pointerEvents = 'none';

                if (correctAns.includes(marker)) {
                    optEl.classList.add('correct-ans');
                }
                if (userArr.includes(marker) && !correctAns.includes(marker)) {
                    optEl.classList.add('wrong-ans');
                }
            });

            correctText = `<span class="label">✓ 正确答案：</span>${correctAns.join('、')}`;
        }

        // 只有客观题才标记对错边框
        if (q.type !== 'essay') {
            if (isCorrect) {
                correctCount++;
                if (card) card.classList.add('correct-border');
                if (nav) nav.classList.add('correct');
            } else {
                wrongCount++;
                if (card) card.classList.add('wrong-border');
                if (nav) nav.classList.add('incorrect');
            }
        }

        const resultArea = document.getElementById(`result-${i}`);
        const badge = document.getElementById(`badge-${i}`);
        const correctShow = document.getElementById(`correct-show-${i}`);

        if (badge) {
            if (q.type === 'essay') {
                badge.className = 'result-badge badge-pass';
                badge.innerHTML = '📝 大题已作答（请对照参考答案自评）';
            } else {
                badge.className = `result-badge ${isCorrect ? 'badge-pass' : 'badge-fail'}`;
                badge.innerHTML = isCorrect ? '✅ 回答正确' : '❌ 回答错误';
            }
        }
        if (correctShow) correctShow.innerHTML = correctText;
        if (resultArea) resultArea.classList.add('show');
    });

    // 计算得分：只统计客观题（非大题）
    const objectiveTotal = questions.filter(q => q.type !== 'essay').length;
    const score = objectiveTotal > 0 ? Math.round((correctCount / objectiveTotal) * 100) : 100;

    document.getElementById('scoreNumber').textContent = score;
    document.getElementById('scoreNumber').className = `score-number ${score >= 60 ? '' : 'fail'}`;
    document.getElementById('correctNum').textContent = correctCount;
    document.getElementById('wrongNum').textContent = wrongCount;
    document.getElementById('totalNum').textContent = questions.length;

    // 如果有大题，显示提示
    if (essayCount > 0) {
        const scoreLabel = document.querySelector('.score-label');
        if (scoreLabel) {
            scoreLabel.innerHTML = `分<br><span style="font-size:13px;color:#888;">（不含${essayCount}道大题，大题请对照参考答案自评）</span>`;
        }
    }

    document.getElementById('statsPanel').classList.add('show');

    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('prevBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('resetBtn').style.display = 'inline-flex';

    // 显示所有题目
    document.querySelectorAll('.question-card').forEach(c => {
        c.classList.add('active');
        c.style.display = 'block';
    });
}

// ==================== 大题图片上传（支持多图）====================
function handleEssayImagesUpload(event, index) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (!userAnswers[index]) userAnswers[index] = {};
    if (!userAnswers[index].images) userAnswers[index].images = [];

    let loaded = 0;
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            userAnswers[index].images.push(e.target.result);
            loaded++;
            if (loaded === files.length) {
                renderEssayImagesPreview(index);
                updateNavState(index);
                updateProgress();
            }
        };
        reader.readAsDataURL(file);
    });
    event.target.value = ''; // 清空input
}

function renderEssayImagesPreview(index) {
    const preview = document.getElementById(`essay-images-preview-${index}`);
    if (!preview) return;

    const images = (userAnswers[index] && userAnswers[index].images) || [];

    preview.innerHTML = images.map((src, idx) => `
        <div class="preview-item">
            <img src="${src}" alt="图片${idx + 1}">
            <button class="btn-small btn-delete" onclick="removeEssayImage(${index}, ${idx})">🗑️ 删除</button>
        </div>
    `).join('');
}

function removeEssayImage(index, imgIdx) {
    if (userAnswers[index] && userAnswers[index].images) {
        userAnswers[index].images.splice(imgIdx, 1);
        renderEssayImagesPreview(index);
        updateNavState(index);
        updateProgress();
    }
}

// ==================== 修复：重新答题 ====================
function resetQuiz() {
    // 完全重置答题状态
    submitted = false;
    currentIndex = 0;
    userAnswers = {};

    // 清空画布状态
    for (let key in canvasStates) {
        delete canvasStates[key];
    }
    // 清空临时附件
    tempAttachments = [];

    // 隐藏统计面板
    const statsPanel = document.getElementById('statsPanel');
    if (statsPanel) statsPanel.classList.remove('show');

    // 恢复得分标签
    const scoreLabel = document.querySelector('.score-label');
    if (scoreLabel) scoreLabel.innerHTML = '分';

    // 清空题目容器，强制重新渲染
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';

    // 重新渲染题目（清除之前的选择状态）
    renderQuestions();

    // 重置导航状态
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.remove('correct', 'incorrect', 'answered', 'current');
    });

    // 显示第一题（使用更长的延迟确保DOM完全就绪）
    setTimeout(() => {
        showQuestion(0);
    }, 200);

    // 更新按钮状态
    document.getElementById('submitBtn').style.display = 'inline-flex';
    document.getElementById('prevBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = questions.length > 1 ? 'inline-flex' : 'none';
    document.getElementById('resetBtn').style.display = 'none';

    updateProgress();
}

// ==================== 工具函数 ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);
