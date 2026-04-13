import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (credentials) => {
    if (credentials.rol === 'usuario') {
      if (!(credentials.usuario && credentials.password)) return false;
      let residente;
      try {
        residente = await api.loginUser({ usuario: credentials.usuario, password: credentials.password });
      } catch {
        return false;
      }
      if (!residente?.username) return false;

      const userData = {
        username: residente.username,
        tipo: residente.tipoVehiculo || residente.tipo || 'ambos',
        rol: 'usuario',
        aprobado: true,
        prioridad: residente.prioridad || 'ninguna'
      };
      setUser(userData);
      setIsAuthenticated(true);
      // Usar sessionStorage en lugar de localStorage para permitir múltiples sesiones en la misma máquina (distintas pestañas/ventanas)
      sessionStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    if (credentials.rol === 'admin') {
      if (!(credentials.usuario && credentials.password)) {
        return false;
      }
      try {
        await api.loginAdmin({ usuario: credentials.usuario, password: credentials.password });
      } catch {
        return false;
      }
      const userData = {
        username: credentials.usuario,
        tipo: credentials.tipo ?? null,
        rol: 'admin',
        aprobado: true
      };
      setUser(userData);
      setIsAuthenticated(true);
      sessionStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('user');
  };

  // Verificar si hay usuario en sessionStorage al cargar
  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
