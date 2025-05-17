import React, { useState, useEffect } from 'react';
import './AuthComponent.css';
import { FcGoogle } from 'react-icons/fc';
import { FiEye, FiEyeOff, FiGithub } from 'react-icons/fi';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<AuthResponse>;
  onRegister: (name: string, email: string, password: string) => Promise<AuthResponse>;
  onCheckEmail: (email: string) => Promise<{ success: boolean; registered: boolean; type?: "normal" | "google" | "microsoft" | "github" }>;
  onShowTerms: (type: 'terms' | 'privacy') => void;
  onGoogleSignIn?: () => Promise<void>;
  onMicrosoftSignIn?: () => Promise<void>;
  onGitHubSignIn?: () => Promise<void>;
}

export function Auth({
  onLogin,
  onRegister,
  onCheckEmail,
  onShowTerms,
  onGoogleSignIn = async () => {
    console.warn('Google Sign-In not implemented in parent component');
  },
  onMicrosoftSignIn = async () => {
    console.warn('Microsoft Sign-In not implemented in parent component');
  },
  onGitHubSignIn = async () => {
    console.warn('GitHub Sign-In not implemented in parent component');
  },
}: LoginProps) {
  const [step, setStep] = useState<'email' | 'login' | 'register'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailType, setEmailType] = useState<null | "normal" | "google" | "microsoft" | "github">(null);

  useEffect(() => {
    if (step === 'register') {
      if (!passwordValid && password.length > 0) {
        setError('Password must be at least 6 characters');
      } else if (confirmPassword.length > 0 && !passwordsMatch) {
        setError('Passwords do not match');
      } else {
        setError('');
      }
    }
    // eslint-disable-next-line
  }, [password, confirmPassword, step]);

  async function handleGoogleSignIn() {
    setError('');
    setIsLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err: any) {
      setError(
        typeof err === 'string'
          ? err
          : (err && err.message)
            ? err.message
            : 'Google Sign-In failed'
      );
      console.error('Google Sign-In error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMicrosoftSignIn() {
    setError('');
    setIsLoading(true);
    try {
      await onMicrosoftSignIn();
    } catch (err: any) {
      setError(
        typeof err === 'string'
          ? err
          : (err && err.message)
            ? err.message
            : 'Microsoft Sign-In failed'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGitHubSignIn() {
    setError('');
    setIsLoading(true);
    try {
      await onGitHubSignIn();
    } catch (err: any) {
      setError(
        typeof err === 'string'
          ? err
          : (err && err.message)
            ? err.message
            : 'GitHub Sign-In failed'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function isValidEmail(email: string) {
    // Use a more robust regex for email validation
    // Allows letters, numbers, ., _, %, +, - in the local part
    // Allows letters, numbers, ., - in the domain part
    // Requires a TLD of at least 2 letters
    // Local part cannot start with hyphen and cannot have consecutive hyphens
    return /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+]|-(?=[a-zA-Z0-9._%+]))*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  const passwordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword && passwordValid;

  async function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEmailType(null);
    if (!email) {
      setError('Please enter your email');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Email is invalid');
      return;
    }
    setIsLoading(true);
    try {
      const res = await onCheckEmail(email);
      if (res.success) {
        setEmailType(res.type || null);
        if (res.registered) {
          if (res.type === "normal") {
            setStep('login');
          } else if (res.type === "google") {
            setError('This email is registered via Google. Please use "Continue with Google".');
          } else if (res.type === "microsoft") {
            setError('This email is registered via Microsoft. Please use "Continue with Microsoft".');
          } else if (res.type === "github") {
            setError('This email is registered via GitHub. Please use "Continue with GitHub".');
          } else {
            setError('This email is registered with a social provider. Please use the appropriate sign-in.');
          }
        } else {
          setStep('register');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await onLogin(email, password);
      if (!response.success) {
        if (
          response.message?.toLowerCase().includes('invalid') ||
          response.message?.toLowerCase().includes('credentials')
        ) {
          setError('Invalid email or password');
        } else {
          setError('Login error: Something went wrong please try again');
        }
      }
    } catch {
      setError('Login error: Something went wrong please try again');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name) {
      setError('Please enter your name');
      return;
    }
    if (!passwordValid) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const response = await onRegister(name, email, password);
      if (!response.success) {
        setError(response.message || 'Registration failed');
      }
    } catch {
      setError('Registration error: Something went wrong please try again');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="auth-form-container"
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        marginBottom: '1.5rem',
        paddingLeft: '40px'
      }}>
        <h1 style={{
          textAlign: 'left',
          margin: 0,
          fontSize: '1.5rem',
          color: 'var(--text-color)',
          whiteSpace: 'nowrap'
        }}>
          <b>Codemate. Lock In</b><span role="img" aria-label="fire">🔥</span>
        </h1>
        <div style={{
          textAlign: 'left',
          marginTop: '0.5rem',
          color: 'var(--text-color)',
          fontSize: '1.1rem',
          fontWeight: 500
        }}>
          {step === 'email'
            ? 'Log in to your Codemate account'
            : step === 'login'
            ? 'Welcome back'
            : 'Create your Codemate account'}
        </div>
      </div>

      <div className='social-signin' style={{ display: 'flex', flexDirection: 'column' }}>
        <button
          className="social-sign-in-button"
          onClick={handleGoogleSignIn}
          style={{ marginBottom: 8, backgroundColor: 'var(--backgroundColor)' }}
        >
          <FcGoogle size={22} style={{ marginLeft: 8, flexShrink: 0 }} />
          <span style={{
            fontWeight: 700,
            marginRight: 30,
            flex: 1,
          }}>
            Continue with Google
          </span>
        </button>

        <button
          className="social-sign-in-button"
          onClick={handleMicrosoftSignIn}
          style={{ marginBottom: 8, display: 'flex', alignItems: 'center', backgroundColor: 'var(--backgroundColor)' }}
        >
          <span
            style={{
              display: 'inline-flex',
              width: 22,
              height: 22,
              marginLeft: 8,
              marginRight: 8,
              flexShrink: 0,
            }}
            aria-label="Microsoft"
          >
            <svg width="22" height="22" viewBox="0 0 22 22">
              <rect x="0" y="0" width="10" height="10" fill="#F35325" />
              <rect x="12" y="0" width="10" height="10" fill="#81BC06" />
              <rect x="0" y="12" width="10" height="10" fill="#05A6F0" />
              <rect x="12" y="12" width="10" height="10" fill="#FFBA08" />
            </svg>
          </span>
          <span style={{
            fontWeight: 700,
            marginRight: 30,
            flex: 1,
          }}>
            Continue with Microsoft
          </span>
        </button>

        <button
          style={{
            backgroundColor: 'var(--backgroundColor)'
          }}
          className="social-sign-in-button"
          onClick={handleGitHubSignIn}
        >
          <FiGithub size={22} style={{ marginLeft: 8, marginRight: 8, flexShrink: 0 }} />
          <span style={{
            fontWeight: 700,
            marginRight: 30,
            flex: 1,
          }}>
            Continue with GitHub
          </span>
        </button>
      </div>

      <hr style={{
        width: 340,
        border: 0,
        borderTop: '1px solid var(--border-color)',
        margin: '20px 0'
      }} />

      {step === 'email' && (
        <form onSubmit={handleEmailContinue} style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <label
              htmlFor="email"
              style={{
                marginBottom: 4,
                color: 'color-mix(in srgb, var(--text-color) 40%, #888 20%)',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (error && error.toLowerCase().includes('email')) setError('');
              }}
              autoComplete="email"
              placeholder="Enter your email address..."
              style={{
                background: 'var(--background-color)',
                width: '100%',
                maxWidth: 320,
              }}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Continue →'}
          </button>
        </form>
      )}

      {step === 'login' && emailType === "normal" && (
        <form onSubmit={handleLoginSubmit} style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            className="form-group"
            style={{
              width: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <label
              htmlFor="password"
              style={{
                marginBottom: 4,
                color: 'color-mix(in srgb, var(--text-color) 40%, #888 20%)',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password..."
                style={{
                  background: 'var(--background-color)',
                  width: '100%',
                  maxWidth: 320,
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--secondary-color)',
                  height: 32,
                  width: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      )}

      {step === 'login' && emailType && emailType !== "normal" && (
        <div className="error-message">
          {emailType === "google" && 'This email is registered via Google. Please use "Continue with Google".'}
          {emailType === "microsoft" && 'This email is registered via Microsoft. Please use "Continue with Microsoft".'}
          {emailType === "github" && 'This email is registered via GitHub. Please use "Continue with GitHub".'}
        </div>
      )}

      {step === 'register' && emailType === null && (
        <form onSubmit={handleRegisterSubmit} style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            className="form-group"
            style={{
              width: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <label 
              htmlFor="name"
              style={{
                marginBottom: 4,
                color: 'color-mix(in srgb, var(--text-color) 40%, #888 20%)',
              }}
            >
              Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Enter your full name..."
                style={{
                  background: 'var(--background-color)',
                  width: '100%',
                  maxWidth: 320,
                }}
              />
            </div>
          </div>
          <div
            className="form-group"
            style={{
              width: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <label 
              htmlFor="password"
              style={{
                marginBottom: 4,
                color: 'color-mix(in srgb, var(--text-color) 40%, #888 20%)',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter a 6 character password"
                style={{
                  background: 'var(--background-color)',
                  width: '100%',
                  maxWidth: 320,
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--secondary-color)',
                  height: 32,
                  width: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>
          <div
            className="form-group"
            style={{
              width: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <label 
              htmlFor="confirmPassword"
              style={{
                marginBottom: 4,
                color: 'color-mix(in srgb, var(--text-color) 40%, #888 20%)',
              }}
            >
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Enter a 6 character password"
                style={{
                  background: 'var(--background-color)',
                  width: '100%',
                  maxWidth: 320,
                }}
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirmPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--secondary-color)',
                  height: 32,
                  width: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                tabIndex={-1}
              >
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading || !passwordValid || !passwordsMatch}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      )}

      {step === 'register' && emailType && emailType !== "normal" && (
        <div className="error-message">
          {emailType === "google" && 'This email is already registered via Google. Please use "Continue with Google".'}
          {emailType === "microsoft" && 'This email is already registered via Microsoft. Please use "Continue with Microsoft".'}
          {emailType === "github" && 'This email is already registered via GitHub. Please use "Continue with GitHub".'}
        </div>
      )}

      <div className="terms-privacy-notice" style={{ marginTop: 16 }}>
        By continuing, you acknowledge that you agree to the{' '}
        <button
          className="terms-link"
          onClick={() => onShowTerms('terms')}
          type="button"
        >
          Terms &amp; Condition
        </button>
        {' '}and{' '}
        <button
          className="terms-link"
          onClick={() => onShowTerms('privacy')}
          type="button"
        >
          Privacy Policy
        </button>
        .
      </div>
    </div>
  );
}
