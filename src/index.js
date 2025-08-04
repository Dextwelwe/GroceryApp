import './index.css';
import './App.css';
import './i18n';

import { AuthProvider } from './providers/AuthProvider';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
