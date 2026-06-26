const startBtn = document.getElementById("btn");
const downloadLink = document.getElementById("link");
const recorderPage = document.getElementById("recorderPage");
const successPage = document.getElementById("successPage");
const historyList = document.getElementById("historyList");

// 成功页面按钮
const previewBtn = document.getElementById("previewBtn");
const deleteBtn = document.getElementById("deleteBtn");
const newRecordBtn = document.getElementById("newRecordBtn");

let blob = null, videoStream = null, audioStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let currentRecordingId = null;

// 历史记录管理 (最多3个)
const MAX_HISTORY = 3;
let recordingHistory = [];

// ========== 初始化 ==========
startBtn.addEventListener("click", startScreenCapturing);
previewBtn.addEventListener("click", showPreview);
deleteBtn.addEventListener("click", deleteCurrentRecording);
newRecordBtn.addEventListener("click", resetToRecord);

// 页面加载时渲染历史记录
renderHistory();

// ========== 核心录屏功能 ==========
async function startScreenCapturing() {
    if (!navigator.mediaDevices.getDisplayMedia) {
        return alert("Screen capturing not supported in your browser.");
    }

    // 如果已有活跃流，先停止
    if (videoStream?.active) {
        stopAllStreams();
    }

    startBtn.disabled = true;
    startBtn.textContent = "Starting...";

    try {
        videoStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" },
            audio: true
        });

        // 尝试获取麦克风音频
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
            });
            const audioTrack = audioStream.getTracks()[0];
            videoStream.addTrack(audioTrack);
        } catch (error) {
            console.warn("No audio stream available: ", error);
        }

        // 监听用户点击"停止共享"按钮
        videoStream.getVideoTracks()[0].addEventListener("ended", () => {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
            }
        });

        recordStream(videoStream);

    } catch (error) {
        console.error("Error starting capture:", error);
        startBtn.disabled = false;
        startBtn.textContent = "Record";
    }
}

function recordStream(stream) {
    recordedChunks = [];
    countdown();

    // 倒计时结束后开始录制
    setTimeout(() => {
        try {
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: "video/webm; codecs=vp8,opus"
            });

            mediaRecorder.addEventListener("dataavailable", (e) => {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            });

            mediaRecorder.addEventListener("stop", () => {
                onRecordingStop();
            });

            mediaRecorder.addEventListener("error", (e) => {
                console.error("MediaRecorder error:", e);
                resetUI();
            });

            mediaRecorder.start(1000); // 每秒收集一次数据，防止丢失
            startBtn.textContent = "Recording...";
            startBtn.style.backgroundColor = "#e74c3c";

        } catch (error) {
            console.error("Failed to start MediaRecorder:", error);
            alert("Failed to start recording. Please try again.");
            resetUI();
        }
    }, 4000);
}

function countdown() {
    const countdownElement = document.getElementById("countdown");
    let seconds = 3;
    countdownElement.style.display = "flex";
    countdownElement.textContent = seconds;

    const interval = setInterval(() => {
        seconds--;
        if (seconds > 0) {
            countdownElement.textContent = seconds;
        } else if (seconds === 0) {
            countdownElement.textContent = "GO!";
        } else {
            clearInterval(interval);
            countdownElement.style.display = "none";
        }
    }, 1000);
}

// ========== 录制停止处理 ==========
function onRecordingStop() {
    if (recordedChunks.length === 0) {
        alert("No data recorded. Please try again.");
        resetUI();
        return;
    }

    blob = new Blob(recordedChunks, { type: "video/webm" });
    const recordingId = Date.now().toString();
    currentRecordingId = recordingId;

    // 保存到历史记录
    const recording = {
        id: recordingId,
        blob: blob,
        url: URL.createObjectURL(blob),
        timestamp: new Date().toLocaleString(),
        size: formatFileSize(blob.size)
    };

    // 如果超过3个，删除最旧的
    if (recordingHistory.length >= MAX_HISTORY) {
        const oldest = recordingHistory.shift();
        URL.revokeObjectURL(oldest.url);
    }

    recordingHistory.push(recording);
    renderHistory();

    // 显示成功页面
    showSuccessPage();

    // 清理流
    stopAllStreams();
}

// ========== 页面切换 ==========
function showSuccessPage() {
    recorderPage.style.display = "none";
    successPage.style.display = "flex";
}

function showPreview() {
    // 在录屏页面预览当前录制
    const videoElement = document.getElementById("video");
    const currentRecording = recordingHistory.find(r => r.id === currentRecordingId);
    if (currentRecording) {
        videoElement.src = currentRecording.url;
        videoElement.controls = true;
    }
    resetToRecord();
}

function deleteCurrentRecording() {
    if (currentRecordingId) {
        deleteRecordingById(currentRecordingId);
    }
    resetToRecord();
}

function resetToRecord() {
    successPage.style.display = "none";
    recorderPage.style.display = "flex";
    resetUI();

    // 清空视频预览
    const videoElement = document.getElementById("video");
    videoElement.src = "";
    videoElement.controls = false;

    // 重置下载链接
    downloadLink.href = "";
    downloadLink.download = "";
}

function resetUI() {
    startBtn.disabled = false;
    startBtn.textContent = "Record";
    startBtn.style.backgroundColor = "";
}

// ========== 历史记录管理 ==========
function renderHistory() {
    historyList.innerHTML = "";

    if (recordingHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <p>📭 No recordings yet</p>
                <p>Start recording to see your history here!</p>
            </div>
        `;
        return;
    }

    // 倒序显示，最新的在最上面
    [...recordingHistory].reverse().forEach(recording => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <video class="history-thumbnail" src="${recording.url}" muted preload="metadata"></video>
            <div class="history-info-text">
                <span class="history-title">Screen Recording</span>
                <span class="history-time">${recording.timestamp} · ${recording.size}</span>
            </div>
            <div class="history-actions">
                <button class="btn" onclick="playHistory('${recording.id}')">▶ Play</button>
                <a class="btn" href="${recording.url}" download="screen_recording_${recording.id}.webm">⬇ Download</a>
                <button class="btn btn-danger" onclick="deleteHistory('${recording.id}')">🗑 Delete</button>
            </div>
        `;
        historyList.appendChild(item);
    });
}

// 播放历史记录
function playHistory(id) {
    const recording = recordingHistory.find(r => r.id === id);
    if (recording) {
        const videoElement = document.getElementById("video");
        videoElement.src = recording.url;
        videoElement.controls = true;
        videoElement.play();

        // 滚动到视频区域
        recorderPage.scrollIntoView({ behavior: "smooth" });
    }
}

// 删除历史记录
function deleteHistory(id) {
    deleteRecordingById(id);
    renderHistory();
}

function deleteRecordingById(id) {
    const index = recordingHistory.findIndex(r => r.id === id);
    if (index !== -1) {
        const recording = recordingHistory[index];
        URL.revokeObjectURL(recording.url);
        recordingHistory.splice(index, 1);

        // 如果删除的是当前正在查看的，清空视频
        if (currentRecordingId === id) {
            currentRecordingId = null;
            blob = null;
        }
    }
}

// ========== 工具函数 ==========
function stopAllStreams() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
    }
    mediaRecorder = null;
}

function formatFileSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 页面卸载时清理资源
window.addEventListener("beforeunload", () => {
    stopAllStreams();
    recordingHistory.forEach(r => URL.revokeObjectURL(r.url));
});