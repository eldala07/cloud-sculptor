import { useEffect, useState } from 'react';

interface AuthGateProps {
  children: React.ReactNode;
}

type AuthState = 'checking' | 'authenticated' | 'locked' | 'misconfigured' | 'local';

export function AuthGate({ children }: AuthGateProps) {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const response = await fetch('/api/auth');

        if (!response.ok) {
          throw new Error('Auth endpoint unavailable');
        }

        const session = (await response.json()) as {
          authenticated?: boolean;
          configured?: boolean;
        };

        if (!isMounted) {
          return;
        }

        if (!session.configured) {
          setAuthState('misconfigured');
        } else if (session.authenticated) {
          setAuthState('authenticated');
        } else {
          setAuthState('locked');
        }
      } catch {
        if (isMounted) {
          setAuthState('local');
        }
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passcode }),
      });

      if (!response.ok) {
        setError('That passcode did not unlock the sky.');
        return;
      }

      setAuthState('authenticated');
      setPasscode('');
    } catch {
      setError('The auth service is not available.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authState === 'authenticated' || authState === 'local') {
    return <>{children}</>;
  }

  if (authState === 'checking') {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="app-label">Cloud Sculptor</p>
          <h1>Checking access</h1>
        </section>
      </main>
    );
  }

  if (authState === 'misconfigured') {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="app-label">Cloud Sculptor</p>
          <h1>Passcode required</h1>
          <p>Set `APP_PASSCODE` on the server before publishing this app with AI enabled.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <form className="auth-panel" onSubmit={handleSubmit}>
        <p className="app-label">Cloud Sculptor</p>
        <h1>Unlock the sky</h1>
        <p>Enter the shared passcode to draw and generate cloud friends.</p>
        <label className="name-field">
          <span>Passcode</span>
          <input
            autoFocus
            type="password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button className="primary-action full-width" type="submit" disabled={!passcode || isSubmitting}>
          {isSubmitting ? 'Unlocking...' : 'Enter'}
        </button>
      </form>
    </main>
  );
}
