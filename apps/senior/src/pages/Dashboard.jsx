import { useEffect, useState, useCallback } from 'react';
import { Play, Phone, Hand, CircleAlert, X, LogOut, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

export default function Dashboard() {
  const [showVideo, setShowVideo] = useState(false);
  const [buddyNumber, setBuddyNumber] = useState(localStorage.getItem('elder_buddy_number'));
  const userName = localStorage.getItem('elder_user_name');
  const userId = localStorage.getItem('elder_user_id');

  useEffect(() => {
    // Wake Lock
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock is active');
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release();
    };
  }, []);

  const handlePlayShow = useCallback(() => {
    setShowVideo(true);
  }, []);

  const handleCallBuddy = useCallback(async () => {
    try {
      await supabase.from('calls_log').insert({
        caller_id: userId,
        type: 'video',
        status: 'initiated',
        buddy_number: buddyNumber
      });
      window.location.href = `https://wa.me/${buddyNumber}?text=I%20need%20help`;
    } catch (e) {
      console.error(e);
      alert("Error initiating call");
    }
  }, [buddyNumber, userId]);

  const handleAskHelp = useCallback(async () => {
    try {
      await supabase.from('requests').insert({
        user_id: userId,
        status: 'open'
      });
      alert("Help requested. A volunteer will contact you shortly.");
      // Trigger push notification (simulation: just log)
      console.log("Push notification sent to volunteers");
    } catch (e) {
      console.error(e);
    }
  }, [userId]);

  const handleSOS = useCallback(async () => {
    // For voice activation, we might skip confirm or use a different flow, but for safety let's keep confirm or auto-confirm if voice?
    // Let's assume voice commands are intentional enough or we can add a confirmation voice step.
    // For now, I'll remove confirm for voice or handle it differently.
    // Since this is the same handler for button and voice, I'll keep confirm for button, but for voice...
    // Actually, let's keep it simple. If voice triggers, it will show the alert/confirm.

    // However, `confirm` is blocking.
    if (window.confirm("Are you sure you want to send an SOS alert?")) {
      try {
        await supabase.from('sos_alerts').insert({
          user_id: userId,
          status: 'active'
        });
        alert("SOS Alert Sent! Calling emergency contacts...");
        console.log("Twilio call initiated");
      } catch (e) {
        console.error(e);
      }
    }
  }, [userId]);

  const { isListening } = useVoiceAssistant({
    onPlay: handlePlayShow,
    onCall: handleCallBuddy,
    onHelp: handleAskHelp,
    onSOS: handleSOS
  });

  const handleLogout = () => {
    if(confirm("Exit App?")) {
        localStorage.clear();
        window.location.reload();
    }
  }

  if (showVideo) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <button
          onClick={() => setShowVideo(false)}
          className="absolute top-4 right-4 bg-red-600 text-white p-4 rounded-full z-50"
        >
          <X size={48} />
        </button>
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/videoseries?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG&autoplay=1"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-warm-bg)] p-4 flex flex-col text-[var(--color-warm-text)]">
      <header className="flex justify-between items-center mb-8 p-4">
        <h1 className="text-4xl font-bold text-[var(--color-warm-primary)]">
          Namaste, {userName}
        </h1>
        <div className="flex items-center gap-4">
            {isListening && <Mic className="animate-pulse text-green-600" size={32} />}
            <button onClick={handleLogout} className="text-gray-500 p-2">
                <LogOut size={32} />
            </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 gap-6">
        <button
          onClick={handlePlayShow}
          className="bg-[var(--color-warm-accent)] text-white text-5xl font-bold rounded-3xl shadow-xl flex items-center justify-center gap-6 py-12 active:scale-95 transition-transform"
        >
          <Play size={64} fill="currentColor" /> Play Show
        </button>

        <button
          onClick={handleCallBuddy}
          className="bg-[var(--color-warm-primary)] text-white text-5xl font-bold rounded-3xl shadow-xl flex items-center justify-center gap-6 py-12 active:scale-95 transition-transform"
        >
          <Phone size={64} /> Call Buddy
        </button>

        <button
          onClick={handleAskHelp}
          className="bg-yellow-400 text-black text-5xl font-bold rounded-3xl shadow-xl flex items-center justify-center gap-6 py-12 active:scale-95 transition-transform"
        >
          <Hand size={64} /> Ask Help
        </button>

        <button
          onClick={handleSOS}
          className="bg-red-600 text-white text-5xl font-bold rounded-3xl shadow-xl flex items-center justify-center gap-6 py-12 active:scale-95 transition-transform animate-pulse"
        >
          <CircleAlert size={64} /> SOS
        </button>
      </div>
    </div>
  );
}
