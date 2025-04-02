function playFart() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine'; // Can be 'square', 'triangle', or 'sawtooth' for different sounds
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime); // Start frequency
  oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5); // End frequency, duration 0.5s

  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // Start volume
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5); // End volume, duration 0.5s

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// Trigger the sound on a button click or any other event
const button = document.createElement('button');
button.textContent = 'Fart';
button.addEventListener('click', playFart);
document.body.appendChild(button);
