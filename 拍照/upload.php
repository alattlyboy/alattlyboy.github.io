<?php
// 指定照片保存的目录
$uploadDirectory = 'index.html';

// 如果目录不存在，则创建目录
if (!file_exists($uploadDirectory)) {
    mkdir($uploadDirectory, 0777, true);
}

// 检查是否收到了上传的照片数据
if (isset($_POST['photo']) && !empty($_POST['photo'])) {
    // 解码 base64 编码的照片数据
    $photoData = $_POST['photo'];
    $photoData = str_replace('data:image/png;base64,', '', $photoData);
    $photoData = str_replace(' ', '+', $photoData);
    $photoBinary = base64_decode($photoData);

    // 生成唯一的文件名
    $fileName = uniqid() . '.png';
    $filePath = $uploadDirectory . $fileName;

    // 将照片数据写入文件
    file_put_contents($filePath, $photoBinary);

    // 返回照片的文件路径
    echo $filePath;
} else {
    echo '未接收到照片数据。';
}
?>