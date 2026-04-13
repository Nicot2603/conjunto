import { AdminLayout } from '../components/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSorteo } from '../contexts/SorteoContext';
import { useState } from 'react';

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { asignaciones, parqueaderos, residentes, obtenerNoAsignados } = useSorteo();

  if (user?.rol !== 'admin') {
    navigate('/login-admin');
    return null;
  }

  const stats = [
    { label: 'Residentes', value: residentes.length, icon: '👥', color: 'bg-blue-50 text-blue-600' },
    { label: 'Asignaciones', value: asignaciones.length, icon: '✅', color: 'bg-green-50 text-green-600' },
    { label: 'Cupos Carros', value: parqueaderos.filter(p => p.tipo === 'carro').length, icon: '🚗', color: 'bg-amber-50 text-amber-600' },
    { label: 'Cupos Motos', value: parqueaderos.filter(p => p.tipo === 'moto').length, icon: '🏍️', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Modular */}
        <div className="bg-white rounded-3xl p-8 border shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-gray-900">Panel Administrativo</h2>
            <p className="text-gray-500 font-medium mt-1">Bienvenido al centro de control del sistema de parqueaderos.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border shadow-sm transition-transform hover:scale-[1.02]">
              <div className={`w-10 h-10 rounded-2xl ${s.color} flex items-center justify-center text-xl mb-4 shadow-inner`}>
                {s.icon}
              </div>
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Listas de Espera Modular */}
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b bg-gray-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900">Sin parqueadero</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-tight mt-1">Residentes en lista de espera para el próximo sorteo</p>
            </div>
            <span className="px-3 py-1 bg-brand-c4/10 text-brand-c4 rounded-full text-[10px] font-black uppercase">
              Actualizado en tiempo real
            </span>
          </div>
          
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
            <div className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-c4 animate-pulse"></span>
                <div className="font-black text-brand-c4 uppercase tracking-widest text-xs">Lista Carros</div>
              </div>
              <div className="space-y-3">
                {obtenerNoAsignados('carro').length === 0 ? (
                  <div className="text-gray-400 text-sm font-medium italic py-4">No hay residentes pendientes.</div>
                ) : (
                  obtenerNoAsignados('carro').map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                      <div className="font-bold text-gray-700">{r.username}</div>
                      <div className="px-2 py-1 bg-white rounded-lg text-[10px] font-black text-gray-400 border">APT {r.apartamento}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-c5 animate-pulse"></span>
                <div className="font-black text-brand-c5 uppercase tracking-widest text-xs">Lista Motos</div>
              </div>
              <div className="space-y-3">
                {obtenerNoAsignados('moto').length === 0 ? (
                  <div className="text-gray-400 text-sm font-medium italic py-4">No hay residentes pendientes.</div>
                ) : (
                  obtenerNoAsignados('moto').map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                      <div className="font-bold text-gray-700">{r.username}</div>
                      <div className="px-2 py-1 bg-white rounded-lg text-[10px] font-black text-gray-400 border">APT {r.apartamento}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
