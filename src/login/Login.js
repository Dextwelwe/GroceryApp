import React, {useState, useRef} from 'react'
import handleConnection from "./connectionFireBase"
import './Login.css'

export default function Login({connect}) {
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loginMessage, setLoginMessage] = useState('');
    let passwordEl = useRef(null);
    let usernameEl = useRef(null);

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
        let isAuth = await handleConnection(username,password);
        if (isAuth){
        connect();
      } else { 
        setLoginMessage("Ошибка подключения");
      }
    }
    }
   
  return (
      <div className='loginContentWrapper'>
        <form className='loginFormWrapper'>
        <input ref={usernameEl} className='loginInput' onChange={handleUsername} id='username' placeholder='Имя пользователя' value={username}></input>
        <input ref={passwordEl} className='loginInput' onChange={handlePassword} id='password' placeholder='Пароль' type="password" autoComplete='password'></input>
        <button className='loginButton' onClick={handleSubmit}>Вход</button>
        </form>
      {
        loginMessage !== "" && <p className='loginMessage'>{loginMessage}</p>
      }
      </div>
  )
}
