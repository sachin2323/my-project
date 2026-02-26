import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Phone, CircleAlert, CheckCircle, Mic, X } from 'lucide-react';

export default function Dashboard() {
  const [activeCalls, setActiveCalls] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [selectedCall, setSelectedCall] = useState(null); // For logging summary
  const [summaryText, setSummaryText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const fetchActiveData = useCallback(async () => {
    const { data: calls } = await supabase
      .from('calls_log')
      .select(`
        *,
        users_elderly (name)
      `)
      .eq('status', 'initiated')
      .order('created_at', { ascending: false });

    const { data: alerts } = await supabase
      .from('sos_alerts')
      .select(`
        *,
        users_elderly (name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (calls) setActiveCalls(calls);
    if (alerts) setSosAlerts(alerts);
  }, []);

  useEffect(() => {
    fetchActiveData();

    const channel = supabase
      .channel('volunteer-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls_log' }, () => {
        fetchActiveData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_alerts' }, () => {
        fetchActiveData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveData]);

  const handleResolveSOS = async (id) => {
    try {
        await supabase.from('sos_alerts').update({ status: 'resolved' }).eq('id', id);
        alert("SOS Alert marked as resolved.");
        // Realtime will update the list
    } catch (e) {
        console.error(e);
    }
  };

  // Logging Logic
  const openLogModal = (call) => {
    setSelectedCall(call);
    setSummaryText('');
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Speech recognition not supported");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setSummaryText(prev => (prev ? prev + " " : "") + text);
    };
    recognition.start();
  };

  const submitLog = async () => {
    if (!selectedCall) return;

    try {
        await supabase.from('calls_log').update({
            status: 'completed',
            summary: summaryText
        }).eq('id', selectedCall.id);

        setSelectedCall(null);
        // Realtime will update the list
    } catch(e) {
        console.error(e);
        alert("Error saving log");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-800">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Volunteer Dashboard</h1>
        <p className="text-gray-600">Monitoring real-time alerts...</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SOS Alerts Column */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-red-600 flex items-center gap-2">
            <CircleAlert /> Active SOS Alerts
          </h2>
          <div className="space-y-4">
            {sosAlerts.length === 0 && <p className="text-gray-400">No active SOS alerts.</p>}
            {sosAlerts.map(alert => (
              <div key={alert.id} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500 animate-pulse">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold">{alert.users_elderly?.name || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-500">{new Date(alert.created_at).toLocaleString()}</p>
                        <p className="font-bold text-red-600 mt-2">EMERGENCY SOS</p>
                    </div>
                    <button
                        onClick={() => handleResolveSOS(alert.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        Resolve
                    </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Calls Column */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-blue-600 flex items-center gap-2">
            <Phone /> Calls in Progress
          </h2>
          <div className="space-y-4">
            {activeCalls.length === 0 && <p className="text-gray-400">No active calls.</p>}
            {activeCalls.map(call => (
              <div key={call.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold">{call.users_elderly?.name || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-500">{new Date(call.created_at).toLocaleString()}</p>
                        <p className="mt-2 text-blue-800">Video Call Initiated</p>
                    </div>
                    <button
                        onClick={() => openLogModal(call)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        Log Summary
                    </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Log Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">Log Call Summary</h3>
                    <button onClick={() => setSelectedCall(null)} className="text-gray-500"><X /></button>
                </div>

                <p className="mb-4 text-gray-600">
                    User: <strong>{selectedCall.users_elderly?.name}</strong>
                </p>

                <div className="mb-6 relative">
                    <label className="block text-sm font-bold mb-2">Summary (Voice or Text)</label>
                    <textarea
                        className="w-full p-4 border rounded-xl h-32"
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        placeholder="Describe the call..."
                    ></textarea>
                    <button
                        onClick={startListening}
                        className={`absolute bottom-4 right-4 p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600'}`}
                        title="Voice Input"
                    >
                        <Mic size={20} />
                    </button>
                </div>

                <div className="flex justify-end gap-4">
                    <button onClick={() => setSelectedCall(null)} className="px-6 py-3 rounded-xl border">Cancel</button>
                    <button
                        onClick={submitLog}
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
                    >
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
