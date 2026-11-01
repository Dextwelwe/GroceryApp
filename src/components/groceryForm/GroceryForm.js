import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import gf from './groceryForm.module.css';
import Popup from '../popup/Popup';
import { saveNew, updateGrocery } from '../../api/grocery';
import { getUserIdFromEmail, getEmailsFromIds } from '../../api/user';
import { validateInput } from '../../utils/itemUtils';

function toDateInputValue(date) {
  if (!date) return '';
  try {
    const value = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    if (isNaN(value.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  } catch (e) {
    return '';
  }
}

function fromDateInputValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  return new Date(year, parseInt(month, 10) - 1, day);
}

export default function GroceryForm({ grocery = null, ownerUid, currentUserEmail, isGuest, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEdit = Boolean(grocery);

  const [name, setName] = useState(grocery?.name || '');
  const [dateValue, setDateValue] = useState(() => toDateInputValue(grocery?.date));

  const [users, setUsers] = useState(() =>
    (grocery?.sharedWith || []).map((uid) => ({ uid, email: uid }))
  );
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const sharedWith = grocery?.sharedWith || [];
    if (!isEdit || sharedWith.length === 0) return;

    let cancelled = false;
    (async () => {
      const emails = await getEmailsFromIds(sharedWith);
      if (cancelled) return;
      setUsers(sharedWith.map((uid, index) => ({ uid, email: emails[index] || uid })));
    })();

    return () => { cancelled = true; };
  }, [grocery, isEdit]);

  async function addUser() {
    const value = userInput.trim();
    if (!value) return;
    if (isGuest) {
      setError(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'));
      return;
    }
    const lower = value.toLowerCase();
    if (users.some((user) => (user.email || '').toLowerCase() === lower)) return;
    if (currentUserEmail && lower === currentUserEmail.toLowerCase()) return;

    const uid = await getUserIdFromEmail(value);
    if (!uid) {
      setError(`${t('USER')} : '${value}' ${t('WARNINGS.NOT_FOUND')}`);
      return;
    }

    setUsers((prev) => [...prev, { uid, email: value }]);
    setUserInput('');
    setError('');
  }

  function removeUser(uid) {
    setUsers((prev) => prev.filter((user) => user.uid !== uid));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (isSaving) return;

    const trimmed = name.trim();
    if (!validateInput(trimmed)) {
      setNameError(true);
      setError(t('WARNINGS.INVALID_NAME'));
      return;
    }

    setNameError(false);
    setError('');
    setIsSaving(true);

    const payload = {
      name: trimmed,
      date: fromDateInputValue(dateValue),
      sharedWith: users.map((user) => user.uid),
      owner: ownerUid,
      type: users.length > 0 ? 'shared' : 'personal',
    };

    try {
      const result = isEdit
        ? await updateGrocery(grocery.id, { ...payload, previousSharedWith: grocery.sharedWith || [] })
        : await saveNew(payload);

      if (!result.success) {
        setError(result.error?.code === 'permission-denied'
          ? t('WARNINGS.NOT_PERMITTED_FOR_GUESTS')
          : t('WARNINGS.SERVER_ERROR'));
        return;
      }

      if (onSaved) await onSaved();
      if (onClose) onClose();
    } catch (e) {
      setError(t('WARNINGS.SERVER_ERROR'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Popup
      title={isEdit ? t('EDIT_GROCERY') : t('ADD_NEW_GROCERY')}
      close={onClose}
    >
      <form className='uiForm' onSubmit={handleSave} noValidate>
        <div className={gf.formSection}>
          <label className='uiFieldLabel' htmlFor='groceryName'>{t('NAME')}</label>
          <input
            id='groceryName'
            className={`uiField ${nameError ? 'uiFieldError' : ''}`}
            value={name}
            placeholder={t('NAME')}
            autoComplete='off'
            onChange={(e) => { setName(e.target.value); setNameError(false); }}
          />

          <label className='uiFieldLabel' htmlFor='groceryDate'>{t('DATE')}</label>
          <input
            id='groceryDate'
            className='uiField'
            type='date'
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            onKeyDown={(e) => e.preventDefault()}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
          />
        </div>

        <div className={gf.formSection}>
          <label className='uiFieldLabel' htmlFor='groceryUser'>{t('ADD_USERS')}</label>
          <div className={gf.userRow}>
            <input
              id='groceryUser'
              className='uiField'
              placeholder='user1234@mail.com'
              value={userInput}
              autoCapitalize='none'
              autoComplete='off'
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addUser();
                }
              }}
            />
            <button
              type='button'
              className='uiBtnAdd'
              onClick={addUser}
              aria-label={t('ADD_USERS')}
            >
              +
            </button>
          </div>

          {users.length > 0 &&
            <div className={gf.userChips}>
              {users.map((user) => (
                <span key={user.uid} className='uiChip'>
                  <span className='uiChipText'>{user.email}</span>
                  <button
                    type='button'
                    className='uiChipRemove'
                    onClick={() => removeUser(user.uid)}
                    aria-label={t('REMOVE_USER')}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          }
        </div>

        {error !== '' &&
          <p className='uiFormError' role='alert'>{error}</p>
        }

        <button type='submit' className='uiBtn uiBtnPrimary uiBtnSubmit' disabled={isSaving}>
          {t('SAVE')}
        </button>
      </form>
    </Popup>
  );
}
