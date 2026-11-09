import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';

import NexcodeLogo from '../components/NexcodeLogo';

const signupSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(3, 'First name must be at least 3 characters')
      .max(30, 'First name cannot exceed 30 characters'),

    lastName: z
      .string()
      .trim()
      .max(20, 'Last name cannot exceed 20 characters'),

    emailId: z.string().trim().email('Please enter a valid email address'),

    password: z.string().min(8, 'Password must be at least 8 characters'),

    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const Signup = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      emailId: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      navigate('/login');
    }, 1200);

    return () => clearTimeout(timer);
  }, [successMessage, navigate]);

  const onSubmit = async (formData) => {
    setApiError('');
    setSuccessMessage('');

    try {
      await axios.post(
        'http://localhost:4444/user/register',
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          emailId: formData.emailId,
          password: formData.password,
        },
        {
          withCredentials: true,
        },
      );

      setSuccessMessage('Your account has been created successfully.');
    } catch (error) {
      if (error.response?.data) {
        const message =
          typeof error.response.data === 'string'
            ? error.response.data
            : 'Unable to create your account. Please try again.';

        setApiError(message);
        return;
      }

      setApiError(
        'Unable to connect to NEXCODE. Please check your connection and try again.',
      );
    }
  };

  return (
    <main className="nc-page">
      <div className="nc-shell">
        <header className="nc-header">
          <Link to="/" className="nc-header-brand" aria-label="NEXCODE home">
            <NexcodeLogo className="h-9 w-auto" />
          </Link>

          <div className="nc-header-meta">
            <span className="nc-header-meta-label">DEVELOPER PLATFORM</span>

            <span className="nc-header-divider" />

            <span className="nc-header-version">v1.0</span>

            <span className="nc-online">
              <span className="nc-online-dot" />
              Online
            </span>
          </div>
        </header>

        <div className="nc-content">
          <section className="nc-intro">
            <div className="nc-intro-grid" />

            <div className="nc-intro-content">
              <div className="nc-kicker">
                <span className="nc-kicker-line" />
                DEVELOPER PLATFORM / 01
              </div>

              <h1 className="nc-hero-title">
                Turn problems
                <br />
                into <span>progress.</span>
              </h1>

              <p className="nc-hero-description">
                Practice deliberately. Submit confidently. Improve continuously.
              </p>

              <div className="nc-principles">
                <Principle
                  number="01"
                  title="Practice"
                  description="Sharpen your problem-solving skills."
                />

                <Principle
                  number="02"
                  title="Submit"
                  description="Write, run, and evaluate your solutions."
                />

                <Principle
                  number="03"
                  title="Improve"
                  description="Track your progress and keep moving."
                />
              </div>
            </div>

            <div className="nc-intro-footer">
              <div>
                <span className="nc-footer-label">NEXCODE ENGINE</span>
                <span className="nc-footer-value">AUTH / 1.0</span>
              </div>

              <div className="nc-footer-status">
                <span className="nc-online-dot" />
                Registration available
              </div>
            </div>
          </section>

          <section className="nc-form-section">
            <div className="nc-form-container">
              <div className="nc-form-heading">
                <div className="nc-form-icon" aria-hidden="true">
                  <UserRound size={19} strokeWidth={1.8} />
                </div>

                <div>
                  <p className="nc-form-kicker">SECURE REGISTRATION</p>

                  <h2>Create your account</h2>

                  <p>Join NEXCODE and start solving problems today.</p>
                </div>
              </div>

              {apiError && (
                <div className="nc-alert nc-alert-error" role="alert">
                  <span>{apiError}</span>
                </div>
              )}

              {successMessage && (
                <div
                  className="nc-alert nc-alert-success"
                  role="status"
                  aria-live="polite"
                >
                  <Check size={17} aria-hidden="true" />

                  <span>{successMessage} Redirecting to login...</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="nc-form"
              >
                <div className="nc-name-grid">
                  <FormField
                    id="firstName"
                    label="First name"
                    required
                    error={errors.firstName?.message}
                  >
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      type="text"
                      placeholder="John"
                      autoComplete="given-name"
                      icon={<UserRound size={17} />}
                      error={errors.firstName}
                    />
                  </FormField>

                  <FormField
                    id="lastName"
                    label="Last name"
                    optional
                    error={errors.lastName?.message}
                  >
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      type="text"
                      placeholder="Doe"
                      autoComplete="family-name"
                      icon={<UserRound size={17} />}
                      error={errors.lastName}
                    />
                  </FormField>
                </div>

                <FormField
                  id="emailId"
                  label="Email address"
                  required
                  error={errors.emailId?.message}
                >
                  <Input
                    id="emailId"
                    {...register('emailId')}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    icon={<Mail size={17} />}
                    error={errors.emailId}
                  />
                </FormField>

                <FormField
                  id="password"
                  label="Password"
                  required
                  error={errors.password?.message}
                >
                  <PasswordInput
                    id="password"
                    {...register('password')}
                    visible={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                    error={errors.password}
                    placeholder="Create a strong password"
                  />
                </FormField>

                <FormField
                  id="confirmPassword"
                  label="Confirm password"
                  required
                  error={errors.confirmPassword?.message}
                >
                  <PasswordInput
                    id="confirmPassword"
                    {...register('confirmPassword')}
                    visible={showConfirmPassword}
                    onToggle={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    error={errors.confirmPassword}
                    placeholder="Confirm your password"
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={isSubmitting || Boolean(successMessage)}
                  className="nc-submit"
                >
                  <span>
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                  </span>

                  {!isSubmitting && <ArrowRight size={18} aria-hidden="true" />}
                </button>
              </form>

              <div className="nc-form-footer">
                <p>
                  Already have an account?
                  <Link to="/login">Sign in</Link>
                </p>

                <div className="nc-security-note">
                  <ShieldCheck size={16} aria-hidden="true" />

                  <span>Your credentials are securely protected.</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

const Principle = ({ number, title, description }) => {
  return (
    <div className="nc-principle">
      <span className="nc-principle-number">{number}</span>

      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};

const FormField = ({ id, label, required, optional, error, children }) => {
  return (
    <div className="nc-field">
      <div className="nc-field-label-row">
        <label htmlFor={id}>{label}</label>

        {required && (
          <span className="nc-required" aria-hidden="true">
            *
          </span>
        )}

        {optional && <span className="nc-optional">optional</span>}
      </div>

      {children}

      {error && (
        <p className="nc-field-error" role="alert" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

const Input = ({ icon, error, ...props }) => {
  return (
    <div className={`nc-input-wrapper ${error ? 'nc-input-error' : ''}`}>
      <span className="nc-input-icon" aria-hidden="true">
        {icon}
      </span>

      <input {...props} className="nc-input" />
    </div>
  );
};

const PasswordInput = ({ visible, onToggle, error, ...props }) => {
  return (
    <div className={`nc-input-wrapper ${error ? 'nc-input-error' : ''}`}>
      <span className="nc-input-icon" aria-hidden="true">
        <LockKeyhole size={17} />
      </span>

      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className="nc-input nc-input-password"
        autoComplete="new-password"
      />

      <button
        type="button"
        onClick={onToggle}
        className="nc-password-toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? (
          <EyeOff size={18} aria-hidden="true" />
        ) : (
          <Eye size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

export default Signup;
