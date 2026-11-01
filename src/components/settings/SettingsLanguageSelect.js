import { useTranslation } from 'react-i18next';
import iconLanguage from '../../assets/images/icons/lang.svg';
import s from './settingsLanguageSelect.module.css';

export default function SettingsLanguageSelect() {
  const { t, i18n } = useTranslation();
  const currentLanguage = (i18n.language || 'en').split('-')[0];

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  return (
    <div className={s.row}>
      <span className={s.tile} aria-hidden='true'>
        <img src={iconLanguage} alt='' className={s.icon} />
      </span>
      <label className={s.label} htmlFor='settingsLanguage'>{t('LANGUAGE')}</label>
      <select
        id='settingsLanguage'
        className={s.select}
        value={currentLanguage}
        onChange={handleLanguageChange}
      >
        <option value='en'>English</option>
        <option value='fr'>Français</option>
        <option value='ru'>Русский</option>
      </select>
    </div>
  );
}
