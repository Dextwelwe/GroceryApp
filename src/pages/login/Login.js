import {useState, useRef} from 'react'
import handleConnection from "../../api/connectionFireBase"
import './Login.css'
import { useTranslation } from 'react-i18next';

export default function Login({connect}) {
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loginMessage, setLoginMessage] = useState('');
    let passwordEl = useRef(null);
    let usernameEl = useRef(null);
    let languageEl = useRef(null);
    const { t, i18n } = useTranslation();

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
          return setLoginMessage(t('CONNECTION_ERROR'));
        }
    }

    async function handleSubmit(e){
      e.preventDefault();
      let canAuth = true;

      if (password.trim() === ""){
        passwordEl.current.style.border = '1px solid red'
        canAuth = false;
      }
      if (username.trim() === ""){
        usernameEl.current.style.border = '1px solid red'
        canAuth = false;
      }

      if (canAuth){
        let isAuth = await handleConnection(username,password);
        if (!isAuth){
        setLoginMessage(t('CONNECTION_ERROR'));
      }
    }
    }
   
  return (
    <div className='loginRootWrapper'>
        <div className='loginContentWrapper'>
        <form className='loginFormWrapper'>
       
        <input ref={usernameEl} className='loginInput' onChange={handleUsername} id='username' placeholder={t('LOGIN_NAME')} value={username}></input>
        <input ref={passwordEl} className='loginInput' onChange={handlePassword} id='password' placeholder={t('LOGIN_PASSWORD')} type="password" autoComplete='password'></input>
        <div className='loginButtonWrapper'>
        <button className='loginButton' onClick={handleSubmit}>{t('SIGN_IN')}</button>
        <div className='loginSelectWrapper'>
        <select ref={languageEl} className='loginInput loginSelect' onChange={handleLanguage} defaultValue={"en"} >
          <option  className='loginInput' value="en">English</option>
          <option  className='loginInput' value="fr">Francais</option>
          <option  className='loginInput' value="ru">Русский</option>
        </select>
        </div>
        </div>
        </form>
      {
        loginMessage !== "" && <p className='loginMessage'>{loginMessage}</p>
      }
      </div>
      <a className='userTestButton' onClick={guestLogin}>{t('LOGIN_AS_GUEST')}</a>
      </div>
  )
}
