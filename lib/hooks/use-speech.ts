import { useState, useEffect, useCallback, useRef } from 'react';

// Define types for the Web Speech API since they are not standard in all TS environments yet
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string; confidence: number };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

/**
 * Custom hook for Voice Input (Speech-to-Text) and Audio Output (Text-to-Speech)
 * using standard Browser APIs (no extra costs/keys required).
 */
export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [hasSupport, setHasSupport] = useState(false);
  
  // Track intentional stopping to restart if the browser cuts it off prematurely
  const isIntentionalStopRef = useRef(false);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        // Use continuous mode to keep listening as long as possible
        recognitionInstance.continuous = true; 
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onstart = () => {
            console.log('Speech recognition started');
            setIsListening(true);
        };

        recognitionInstance.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = 0; i < event.results.length; i++) {
            const transcriptSegment = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptSegment;
            } else {
              interimTranscript += transcriptSegment;
            }
          }
          
          const fullText = finalTranscript + interimTranscript;
          // console.log('Speech transcript:', fullText); // Debug
          setTranscript(fullText);
        };

        recognitionInstance.onerror = (event) => {
          if (event.error !== 'no-speech') {
             console.error('Speech recognition error:', event.error);
          }
          
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
             setIsListening(false);
             isIntentionalStopRef.current = true; // Don't restart
          }
        };

        recognitionInstance.onend = () => {
          console.log('Speech recognition ended');
          
          // Auto-restart if we didn't intend to stop (Chrome timeout workaround)
          if (!isIntentionalStopRef.current) {
             console.log('Restarting recognition...');
             try {
                recognitionInstance.start();
             } catch (e) {
                console.error('Failed to restart recognition:', e);
                setIsListening(false);
             }
          } else {
             setIsListening(false);
          }
        };

        setRecognition(recognitionInstance);
        setHasSupport(true);
      }

      // Initialize Speech Synthesis Voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        // console.log(`Loaded ${availableVoices.length} voices`); // Debug
        setVoices(availableVoices);
      };
      
      loadVoices();
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
        setTranscript('');
        isIntentionalStopRef.current = false;
        try {
            recognition.start();
        } catch (e) {
            console.log("Recognition start called active active, ignoring.");
            // Ensure UI is synced
            setIsListening(true);
        }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      isIntentionalStopRef.current = true; // Mark as intentional
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return;

    // Fix for Chrome bug where speech stops working after a while
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }
    
    // Cancel any current speaking
    window.speechSynthesis.cancel();

    // Small delay to ensure cancellation takes effect
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Voice selection logic: Use selected voice or fallback to best available
        const voiceToUse = selectedVoice || voices.find(v => 
            (v.name.includes('Google') && v.lang.includes('en-US')) || 
            (v.name.includes('Natural') && v.lang.includes('en-US')) || 
            v.lang === 'en-US'
        );
        
        if (voiceToUse) {
            utterance.voice = voiceToUse;
            // console.log('Using voice:', voiceToUse.name);
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error('Speech synthesis error:', e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    }, 10);
    
  }, [voices]);

  /*
   * STUB: Future External TTS Integration
   * 
   * When implementing OpenAI/ElevenLabs TTS:
   * 1. Create a new function `speakExternal(text, provider)`
   * 2. Call API endpoint (likely via Next.js API route to hide keys)
   * 3. Play returned audio blob using `new Audio(url).play()`
   * 4. Update core `speak` function to check user preference:
   *    if (userSettings.useExternalTTS) {
   *       await speakExternal(text);
   *    } else {
   *       // ... existing browser synthesis code ...
   *    }
   */     

  const cancelSpeech = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Helper to set voice by name/URI
  const setVoiceByName = useCallback((name: string) => {
    const voice = voices.find(v => v.name === name);
    if (voice) setSelectedVoice(voice);
  }, [voices]);

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    hasSupport,
    setTranscript,
    voices,
    selectedVoice,
    setVoiceByName
  };
}
