/**
 * Text-to-Speech utility for voice-guided feedback
 * Maps the app's language code to the appropriate BCP 47 language tag
 * used by the Web Speech API.
 */

const langMap = {
  'en': 'en-US',
  'si': 'si-LK', // Sinhala (Sri Lanka)
  'ta': 'ta-LK'  // Tamil (Sri Lanka) or ta-IN
};

export const speakMessage = (text, appLangCode = 'en') => {
  // Check if Web Speech API is supported
  if (!('speechSynthesis' in window)) {
    console.warn("Web Speech API is not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set the language for the utterance
  utterance.lang = langMap[appLangCode] || 'en-US';

  // Optional: Adjust speech properties (pitch, rate, volume)
  utterance.rate = 1.0; // Normal speed
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Speak the message
  window.speechSynthesis.speak(utterance);
};
