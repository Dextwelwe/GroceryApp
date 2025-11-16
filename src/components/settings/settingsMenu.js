import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../header/header';
import closeIcon from '../../assets/images/icons/close.svg'

const SettingsMenu = forwardRef(function SettingsMenu({ children, close }, ref) {
    const { t } = useTranslation();
    const settingsHeaderItems =  [{src : closeIcon, alt : "close", clickaction : close}]

    return (
        <div className='settingContainer'>
            <div className='settingsPopupWrapper' ref={ref}>
                <Header headerItems={settingsHeaderItems} title={t('ACTIONS')} isPopup={true} />
                {children}
            </div>
        </div>
    );
});

export default SettingsMenu;
