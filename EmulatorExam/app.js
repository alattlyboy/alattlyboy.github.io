// app.js

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
        type: 'single',
        title: '在以下域名www.jlu.edu.cn里，____是一级域名。',
        options: ['cn', 'www', 'edu.cn', 'www.jlu'],
        answer: 'A'
    },
    {
        type: 'multi',
        title: '以下属于传输层协议的有？（多选）',
        options: ['TCP', 'UDP', 'IP', 'HTTP'],
        answer: ['A', 'B']
    },
    {
        type: 'fill',
        title: 'HTTP协议默认使用的端口号是____。',
        answer: ['80', '8080']
    },
    {
        type: 'judge',
        title: 'DNS协议使用TCP协议进行域名解析。',
        options: ['对', '错'],
        answer: 'B'
    }
];

// ==================== 状态变量 ====================
let questions = [];
let currentIndex = 0;
let userAnswers = {};
let submitted = false;
let editingIndex = -1;

const typeConfig = {
    single: { label: '单选题', class: 'badge-single' },
    multi: { label: '多选题', class: 'badge-multi' },
    judge: { label: '判断题', class: 'badge-judge' },
    fill: { label: '填空题', class: 'badge-fill' }
};

const typeLabels = {
    single: '单选',
    multi: '多选',
    judge: '判断',
    fill: '填空'
};

// ==================== 初始化 ====================
function init() {
    renderQuestionList();
    onTypeChange();
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
        const answerPreview = Array.isArray(q.answer) ? q.answer.join(',') : q.answer;
        return `
            <div class="question-list-item">
                <div class="question-list-num">${i + 1}</div>
                <div class="question-list-info">
                    <div class="question-list-title">${escapeHtml(q.title)}</div>
                    <div class="question-list-meta">[${typeLabel}] 答案: ${escapeHtml(answerPreview)}</div>
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
    const answerInput = document.getElementById('formAnswer');
    
    if (type === 'fill') {
        optionsRow.style.display = 'none';
        answerInput.placeholder = '填空答案，多个正确答案用英文逗号分隔';
    } else if (type === 'judge') {
        optionsRow.style.display = 'none';
        answerInput.placeholder = '填 A(对) 或 B(错)';
    } else {
        optionsRow.style.display = 'block';
        if (type === 'multi') {
            answerInput.placeholder = '多选答案，如: A,C,D';
        } else {
            answerInput.placeholder = '单选答案，如: A';
        }
    }
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
    if (!answerText) {
        alert('请输入正确答案！');
        return;
    }
    
    let options = [];
    let answer;
    
    if (type === 'fill') {
        // 填空题：答案可以是单个或多个（逗号分隔）
        answer = answerText.includes(',') ? answerText.split(',').map(s => s.trim()) : answerText;
    } else if (type === 'judge') {
        options = ['对', '错'];
        answer = answerText.toUpperCase();
        if (answer !== 'A' && answer !== 'B') {
            alert('判断题答案只能填 A(对) 或 B(错)！');
            return;
        }
    } else {
        // 单选/多选
        if (!optionsText) {
            alert('请输入选项！');
            return;
        }
        options = optionsText.split('\n').map(s => s.trim()).filter(s => s);
        if (options.length < 2) {
            alert('至少需要2个选项！');
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
    
    if (editingIndex >= 0) {
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
    editingIndex = -1;
    onTypeChange();
}

function cancelEdit() {
    clearForm();
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
            // 验证题目格式
            for (let i = 0; i < data.length; i++) {
                const q = data[i];
                if (!q.type || !q.title || !q.answer) {
                    alert(`第 ${i + 1} 题格式不完整，必须包含 type、title、answer 字段！`);
                    return;
                }
                if (q.type !== 'fill' && q.type !== 'judge' && (!q.options || !Array.isArray(q.options))) {
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
    event.target.value = ''; // 重置，允许重复选择同一文件
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
    document.getElementById('statsPanel').classList.remove('show');
    
    // 重置按钮
    document.getElementById('submitBtn').style.display = 'inline-flex';
    document.getElementById('resetBtn').style.display = 'none';
    
    renderNav();
    renderQuestions();
    showQuestion(0);
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
            ${content}
            <div class="result-area" id="result-${i}">
                <div class="result-badge" id="badge-${i}"></div>
                <div class="correct-answer-show" id="correct-show-${i}"></div>
            </div>
        </div>`;
    }).join('');
}

function showQuestion(index) {
    document.querySelectorAll('.question-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('current'));
    
    const card = document.getElementById(`q-card-${index}`);
    if (card) card.classList.add('active');
    
    const nav = document.getElementById(`nav-${index}`);
    if (nav) nav.classList.add('current');
    
    currentIndex = index;
    
    document.getElementById('prevBtn').style.display = index > 0 ? 'inline-flex' : 'none';
    document.getElementById('nextBtn').style.display = index < questions.length - 1 ? 'inline-flex' : 'none';
    
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
            document.getElementById(`opt-${qIdx}-${i}`).classList.remove('selected');
        });
        document.getElementById(`opt-${qIdx}-${optIdx}`).classList.add('selected');
    } else if (type === 'multi') {
        if (!userAnswers[qIdx]) userAnswers[qIdx] = [];
        const arr = userAnswers[qIdx];
        const pos = arr.indexOf(selected);
        
        if (pos > -1) {
            arr.splice(pos, 1);
            document.getElementById(`opt-${qIdx}-${optIdx}`).classList.remove('selected');
        } else {
            arr.push(selected);
            document.getElementById(`opt-${qIdx}-${optIdx}`).classList.add('selected');
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

function updateNavState(qIdx) {
    const nav = document.getElementById(`nav-${qIdx}`);
    const ans = userAnswers[qIdx];
    const hasAnswer = ans && (Array.isArray(ans) ? ans.length > 0 : ans !== '');
    
    if (hasAnswer) {
        nav.classList.add('answered');
    } else {
        nav.classList.remove('answered');
    }
}

function updateProgress() {
    const answered = Object.keys(userAnswers).filter(k => {
        const v = userAnswers[k];
        return v && (Array.isArray(v) ? v.length > 0 : v !== '');
    }).length;
    
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
        const hasAns = ans && (Array.isArray(ans) ? ans.length > 0 : ans !== '');
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
    
    questions.forEach((q, i) => {
        const card = document.getElementById(`q-card-${i}`);
        const nav = document.getElementById(`nav-${i}`);
        const userAns = userAnswers[i];
        let isCorrect = false;
        let correctText = '';
        
        if (q.type === 'fill') {
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
        
        if (isCorrect) {
            correctCount++;
            card.classList.add('correct-border');
            nav.classList.add('correct');
        } else {
            wrongCount++;
            card.classList.add('wrong-border');
            nav.classList.add('incorrect');
        }
        
        const resultArea = document.getElementById(`result-${i}`);
        const badge = document.getElementById(`badge-${i}`);
        const correctShow = document.getElementById(`correct-show-${i}`);
        
        badge.className = `result-badge ${isCorrect ? 'badge-pass' : 'badge-fail'}`;
        badge.innerHTML = isCorrect ? '✅ 回答正确' : '❌ 回答错误';
        correctShow.innerHTML = correctText;
        resultArea.classList.add('show');
    });
    
    const total = questions.length;
    const score = Math.round((correctCount / total) * 100);
    
    document.getElementById('scoreNumber').textContent = score;
    document.getElementById('scoreNumber').className = `score-number ${score >= 60 ? '' : 'fail'}`;
    document.getElementById('correctNum').textContent = correctCount;
    document.getElementById('wrongNum').textContent = wrongCount;
    document.getElementById('totalNum').textContent = total;
    
    document.getElementById('statsPanel').classList.add('show');
    
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('prevBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('resetBtn').style.display = 'inline-flex';
    
    document.querySelectorAll('.question-card').forEach(c => c.classList.add('active'));
}

function resetQuiz() {
    startQuiz();
}

// ==================== 工具函数 ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);