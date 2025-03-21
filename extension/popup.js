let mediaRecorder;
let recordedChunks = [];

async function startRecording() {
  try {
    // Request microphone access
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Request system audio capture
    const systemStream = await navigator.mediaDevices.getDisplayMedia({
      video: false, // No need for video
      audio: true
    });

    // Ensure system audio is captured
    if (!systemStream.getAudioTracks().length) {
      alert("System audio not captured! Make sure you select an application with audio playing.");
      return;
    }

    // Combine microphone + system audio into one stream
    const audioTracks = [...micStream.getAudioTracks(), ...systemStream.getAudioTracks()];
    const combinedStream = new MediaStream(audioTracks);

    mediaRecorder = new MediaRecorder(combinedStream);

    mediaRecorder.ondataavailable = (event) => recordedChunks.push(event.data);
    mediaRecorder.onstop = saveRecording;

    mediaRecorder.start();

    document.getElementById("startRecording").disabled = true;
    document.getElementById("stopRecording").disabled = false;
  } catch (error) {
    console.error("Error starting recording:", error);
    alert("Permission denied or system audio not captured. Make sure you allow access.");
  }
}



function stopRecording() {
  mediaRecorder.stop();
  document.getElementById("startRecording").disabled = false;
  document.getElementById("stopRecording").disabled = true;
}

function saveRecording() {
  const blob = new Blob(recordedChunks, { type: 'audio/webm' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recording.webm';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("startRecording").addEventListener("click", startRecording);
document.getElementById("stopRecording").addEventListener("click", stopRecording);