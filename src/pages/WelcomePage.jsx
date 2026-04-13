import { useNavigate } from "react-router-dom";

export function WelcomePage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login-usuario');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      
      {/* Fondo con imagen difuminada */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-brand-c4/90 mix-blend-multiply z-10"></div>
        <img
          src="/Conjunto.jpeg"
          alt="Fondo Conjunto"
          className="w-full h-full object-cover opacity-60 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-c4/80 via-brand-c4/95 to-gray-50 z-20"></div>
      </div>

      {/* Contenido principal */}
      <section className="relative z-30 max-w-7xl mx-auto px-6 sm:px-8 py-12 md:py-20 flex-1 flex flex-col justify-center w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white font-medium text-sm tracking-wide uppercase shadow-lg mx-auto lg:mx-0">
              <span className="w-2 h-2 rounded-full bg-brand-c5 animate-pulse"></span>
              Sorteo Virtual 2025
            </div>
            
            <div>
              <h2 className="text-2xl sm:text-3xl text-brand-c3 font-bold mb-2 drop-shadow-md">
                Conjunto Residencial
              </h2>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[1.1] drop-shadow-xl tracking-tight">
                Parques de <br className="hidden lg:block"/>Almazán
              </h1>
            </div>

            <p className="text-lg sm:text-xl lg:text-2xl text-white/90 font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Bienvenido a la plataforma oficial para la asignación de parqueaderos. Un proceso transparente, equitativo y en tiempo real.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <button
                onClick={handleLogin}
                className="group px-8 py-4 sm:px-10 sm:py-5 rounded-2xl bg-brand-c5 text-white font-bold text-lg shadow-xl shadow-brand-c5/30 hover:bg-brand-c5/90 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto"
              >
                Ingresar al Sistema
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              <a
                href="#info"
                className="px-8 py-4 sm:px-10 sm:py-5 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 font-semibold shadow-lg hover:bg-white/20 transition-all duration-300 text-center w-full sm:w-auto"
              >
                ¿Cómo funciona?
              </a>
            </div>
          </div>

          <div className="relative order-1 lg:order-2 px-4 sm:px-12 lg:px-0">
            {/* Elementos decorativos de fondo */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-c5/40 to-brand-c3/40 rounded-[3rem] blur-2xl z-0"></div>
            
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white/10 transform transition-transform duration-700 hover:scale-[1.02]">
              <img
                src="/Conjunto.jpeg"
                alt="Conjunto Residencial Parques de Almazán"
                className="w-full h-[300px] sm:h-[450px] lg:h-[600px] object-cover"
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'%3E%3Crect width='1200' height='600' fill='%23d9ceb2'/%3E%3Ctext x='50%' y='50%' text-anchor='middle' font-family='Arial' font-size='40' fill='%237a6a53'%3EParques de Almaz%C3%A1n%3C/text%3E%3C/svg%3E";
                }}
              />
              
              {/* Tarjeta flotante superpuesta */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-xl border border-white flex items-center gap-4 transform translate-y-2 opacity-0 animate-[slideUp_0.5s_ease-out_1s_forwards]">
                <div className="bg-brand-c4 text-white p-3 rounded-xl shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base">Plataforma Segura</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Asignación 100% transparente garantizada.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Sección de características inferior */}
      <section id="info" className="relative z-30 max-w-7xl mx-auto px-6 sm:px-8 pb-20 w-full">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 transform transition-all duration-300 hover:-translate-y-2 group">
            <div className="w-14 h-14 rounded-2xl bg-brand-c3/30 text-brand-c4 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Transparencia Total</h3>
            <p className="text-gray-600 leading-relaxed">Proceso visible para todos los residentes. Visualiza en tiempo real qué parqueaderos están disponibles y cuáles han sido asignados.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 transform transition-all duration-300 hover:-translate-y-2 group">
            <div className="w-14 h-14 rounded-2xl bg-brand-c5/10 text-brand-c5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">En Tiempo Real</h3>
            <p className="text-gray-600 leading-relaxed">Selecciona tu espacio al instante desde un mapa interactivo. Los cambios se reflejan inmediatamente en todo el sistema.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 transform transition-all duration-300 hover:-translate-y-2 group">
            <div className="w-14 h-14 rounded-2xl bg-brand-c4/10 text-brand-c4 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Acceso desde cualquier lugar</h3>
            <p className="text-gray-600 leading-relaxed">Participa en el sorteo cómodamente desde tu teléfono móvil, tablet o computador sin complicaciones técnicas.</p>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
