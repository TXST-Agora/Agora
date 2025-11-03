import { useState, FormEvent, ChangeEvent } from 'react';
import './JoinPage.css';

const JoinPage = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ text: string; color?: string }>({ text: '' });

  const validateCode = (codeValue: string): boolean => {
    return /^\d{6}$/.test(codeValue);
  };

  const handleSignIn = () => {
    window.alert('Sign in clicked');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedCode = code.trim();

    if (!validateCode(trimmedCode)) {
      setMessage({ text: 'Please enter exactly 6 digits.', color: '#b45309' });
      return;
    }

    setMessage({ text: 'Code accepted — submitting...', color: '#065f46' });

    setTimeout(() => {
      window.alert('Code verified: ' + trimmedCode);
      setMessage({ text: '' });
    }, 600);
  };

  return (
    <div className="join-page">
      <div className="topbar">
        <button 
          className="signin-btn" 
          onClick={handleSignIn}
          aria-label="Sign in" 
          type="button"
        >
          Sign in
        </button>
      </div>

      <div className="container">
        <div className="card" role="region" aria-labelledby="pageTitle">
          <h1 id="pageTitle">Enter 6‑Digit Session Code</h1>

          <form id="codeForm" onSubmit={handleSubmit} autoComplete="off" noValidate>
            <input
              id="code"
              name="code"
              className="code-input"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="● ● ● ● ● ●"
              aria-label="Six digit code"
              value={code}
              onChange={handleInputChange}
              required
            />
            <button type="submit" className="submit">Verify</button>
          </form>

          <div 
            className="hint" 
            id="message" 
            role="status" 
            aria-live="polite"
            style={{ color: message.color || '' }}
          >
            {message.text}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
