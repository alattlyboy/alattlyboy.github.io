<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

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

$response = ['success' => false];

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
                $response = [
                    'success' => true,
                    'path' => 'uploads/' . $dateDir . $uniqueId . '_original.' . $ext,
                    'message' => '图片已上传'
                ];
            }
        }
    }
    
    // 处理素描图 base64 保存
    if (isset($_POST['sketchData']) && isset($_POST['fileName'])) {
        $sketchData = $_POST['sketchData'];
        $fileName = preg_replace('/[^a-zA-Z0-9\-_\.]/', '', $_POST['fileName']);
        
        $imgData = substr($sketchData, strpos($sketchData, ",") + 1);
        $imgData = str_replace(' ', '+', $imgData);
        $decodedData = base64_decode($imgData);
        
        if ($decodedData !== false) {
            $dateDir = date('Y-m-d') . '/';
            $uniqueId = uniqid() . '_' . time();
            $sketchPath = ensureDir($SKETCH_DIR . $dateDir) . $uniqueId . '_sketch.png';
            
            if (file_put_contents($sketchPath, $decodedData)) {
                $response = [
                    'success' => true,
                    'path' => str_replace(__DIR__ . '/', '', $sketchPath),
                    'message' => '素描图已保存'
                ];
            }
        }
    }
}

echo json_encode($response);