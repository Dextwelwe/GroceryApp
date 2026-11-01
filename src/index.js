import './index.css';
import './assets/fonts/Nunito/nunito.css';
import './App.css';
import './styles/ui.css';
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
