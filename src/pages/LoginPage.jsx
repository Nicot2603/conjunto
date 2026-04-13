import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const ingresarComo = (rol) => {
    const success = login({
      usuario: rol === 'admin' ? 'Administrador' : usuario,
      password: rol === 'admin' ? 'admin' : password,
      rol,
    });
    if (success) {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen app-bg">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-6">
          <button onClick={() => navigate('/')} className="text-sm font-semibold text-gray-700">
            Volver
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-brand-c4 text-white rounded-2xl p-8">
            <h1 className="text-2xl font-bold">Conjunto Residencial</h1>
            <h2 className="text-3xl font-black mt-1">Parques de Almazán</h2>
            <div className="mt-6 space-y-2 text-sm">
              <p>• Proceso de sorteo claro y equitativo</p>
              <p>• Ingreso sin datos reales (prototipo)</p>
              <p>• Carros y Motos según configuración del administrador</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border">
            <h3 className="text-xl font-bold text-gray-900">Ingresar</h3>
            <p className="text-sm text-gray-600 mb-6">Selecciona el perfil para continuar</p>

            <div className="space-y-4">
              <a href="/login-usuario" className="block border-2 border-brand-c4 rounded-lg p-5">
                <div className="font-bold">Login Usuario</div>
                <div className="text-sm text-gray-600">Accede con tu usuario y contraseña.</div>
              </a>

              <a href="/login-admin" className="block border-2 border-brand-c5 rounded-lg p-5">
                <div className="font-bold">Login Administrador</div>
                <div className="text-sm text-gray-600">Accede con usuario y contraseña de admin.</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
