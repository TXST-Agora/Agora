import Landing from './components/Landing';
import Navbar from './components/Navbar';
import JoinPage from './components/JoinPage';
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
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
