import { FormEvent, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Seo from '../../components/Seo';

function isStrongAccessCode(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

export default function AgentLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accessCodeChecks = useMemo(
    () => [
      { label: 'Minimum 8 characters', ok: accessCode.length >= 8 },
      { label: 'At least 1 uppercase letter', ok: /[A-Z]/.test(accessCode) },
      { label: 'At least 1 number', ok: /\d/.test(accessCode) },
    ],
    [accessCode]
  );

  const saveSession = (agent: { id?: string; email?: string } | null | undefined, code: string, agentToken?: string) => {
    if (!agent?.id || !agent?.email) {
      throw new Error('Agent details were not returned. Refresh the page and try again.');
    }
    if (!agentToken) {
      throw new Error('Agent token was not returned. Please log in again after registration.');
    }

    localStorage.setItem(
      'eydost_agent_session',
      JSON.stringify({ agentId: agent.id, accessCode: code, email: agent.email, agentToken })
    );
    navigate('/agent/dashboard');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/agent-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, accessCode }),
      });
      const responseText = await response.text();
      let payload: any = {};
      try {
        payload = responseText ? JSON.parse(responseText) : {};
      } catch {
        payload = { error: responseText || 'Login server error' };
      }
      if (!response.ok) throw new Error(payload.error || 'Login failed');

      saveSession(payload.agent, accessCode, payload.agentToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!isStrongAccessCode(accessCode)) {
      setError('Access code must be at least 8 characters and include 1 uppercase letter and 1 number');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/agent-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, companyName, phoneNumber, email, accessCode }),
      });
      const responseText = await response.text();
      let payload: any = {};
      try {
        payload = responseText ? JSON.parse(responseText) : {};
      } catch {
        payload = { error: responseText || 'Registration server error' };
      }
      if (!response.ok) throw new Error(payload.error || 'Registration failed');

      saveSession(payload.agent, accessCode, payload.agentToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <Seo title="Agent Login" noIndex canonicalPath="/agent/login" />
      <form onSubmit={mode === 'login' ? submit : register} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-5">
          {mode === 'login' ? <LockKeyhole className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'login' ? 'Agent dashboard login' : 'Agent registration'}
        </h1>
        <p className="text-gray-600 mt-2 mb-6">
          {mode === 'login'
            ? 'Sign in with your email and access code.'
            : 'Enter your details and create a strong access code. Your referral code becomes available after admin approval.'}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-5 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-lg py-2 text-sm font-bold ${mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-lg py-2 text-sm font-bold ${mode === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            Register
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">{error}</div>}

        {mode === 'register' && (
          <>
            <label className="block mb-4">
              <span className="text-sm font-bold text-gray-700">Full name</span>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
              />
            </label>
            <label className="block mb-4">
              <span className="text-sm font-bold text-gray-700">Company name</span>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
              />
            </label>
            <label className="block mb-4">
              <span className="text-sm font-bold text-gray-700">Phone</span>
              <input
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+994..."
                className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
              />
            </label>
          </>
        )}

        <label className="block mb-4">
          <span className="text-sm font-bold text-gray-700">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-bold text-gray-700">
            {mode === 'login' ? 'Access code' : 'Create access code'}
          </span>
          <div className="relative mt-2">
            <input
              required
              type={showAccessCode ? 'text' : 'password'}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              minLength={mode === 'register' ? 8 : 1}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'register' ? 'Minimum 8 characters' : undefined}
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
            />
            <button
              type="button"
              onClick={() => setShowAccessCode((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label={showAccessCode ? 'Hide' : 'Show'}
              title={showAccessCode ? 'Hide' : 'Show'}
            >
              {showAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </label>

        {mode === 'register' && (
          <div className="mb-6 grid gap-1.5 text-xs font-semibold">
            {accessCodeChecks.map((item) => (
              <div key={item.label} className={item.ok ? 'text-emerald-700' : 'text-gray-500'}>
                {item.ok ? 'OK' : '-'} {item.label}
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

