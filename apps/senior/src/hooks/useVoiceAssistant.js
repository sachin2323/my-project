import { useEffect, useState, useRef } from 'react';

export function useVoiceAssistant({ onPlay, onCall, onHelp, onSOS }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN'; // Default to Hinglish

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Voice Assistant Listening...');
    };

    recognition.onresult = (event) => {
      const lastResultIndex = event.results.length - 1;
      const transcript = event.results[lastResultIndex][0].transcript.toLowerCase();
      console.log('Heard:', transcript);

      // Check for wake words and commands
      if (transcript.includes('suno') || transcript.includes('beta') || transcript.includes('hello')) {

        if (transcript.includes('play') || transcript.includes('show') || transcript.includes('video') || transcript.includes('youtube')) {
          onPlay();
        }

        if (transcript.includes('call') || transcript.includes('phone') || transcript.includes('buddy')) {
          onCall();
        }

        if (transcript.includes('help') || transcript.includes('madad')) {
          onHelp();
        }

        if (transcript.includes('sos') || transcript.includes('bachao') || transcript.includes('alert')) {
          onSOS();
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Automatically restart listening
      try {
        recognition.start();
      } catch (e) {
        // Ignore if already started
      }
    };

    recognitionRef.current = recognition;

    // Start listening
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // Prevent restart
        recognitionRef.current.stop();
      }
    };
  }, [onPlay, onCall, onHelp, onSOS]);

  return { isListening };
}
