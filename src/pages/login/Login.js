import './Login.css'

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next';
import handleConnection from "../../api/connectionFireBase"

export default function Login() {
    const { t, i18n } = useTranslation();
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loginMessage, setLoginMessage] = useState('');
    let passwordEl = useRef(null);
    let usernameEl = useRef(null);
    let languageEl = useRef(null);

    const changeLanguage = (lng) => i18n.changeLanguage(lng);

    const handlePassword = (event) => {
    setPassword(event.target.value);
    };

    const handleUsername = (event) => {
    setUsername(event.target.value);
    };

    const handleLanguage = (event) => {
      changeLanguage(event.target.value)
    }

     const guestLogin = async () => {
       const user = process.env.REACT_APP_GUEST_NAME;
       const pass = process.env.REACT_APP_GUEST_PASSWORD;
       let userID = await handleConnection(user,pass);
        if (userID===null){
          return setLoginMessage(t('WARNINGS.CONNECTION_ERROR'));
        }
    }

    async function handleSubmit(e){
      e.preventDefault();
      let canAuth = true;
      const border = '1px solid red';

      if (password.trim() === ""){
        passwordEl.current.style.border = border;
        canAuth = false;
      }
      if (username.trim() === ""){
        usernameEl.current.style.border = border;
        canAuth = false;
      }

      if (canAuth){
        let isAuth = await handleConnection(username,password);
        if (!isAuth){
        setLoginMessage(t('WARNINGS.CONNECTION_ERROR'));
      }
    }
    }
   
  return (
    <div className='loginRootWrapper'>
      <div className='loginContentWrapper'>
        <form className='loginFormWrapper'>
         <input ref={usernameEl} className='loginInput' onChange={handleUsername} id='username' placeholder={t('LOGIN.LOGIN_NAME')} value={username}></input>
         <input ref={passwordEl} className='loginInput' onChange={handlePassword} id='password' placeholder={t('LOGIN.LOGIN_PASSWORD')} type="password" autoComplete='password'></input>
         <div className='loginButtonWrapper'>
           <button className='loginButton' onClick={handleSubmit}>{t('LOGIN.SIGN_IN')}</button>
           <div className='loginSelectWrapper'>
             <select ref={languageEl} className='loginInput loginSelect' onChange={handleLanguage} defaultValue={"en"} >
               <option  className='loginInput' value="en">English</option>
               <option  className='loginInput' value="fr">Francais</option>
               <option  className='loginInput' value="ru">Русский</option>
             </select>
           </div>
         </div>
        </form>
        { loginMessage !== "" && <p className='loginMessage'>{loginMessage}</p> }
      </div>
      {/*eslint-disable-next-line jsx-a11y/anchor-is-valid  */}
      <a href="#" className='userTestButton' onClick={guestLogin}>{t('LOGIN.LOGIN_AS_GUEST')}</a>
    </div>
  ) 
}
