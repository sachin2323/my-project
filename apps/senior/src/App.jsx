import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';

function App() {
  const isRegistered = localStorage.getItem('elder_user_id');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Registration />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={isRegistered ? <Navigate to="/dashboard" replace /> : <Navigate to="/register" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
