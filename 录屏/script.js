const startBtn= document.getElementById("btn");
const downloadLink=  document.getElementById("link");
let blob=null,videoStream=null,audioStream=null;

startBtn.addEventListener("click",startScreenCapturing);

async function startScreenCapturing(){
if (!navigator.mediaDevices.getDisplayMedia){
return alert("Screencapturingnotsupportedinyourbrowser.");
}
if (!videoStream?.active){
videoStream=await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
try {
audioStream= await navigator.mediaDevices.getUserMedia({
audio:{ echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
});
const audioTrack=audioStream.getTracks()[0];
videoStream.addTrack(audioTrack);
} catch (error){
console.warn("No audio stream available: ", error);
}
recordStream(videoStream);
}
}

function recordStream(stream) {
countdown();
const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp8,opus" });
const recordedChunks = [];

mediaRecorder.addEventListener("dataavailable", (e) => recordedChunks.push(e.data));
stream.getVideoTracks()[0].addEventListener("ended", () => mediaRecorder.stop());

mediaRecorder.addEventListener("stop", () => {
blob = new Blob(recordedChunks, { type: recordedChunks[0].type });
showRecordedVideo();
});
setTimeout(() => mediaRecorder.start(), 4000);
}

function countdown() {
const countdownElement = document.getElementById("countdown");
let seconds = 3;
countdownElement.style.display = "flex";
const interval = setInterval(() => {
countdownElement.textContent = seconds;
seconds--;
if(seconds < 0) {
clearInterval(interval);
 countdownElement.style.display = "none";
}
}, 1000);
}

function showRecordedVideo(){
const videoElement= document.getElementById("video");
videoElement.src = URL.createObjectURL(blob);
videoElement.controls = true;
downloadLink.href = URL.createObjectURL(blob);
downloadLink.download = "screen_recording.webm";
}