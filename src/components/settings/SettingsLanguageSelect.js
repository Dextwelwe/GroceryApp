import { useTranslation } from 'react-i18next';
import iconLanguage from '../../assets/images/icons/lang.svg';

export default function SettingsLanguageSelect({ name = 'settingsSelect' }) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className='settingsLanguageWrapper'>
      <div className='SettingItemWrapper'>
        <img src={iconLanguage} alt='Language Icon' className='settingsIcon' />
        <span className='settingsItem'>{t('LANGUAGE')}</span>
      </div>
      <select name={name} className='settingsSelect' value={i18n.language} onChange={handleLanguageChange}>
        <option value='en'>English</option>
        <option value='fr'>Français</option>
        <option value='ru'>Русский</option>
      </select>
    </div>
  );
}