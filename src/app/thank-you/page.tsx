export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-10 text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
        
        {/* Subtle Checkmark / Success Icon */}
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-emerald-50 mb-6 border border-emerald-100">
          <svg 
            className="w-8 h-8 text-emerald-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
          Gracias por compartir tu experiencia
        </h1>

        {/* Main Message */}
        <div className="mb-6 space-y-4 text-gray-600 text-sm sm:text-base leading-relaxed">
          <p>
            Lamentamos que tu experiencia no haya sido la esperada.
          </p>
          <p>
            Tu comentario fue enviado a nuestro equipo y será revisado lo antes posible.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 w-full my-6"></div>

        {/* Support message */}
        <div className="space-y-4 mt-6">
          <p className="text-gray-500 text-sm font-medium">
            Leemos cada comentario para mejorar la experiencia de nuestros huéspedes.
          </p>
          
          {/* Optional reassurance text */}
          <p className="text-gray-500 text-xs sm:text-sm bg-gray-50 rounded-lg p-4 italic border border-gray-100 shadow-sm">
            Si dejaste un comentario solicitando ayuda, alguien del hotel podría ponerse en contacto con vos para asistirte.
          </p>
        </div>

      </div>
    </div>
  );
}
