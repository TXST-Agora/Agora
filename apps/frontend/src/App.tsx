import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import { ThemeProvider } from './contexts/ThemeContext';
import Landing from './components/Landing';
import Navbar from './components/Navbar';
import JoinPage from './components/JoinPage';
import Host from './components/Host';
import SessionPage from './components/SessionPage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar/>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/host" element={<Host />} />
            <Route path="/session" element={<SessionPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;