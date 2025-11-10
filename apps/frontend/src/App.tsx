import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import Landing from './components/Landing';
import Navbar from './components/Navbar';
import JoinPage from './components/JoinPage';
import Host from './components/Host';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
      <Navbar/>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/host" element={<Host />} />
        </Routes>
      </div>
    </BrowserRouter>

  );
}

export default App;