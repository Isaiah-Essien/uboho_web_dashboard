// Simple notification sound utility using Web Audio API
export const playNotificationSound = () => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create oscillator for a simple beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect oscillator to gain node to audio context destination
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure the sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz frequency
    oscillator.type = 'sine'; // Sine wave for a clean sound
    
    // Configure volume (fade in and out for a smoother sound)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};
