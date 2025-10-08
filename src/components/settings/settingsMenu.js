import { useTranslation} from 'react-i18next';

export default function SettingsMenu({children, settingsHeaderItems}) {
    const {t} = useTranslation();

    return (
        <div className='settingsPopupWrapper' ref={settingsPopupRef}>
            <Header headerItems={settingsHeaderItems} title={t('ACTIONS')} isPopup={false} />
            {children}
        </div>
    )
}