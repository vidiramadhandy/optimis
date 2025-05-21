import { useContext } from 'react';
import AuthContext from './AuthContext';

// Hook untuk mengakses context Auth
const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;
