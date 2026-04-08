import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fadeUpVariant, fadeVariant } from '../lib/animations';

type Tab = 'login' | 'signup';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function BrandingPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-center items-center bg-indigo-600 dark:bg-indigo-800 text-white p-12 w-1/2">
      <div className="max-w-sm text-center">
        <div className="text-5xl mb-6">🔬</div>
        <h1 className="text-3xl font-bold mb-4">Multi-Agent Research Platform</h1>
        <p className="text-indigo-200 text-lg">
          Harness the power of AI agents to decompose, research, and synthesize complex topics in real time.
        </p>
      </div>
    </div>
  );
}

interface LoginFormProps {
  onError: (msg: string) => void;
}

function LoginForm({ onError }: LoginFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      login({ email }, 'mock-token');
      navigate('/');
    } catch {
      onError('Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-150"
      >
        Sign In
      </button>
      <button
        type="button"
        className="w-full py-2 px-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 flex items-center justify-center gap-2"
      >
        <span>G</span> Continue with Google
      </button>
    </form>
  );
}

interface SignUpFormProps {
  onError: (msg: string) => void;
}

function SignUpForm({ onError }: SignUpFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm your password';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      login({ email }, 'mock-token');
      navigate('/');
    } catch {
      onError('Sign up failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
      </div>
      <div>
        <label htmlFor="signup-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password
        </label>
        <input
          id="signup-confirm"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
        )}
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-150"
      >
        Create Account
      </button>
      <button
        type="button"
        className="w-full py-2 px-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 flex items-center justify-center gap-2"
      >
        <span>G</span> Continue with Google
      </button>
    </form>
  );
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setAuthError(null);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      <BrandingPanel />
      <motion.div
        className="flex flex-col justify-center items-center flex-1 p-8"
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">
            {activeTab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>

          {/* Tab switcher */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => handleTabChange('login')}
              className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors duration-150 ${
                activeTab === 'login'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => handleTabChange('signup')}
              className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors duration-150 ${
                activeTab === 'signup'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Auth error alert */}
          {authError && (
            <div
              role="alert"
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400"
            >
              {authError}
            </div>
          )}

          {/* Form with fade transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={fadeVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {activeTab === 'login' ? (
                <LoginForm onError={setAuthError} />
              ) : (
                <SignUpForm onError={setAuthError} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
