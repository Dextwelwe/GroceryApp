import { useTranslation } from 'react-i18next';
import Popup from '../popup/Popup';
import { ActionList } from '../actionList/ActionList';
import SettingsLanguageSelect from './SettingsLanguageSelect';

export default function SettingsMenu({ children, close }) {
  const { t } = useTranslation();

  return (
    <Popup title={t('ACTIONS')} close={close}>
      <ActionList>
        {children}
        <SettingsLanguageSelect />
      </ActionList>
    </Popup>
  );
}
