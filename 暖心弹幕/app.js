// 神秘礼物弹窗应用 - app.js

// DOM 元素缓存
const elements = {
  confirmBtn: document.getElementById('confirm-btn'),
  startBackdrop: document.getElementById('start-backdrop'),
  popupLayer: document.getElementById('popup-layer'),
  bgMusic: document.getElementById('bgMusic')
};

// 配置项
const config = {
  // 动画持续时间（毫秒）
  animationDuration: 600,
  // 礼物动画配置
  giftAnimation: {
    particlesCount: 50,
    duration: 3000
  },
  // 温馨提示配置
  tips: {
    interval: 100, // 创建弹窗的时间间隔
    maxCount: 100, // 最大弹窗数量
    duration: 5000 // 弹窗显示时间
  }
};

// 温馨提示数据
const tipsData = {
  messages: [
    "多喝水哦~", "保持微笑呀", "每天元气满满!",
    "记得吃水果", "保持好心情", "好好爱自己",
    "我想你了", "梦想成真", "顺顺利利",
    "早点休息", "别熬夜", "天冷了，多穿衣服"
  ],
  // 使用CSS中定义的主题类名
  themeClasses: [
    "theme-pink", // 樱花粉、藕粉色系
    "theme-pink", 
    "theme-pink",
    "theme-blue", // 浅蓝色系
    "theme-blue",
    "theme-blue",
    "theme-yellow", // 淡黄色系
    "theme-yellow",
    "theme-yellow",
    "theme-purple", // 淡紫色系
    "theme-purple",
    "theme-green"  // 淡绿色系
  ]
};

// ======== 颜色方案说明 ========
/*
当前弹窗颜色方案：
1. 标题栏颜色：从12种柔和色彩中随机选择，包括蓝色、绿色、青色、黄色、橙色和紫色等
2. 内容区域颜色：通过lightenColor函数将标题颜色变亮60%，确保最低亮度为230
3. 其他视觉元素：
   - 边框：1px 半透明白色 (rgba(255, 255, 255, 0.2))
   - 阴影：柔和的浅灰色阴影 (rgba(0, 0, 0, 0.15))
   - 圆角：12px，提供现代柔和的外观

这种设计确保了弹窗在视觉上既丰富多彩又不会太过刺眼，保持了整体的柔和感和协调性。
*/

// 标题文本
let titleText = "亲爱的张宇路"; // 默认标题

// 弹窗队列和计时器
let tipsQueue = [];
let tipsTimer = null;

// 初始化函数
document.addEventListener('DOMContentLoaded', function() {
  // 尝试从localStorage读取标题
  const savedTitle = localStorage.getItem('tipTitle');
  if (savedTitle) {
    titleText = savedTitle;
  }
  
  initEventListeners();
  // 尝试播放背景音乐（需要用户交互后才能播放）
  setupAudio();
});

// 初始化事件监听器
function initEventListeners() {
  // 确认按钮点击事件
  elements.confirmBtn.addEventListener('click', handleConfirmClick);
  
  // 阻止背景点击关闭弹窗
  elements.startBackdrop.addEventListener('click', function(e) {
    if (e.target === this) {
      e.stopPropagation();
    }
  });
  
  // ESC键关闭所有弹窗
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      stopTipsTimer();
      closeAllTips();
    }
  });
}

// 设置音频播放
function setupAudio() {
  // 监听用户交互，尝试播放音乐
  document.addEventListener('click', function playAudioOnInteraction() {
    playBackgroundMusic();
    document.removeEventListener('click', playAudioOnInteraction);
  }, { once: true });
}

// 播放背景音乐
function playBackgroundMusic() {
  try {
    elements.bgMusic.play().catch(error => {
      console.log('音乐播放失败，需要用户交互: - app.js:120', error);
    });
  } catch (error) {
    console.error('播放音乐时发生错误: - app.js:123', error);
  }
}

// 处理确认按钮点击
function handleConfirmClick() {
  // 播放音乐
  playBackgroundMusic();
  
  // 隐藏初始弹窗
  hideStartModal();
  
  // 显示礼物动画
  showGiftAnimation();
  
  // 设置延时开始显示温馨提示
  setTimeout(() => {
    // 开始显示温馨提示
    startShowingTips();
    
    // 标记为已跳出
    sessionStorage.setItem('jumpOut', '1');
    
    // 不立即跳转，让用户看到弹窗效果
    // executeJump();
  }, config.giftAnimation.duration + 500);
}

// 隐藏初始模态框
function hideStartModal() {
  elements.startBackdrop.style.transition = `opacity ${config.animationDuration}ms ease`;
  elements.startBackdrop.style.opacity = '0';
  
  setTimeout(() => {
    elements.startBackdrop.style.display = 'none';
  }, config.animationDuration);
}

// 显示礼物动画
function showGiftAnimation() {
  // 创建粒子效果
  createParticles();
  
  // 创建礼物打开的视觉效果
  createGiftOpeningEffect();
}

// 创建粒子效果
function createParticles() {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#6A0572', '#AB83A1'];
  
  for (let i = 0; i < config.giftAnimation.particlesCount; i++) {
    const particle = document.createElement('div');
    
    // 随机粒子样式
    const size = Math.random() * 10 + 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const duration = Math.random() * 3 + 2;
    const delay = Math.random() * 0.5;
    
    // 应用样式
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 50%;
      left: ${left}%;
      top: ${top}%;
      opacity: 0;
      transform: translate(-50%, -50%) scale(0);
      animation: particleFloat ${duration}s ease ${delay}s forwards;
      pointer-events: none;
      z-index: 100;
    `;
    
    elements.popupLayer.appendChild(particle);
  }
  
  // 添加动画样式
  addParticleAnimation();
}

// 添加粒子动画样式
function addParticleAnimation() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes particleFloat {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0);
      }
      20% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      80% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translate(calc(-50% + ${Math.random() * 100 - 50}px), calc(-50% - ${Math.random() * 100 + 100}px)) scale(0.5);
      }
    }
  `;
  document.head.appendChild(style);
}

// 创建礼物打开效果
function createGiftOpeningEffect() {
  const giftElement = document.createElement('div');
  
  giftElement.className = 'gift-opening';
  giftElement.innerHTML = `
    <div class="gift-box">
      <div class="gift-lid">🎁</div>
      <div class="gift-content">🎉</div>
    </div>
    <div class="gift-message">礼物已打开！</div>
  `;
  
  giftElement.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 101;
  `;
  
  // 添加礼物盒样式
  const giftStyle = document.createElement('style');
  giftStyle.textContent = `
    .gift-box {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 20px;
    }
    
    .gift-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      opacity: 0;
      transition: opacity ${config.animationDuration}ms ease ${config.animationDuration}ms;
    }
    
    .gift-lid {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #ff4757;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 36px;
      cursor: pointer;
      transition: transform ${config.animationDuration}ms ease;
    }
    
    @keyframes giftOpen {
      from { transform: translateY(0); }
      to { transform: translateY(-50px); }
    }
    
    .gift-message {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      opacity: 0;
      animation: fadeIn ${config.animationDuration}ms ease ${config.animationDuration * 2}ms forwards;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  
  document.head.appendChild(giftStyle);
  elements.popupLayer.appendChild(giftElement);
  
  // 触发动画
  setTimeout(() => {
    const lid = giftElement.querySelector('.gift-lid');
    const content = giftElement.querySelector('.gift-content');
    
    lid.style.animation = 'giftOpen 0.6s ease forwards';
    content.style.opacity = '1';
  }, 100);
  
  // 动画完成后移除礼物元素
  setTimeout(() => {
    if (giftElement.parentNode) {
      giftElement.parentNode.removeChild(giftElement);
    }
  }, 2000);
}

// 开始显示温馨提示
function startShowingTips() {
  // 确保先停止之前的计时器
  stopTipsTimer();
  
  // 清空队列
  tipsQueue = [];
  
  // 添加提示弹窗样式
  addTipsStyles();
  
  // 开始计时器
  tipsTimer = setInterval(() => {
    showRandomTip();
    
    // 限制最大弹窗数量
    if (tipsQueue.length > config.tips.maxCount) {
      const oldestTip = tipsQueue.shift();
      if (oldestTip && oldestTip.parentNode) {
        oldestTip.parentNode.removeChild(oldestTip);
      }
    }
  }, config.tips.interval);
}

// 停止提示计时器
function stopTipsTimer() {
  if (tipsTimer) {
    clearInterval(tipsTimer);
    tipsTimer = null;
  }
}

// 关闭所有提示
function closeAllTips() {
  tipsQueue.forEach(tip => {
    if (tip && tip.parentNode) {
      tip.parentNode.removeChild(tip);
    }
  });
  tipsQueue = [];
}

// 显示随机温馨提示
function showRandomTip() {
  // 获取随机提示内容
  const message = tipsData.messages[Math.floor(Math.random() * tipsData.messages.length)];
  
  // 创建提示弹窗元素
  const tipElement = createTipElement(message);
  
  // 添加到队列
  tipsQueue.push(tipElement);
  
  // 添加到页面
  document.body.appendChild(tipElement);
  
  // 设置显示时间，然后自动移除
  setTimeout(() => {
    if (tipElement.parentNode) {
      tipElement.style.opacity = '0';
      tipElement.style.transform = 'scale(0.8)'; /* 关闭时也以中心点为锚点缩小 */
      setTimeout(() => {
        if (tipElement.parentNode) {
          tipElement.parentNode.removeChild(tipElement);
          // 从队列中移除
          const index = tipsQueue.indexOf(tipElement);
          if (index > -1) {
            tipsQueue.splice(index, 1);
          }
        }
      }, 300);
    }
  }, config.tips.duration);
}

// 创建提示弹窗元素
function createTipElement(message) {
  const tip = document.createElement('div');
  tip.className = 'popup'; // 使用CSS中定义的popup类
  
  // 随机选择主题类名
  const themeClass = tipsData.themeClasses[Math.floor(Math.random() * tipsData.themeClasses.length)];
  tip.classList.add(themeClass); // 添加选中的主题类
  
  // 创建标题栏 - 使用CSS中定义的header类
  const titleBar = document.createElement('div');
  titleBar.className = 'header';
  
  // 添加图标
  const icon = document.createElement('div');
  icon.className = 'icon';
  icon.textContent = '💝';
  titleBar.appendChild(icon);
  
  const titleLabel = document.createElement('div');
  titleLabel.className = 'title';
  titleLabel.textContent = titleText;
  
  titleBar.appendChild(titleLabel);
  
  // 创建内容区域 - 使用CSS中定义的content类
  const content = document.createElement('div');
  content.className = 'content';
  content.textContent = message;
  
  // 组合弹窗
  tip.appendChild(titleBar);
  tip.appendChild(content);
  
  // 设置位置和基础样式
  const left = Math.random() * (window.innerWidth - 230);
  const top = Math.random() * (window.innerHeight - 100);
  
  tip.style.cssText = `
    position: absolute;
    left: ${left}px;
    top: ${top}px;
    z-index: 999;
    opacity: 0;
    transform: scale(0);
    animation: modal-appear 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    pointer-events: auto;
  `;
  
  // 添加拖拽功能
  makeDraggable(tip, titleBar);
  
  return tip;
}

// 颜色现在通过CSS类定义，不需要动态计算
// 颜色主题包括：淡粉色系、淡蓝色系、淡黄色系、淡紫色系、淡绿色系

// 添加提示弹窗样式
function addTipsStyles() {
  // 检查是否已经添加过样式
  if (document.getElementById('tips-styles')) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'tips-styles';
  style.textContent = `
    @keyframes tipAppear {
      from {
        opacity: 0;
        transform: scale(0); /* 以中心点为锚点从小到大弹出 */
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    .warm-tip {
      user-select: none;
      transform-origin: center; /* 设置变换原点为中心点 */
      transition: all 0.3s ease; /* 平滑过渡效果 */
    }
    
    .warm-tip:hover {
      transform: scale(1.05); /* 鼠标悬停时轻微放大 */
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;
      z-index: 1000 !important;
    }
    
    .tip-titlebar {
      height: 24px; /* 进一步减小标题栏高度 */
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: move;
      border-top-left-radius: 11px; /* 调整圆角以匹配整体 */
      border-top-right-radius: 11px;
      font-weight: 500;
    }
    
    .tip-title {
      font-family: '微软雅黑', 'Noto Sans SC', sans-serif;
      font-size: 12px; /* 进一步减小字体大小 */
      font-weight: 600;
      color: #ffffff;
      text-align: center;
      margin: 0;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); /* 添加轻微文字阴影 */
    }
    
    .tip-content {
      padding: 10px;
      font-family: '微软雅黑', 'Noto Sans SC', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: #333;
      text-align: center;
      height: calc(100% - 24px);
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1.4;
    }
  `;
  
  document.head.appendChild(style);
}

// 使元素可拖拽
function makeDraggable(element, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  handle.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // 获取鼠标位置
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // 计算新位置
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // 设置元素新位置
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }
  
  function closeDragElement() {
    // 停止移动
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// 执行跳转逻辑
function executeJump() {
  // 这个函数会被1.js中的代码调用
  // 确保跳转逻辑正常工作
  console.log('准备执行跳转... - app.js:583');
}

// 导出必要的函数供其他脚本使用
window.app = {
  executeJump,
  playBackgroundMusic,
  startShowingTips,
  stopTipsTimer,
  closeAllTips
};


