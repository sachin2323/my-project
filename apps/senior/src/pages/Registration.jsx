import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight, Check } from 'lucide-react';

export default function Registration() {
  const [step, setStep] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    primary_language: 'English',
    interests: [],
    emergency_contact_1: '',
    emergency_contact_2: '',
    buddy_whatsapp_number: ''
  });
  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = formData.primary_language === 'Hindi' ? 'hi-IN' : 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      }
    }
  }, [step, formData.primary_language]);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = formData.primary_language === 'Hindi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // Play audio prompt on step change with a slight delay
    const timer = setTimeout(() => {
      if (step === 1) speak("What is your name? Please say or type it.");
      if (step === 2) speak("Select your primary language.");
      if (step === 3) speak("What are your interests? Select from the list.");
      if (step === 4) speak("Please provide an emergency contact number.");
      if (step === 5) speak("Please provide your buddy's WhatsApp number.");
    }, 500);
    return () => clearTimeout(timer);
  }, [step]);

  const handleVoiceInput = (text) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (step === 1) newData.name = text;
      if (step === 4) newData.emergency_contact_1 = text.replace(/\D/g,'');
      if (step === 5) newData.buddy_whatsapp_number = text.replace(/\D/g,'');
      return newData;
    });
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
        // If already started, stop and start?
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 100);
      }
    } else {
      alert("Voice input not supported in this browser.");
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    try {
      const { data, error } = await supabase.from('users_elderly').insert([formData]).select();

      if (error) throw error;

      if (data && data.length > 0) {
        // Store user ID in local storage for session
        localStorage.setItem('elder_user_id', data[0].id);
        localStorage.setItem('elder_user_name', data[0].name);
        localStorage.setItem('elder_buddy_number', data[0].buddy_whatsapp_number);
        localStorage.setItem('elder_language', data[0].primary_language);

        navigate('/dashboard');
        // Reload to force App to see the local storage change
        window.location.reload();
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert('Error registering. Please try again: ' + error.message);
    }
  };

  const toggleInterest = (interest) => {
    const current = formData.interests;
    if (current.includes(interest)) {
      setFormData({ ...formData, interests: current.filter(i => i !== interest) });
    } else {
      setFormData({ ...formData, interests: [...current, interest] });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-warm-bg)] p-8 flex flex-col items-center justify-center text-[var(--color-warm-text)]">
      <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-[var(--color-warm-primary)]">
          Welcome
        </h1>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-6">
            <label className="text-3xl block">What is your name?</label>
            <input
              type="text"
              className="w-full text-3xl p-4 border-2 border-[var(--color-warm-secondary)] rounded-xl"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
            />
          </div>
        )}

        {/* Step 2: Language */}
        {step === 2 && (
          <div className="space-y-6">
            <label className="text-3xl block">Language / भाषा</label>
            <div className="grid grid-cols-2 gap-4">
              {['English', 'Hindi', 'Marathi', 'Bengali', 'Tamil', 'Telugu'].map(lang => (
                <button
                  key={lang}
                  onClick={() => setFormData(prev => ({...prev, primary_language: lang}))}
                  className={`text-2xl p-6 rounded-xl border-2 ${formData.primary_language === lang ? 'bg-[var(--color-warm-primary)] text-white border-[var(--color-warm-primary)]' : 'bg-white border-gray-300'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Interests */}
        {step === 3 && (
          <div className="space-y-6">
            <label className="text-3xl block">Interests</label>
            <div className="grid grid-cols-2 gap-4">
              {['Music', 'Devotional', 'News', 'Cooking', 'Gardening', 'Yoga'].map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`text-2xl p-4 rounded-xl border-2 ${formData.interests.includes(interest) ? 'bg-[var(--color-warm-secondary)] text-white border-[var(--color-warm-secondary)]' : 'bg-white border-gray-300'}`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Emergency Contact */}
        {step === 4 && (
          <div className="space-y-6">
            <label className="text-3xl block">Emergency Contact</label>
            <input
              type="tel"
              placeholder="1234567890"
              className="w-full text-3xl p-4 border-2 border-[var(--color-warm-secondary)] rounded-xl"
              value={formData.emergency_contact_1}
              onChange={(e) => setFormData(prev => ({...prev, emergency_contact_1: e.target.value}))}
            />
          </div>
        )}

        {/* Step 5: Buddy Number */}
        {step === 5 && (
          <div className="space-y-6">
            <label className="text-3xl block">Buddy WhatsApp Number</label>
            <p className="text-xl text-gray-500">The person you trust most.</p>
            <input
              type="tel"
              placeholder="919876543210"
              className="w-full text-3xl p-4 border-2 border-[var(--color-warm-secondary)] rounded-xl"
              value={formData.buddy_whatsapp_number}
              onChange={(e) => setFormData(prev => ({...prev, buddy_whatsapp_number: e.target.value}))}
            />
          </div>
        )}

        {/* Controls */}
        <div className="mt-12 flex justify-between items-center gap-4">
           <button
             onClick={startListening}
             disabled={isListening}
             className={`p-6 rounded-full ${isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-gray-200 text-gray-700'}`}
           >
             <Mic size={48} />
           </button>

           <button
             onClick={handleNext}
             className="flex-1 bg-[var(--color-warm-accent)] text-white px-8 py-6 rounded-2xl text-3xl font-bold flex items-center justify-center gap-4 shadow-lg active:scale-95 transition-transform"
           >
             {step === 5 ? 'Finish' : 'Next'} <ArrowRight size={32} />
           </button>
        </div>
      </div>
    </div>
  );
}
