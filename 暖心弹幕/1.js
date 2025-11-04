// 移除自动跳转逻辑，让用户专注于查看弹窗效果

// 保留ntzgo函数的核心功能，但移除跳转相关代码
function ntzgo() {
  // 保留哈希值处理，用于页面标识
  if (window.location.hash) {
    // 尝试获取哈希值中的时间戳
    const timestamp = window.location.hash.substring(1);
    if (!isNaN(timestamp)) {
      // 可以在这里做一些验证，但不执行跳转
      return;
    }
  }
  
  // 添加hashchange事件监听
  window.addEventListener('hashchange', function() {
    // 只处理哈希变化，不执行跳转
    console.log('哈希值已变化:', window.location.hash);
  });
  
  // 如果没有哈希值，添加当前时间戳作为标识
  if (!window.location.hash || isNaN(window.location.hash.substring(1))) {
    window.location.hash = Date.now();
  }
}

// 调用初始化函数
ntzgo();

// 保留executeJump函数供app.js调用，但不会执行实际跳转
function executeJump() {
  console.log('弹窗效果已完成');
  // 不执行实际跳转，让用户可以继续查看弹窗
}