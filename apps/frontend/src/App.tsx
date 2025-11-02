import Landing from './components/Landing';
import Navbar from './components/Navbar';
import './App.css';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar title="Agora"/>
      <Landing />
    </div>
  );
}
