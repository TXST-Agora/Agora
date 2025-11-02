import './lib/socket';

export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Agora (Foundation)</h1>
      <p>API Base: {import.meta.env.VITE_API_BASE_URL}</p>
      <p>Socket URL: {import.meta.env.VITE_SOCKET_URL}</p>
    </div>
  );
}
