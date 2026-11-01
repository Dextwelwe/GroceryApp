import l from './login.module.css';

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
import handleConnection from "../../api/connectionFireBase"
import useLocalStorage from '../../hooks/useLocalStorage';
import langIcon from '../../assets/images/icons/lang.svg'
import { appBackgroundVars } from '../../utils/appBackground'

function EyeIcon({ crossed }) {
  return (
    <svg
      className={l.eyeIcon}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z' />
      <circle cx='12' cy='12' r='3' />
      {crossed && <path d='M1 1l22 22' />}
    </svg>
  )
}

export default function Login() {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useLocalStorage('dexGroceryLoginUsername', '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const passwordEl = useRef(null);

  const hasRememberedUser = (username || '').trim() !== '';
  const currentLanguage = (i18n.language || 'en').split('-')[0];
  const isBusy = isSubmitting || isGuestSubmitting;

  useEffect(() => {
    if (hasRememberedUser) passwordEl.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLanguage = (event) => {
    const lang = event.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  }

  const handleUsername = (event) => {
    setUsername(event.target.value);
    setLoginMessage('');
    if (errors.username) setErrors((prev) => ({ ...prev, username: false }));
  };

  const handlePassword = (event) => {
    setPassword(event.target.value);
    setLoginMessage('');
    if (errors.password) setErrors((prev) => ({ ...prev, password: false }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (isBusy) return;

    setLoginMessage('');
    const nextErrors = {
      username: username.trim() === '',
      password: password.trim() === '',
    };
    setErrors(nextErrors);

    if (nextErrors.username || nextErrors.password) {
      setLoginMessage(t('LOGIN.MISSING_FIELDS'));
      return;
    }

    setIsSubmitting(true);
    try {
      const userID = await handleConnection(username.trim(), password);
      if (!userID) setLoginMessage(t('WARNINGS.CONNECTION_ERROR'));
    } catch (e) {
      setLoginMessage(t('WARNINGS.CONNECTION_ERROR'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function guestLogin() {
    if (isBusy) return;

    setLoginMessage('');
    setErrors({});

    const guestUser = process.env.REACT_APP_GUEST_NAME;
    const guestPassword = process.env.REACT_APP_GUEST_PASSWORD;
    if (!guestUser || !guestPassword) {
      setLoginMessage(t('WARNINGS.CONNECTION_ERROR'));
      return;
    }

    setIsGuestSubmitting(true);
    try {
      const userID = await handleConnection(guestUser, guestPassword);
      if (!userID) setLoginMessage(t('WARNINGS.CONNECTION_ERROR'));
    } catch (e) {
      setLoginMessage(t('WARNINGS.CONNECTION_ERROR'));
    } finally {
      setIsGuestSubmitting(false);
    }
  }

  return (
    <div className={l.page} style={appBackgroundVars}>
      <div className={l.languageBar}>
        <div className={l.languagePill}>
          <img src={langIcon} alt='' className={l.languageIcon} />
          <select
            className={l.languageSelect}
            onChange={handleLanguage}
            value={currentLanguage}
            aria-label={t('LANGUAGE')}
          >
            <option value='en'>English</option>
            <option value='fr'>Français</option>
            <option value='ru'>Русский</option>
          </select>
          <span className={l.languageChevron} aria-hidden='true'>▾</span>
        </div>
      </div>

      <div className={l.card}>
        <h1 className={l.title}>{t('MY_GROCERIES')}</h1>

        <form className={l.form} onSubmit={handleSubmit} noValidate>
          <div className={l.field}>
            <label className='uiFieldLabel' htmlFor='username'>{t('LOGIN.LOGIN_NAME')}</label>
            <input
              id='username'
              name='username'
              className={`uiField ${errors.username ? 'uiFieldError' : ''}`}
              type='text'
              autoComplete='username'
              autoCapitalize='none'
              enterKeyHint='next'
              aria-invalid={errors.username ? 'true' : 'false'}
              onChange={handleUsername}
              value={username}
            />
          </div>

          <div className={l.field}>
            <label className='uiFieldLabel' htmlFor='password'>{t('LOGIN.LOGIN_PASSWORD')}</label>
            <div className={l.passwordWrapper}>
              <input
                id='password'
                name='password'
                ref={passwordEl}
                className={`uiField ${errors.password ? 'uiFieldError' : ''}`}
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                enterKeyHint='go'
                aria-invalid={errors.password ? 'true' : 'false'}
                onChange={handlePassword}
                value={password}
              />
              <button
                type='button'
                className={l.eyeButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-pressed={showPassword}
                aria-label={t(showPassword ? 'LOGIN.HIDE_PASSWORD' : 'LOGIN.SHOW_PASSWORD')}
              >
                <EyeIcon crossed={showPassword} />
              </button>
            </div>
          </div>

          {loginMessage !== '' &&
            <p className={l.banner} role='alert'>{loginMessage}</p>
          }

          <button type='submit' className='uiBtn uiBtnPrimary' disabled={isBusy}>
            {isSubmitting && <span className={l.spinner} aria-hidden='true' />}
            {isSubmitting ? t('LOGIN.SIGNING_IN') : t('LOGIN.SIGN_IN')}
          </button>
        </form>

        <button type='button' className={l.guestLink} onClick={guestLogin} disabled={isBusy}>
          {isGuestSubmitting && <span className={`${l.spinner} ${l.spinnerSage}`} aria-hidden='true' />}
          {t('LOGIN.LOGIN_AS_GUEST')}
        </button>
      </div>
    </div>
  )
}
