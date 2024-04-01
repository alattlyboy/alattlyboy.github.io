// 获取视频流
navigator.mediaDevices.getUserMedia({ video: true })
  .then(function(stream) {
    var video = document.getElementById('video');
    video.srcObject = stream;
    video.play();
  })
  .catch(function(err) {
    console.log("An error occurred: " + err);
  });

// 拍照
document.getElementById('capture-btn').addEventListener('click', function() {
  var video = document.getElementById('video');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 将照片转换为Base64编码
  var dataURL = canvas.toDataURL('image/png');

  // 调用上传函数
  uploadPhoto(dataURL);
});

// 上传照片
function uploadPhoto(photoData) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'upload.php', true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log('Photo uploaded successfully!');
    }
  };
  xhr.send('photo=' + encodeURIComponent(photoData));
}
