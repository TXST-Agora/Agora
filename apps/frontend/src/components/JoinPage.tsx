import { useState, FormEvent, ChangeEvent } from 'react';
import './JoinPage.css';

const JoinPage = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const validateCode = (codeValue: string): boolean => {
    return /^\d{6}$/.test(codeValue);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
    setSessionCode(cleaned);

    setErrorMessage('');
    setConfirmationMessage('');
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    
    const trimmedCode = sessionCode.trim();

    if (!validateCode(trimmedCode)) {
      setErrorMessage('Please enter exactly 6 digits.');
      setConfirmationMessage('');
      return;
    }

    setErrorMessage('');
    setConfirmationMessage('Submitting...');

    setTimeout(() => {
      window.alert('Code verified: ' + trimmedCode);
      setConfirmationMessage('');
    }, 600);
  };

  return (
    <div className="join-page">
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
              placeholder=""
              aria-label="Six digit code"
              value={sessionCode}
              onChange={handleInputChange}
              required
            />
            <button type="submit" className="submit">Verify</button>
          </form>

          <div className="message-container">
            {errorMessage && (
              <div 
                className="message error-message" 
                role="alert" 
                aria-live="polite"
              >
                {errorMessage}
              </div>
            )}
            {confirmationMessage && (
              <div 
                className="message confirmation-message" 
                role="status" 
                aria-live="polite"
              >
                {confirmationMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
