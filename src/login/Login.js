import React, {useState, useRef} from 'react'
import handleConnection from "./connectionFireBase"
import './Login.css'

export default function Login({isConnected}) {
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loginMessage, setLoginMessage] = useState('');
    let passwordEl = useRef(null);
    let usernameEl = useRef(null);
    const modal = useRef('');
    const text = useRef('');
    

    const handlePassword = (event) => {
    setPassword(event.target.value);
    };

    const handleUsername = (event) => {
    setUsername(event.target.value);
    };

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
      let isAuth = await handleConnection(username,password)
      if (isAuth){
        isConnected();
      } else { 
        setLoginMessage("Ошибка подключения");
      }
    }
    }
   
  return (
    <div ref={modal} className='LoginPopupRoot'>
        <div ref={text} className='loginModalContent'>
        <form className='loginInputWrapper'>
      <input ref={usernameEl} className='loginInput'  onChange={handleUsername} id='username' placeholder='Имя пользователя'></input>
      <input ref={passwordEl} type="password" className='loginInput' autoComplete='password' onChange={handlePassword} id='password' placeholder='Пароль'></input>
      <button className='buttonSubmitLogin' onClick={handleSubmit}>Вход</button>
        </form>
      {
        loginMessage !== "" && <p className='loginMessage'>{loginMessage}</p>
      }
      </div>
    </div>
  )
}
