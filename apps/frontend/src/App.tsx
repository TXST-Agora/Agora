import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import Landing from './components/Landing';
import Navbar from './components/Navbar';
import JoinPage from './components/JoinPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
      <Navbar title="Agora"/>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/join" element={<JoinPage />} />
        </Routes>
      </div>
    </BrowserRouter>

  );
}

export default App;