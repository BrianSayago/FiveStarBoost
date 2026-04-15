import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dejar reseña - Hotel SaaS',
  description: 'Compartí tu experiencia en Google',
};

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ReviewRedirectPage({ searchParams }: PageProps) {
  const urlParam = searchParams?.url;
  const reviewUrl = Array.isArray(urlParam) ? urlParam[0] : urlParam;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-10 text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
        
        {/* Top Icon */}
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-amber-50 mb-6 border border-amber-100">
          <svg 
            className="w-8 h-8 text-amber-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
          ¡Nos alegra que hayas tenido una gran experiencia!
        </h1>

        {/* Main Message */}
        <div className="mb-6 space-y-4 text-gray-600 text-sm sm:text-base leading-relaxed">
          <p>
            Tu opinión ayuda a otros huéspedes a elegir mejor su estadía.
          </p>
          <p>
            Si tenés un momento, nos ayudaría mucho que compartas tu experiencia en Google.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 w-full my-6"></div>

        {/* Action Area */}
        <div className="mt-6 flex flex-col items-center">
          {reviewUrl ? (
            <>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex justify-center items-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Dejar reseña en Google
              </a>
              <p className="mt-5 text-xs sm:text-sm text-gray-500">
                Gracias por ayudarnos a mejorar la experiencia de nuestros huéspedes.
              </p>
            </>
          ) : (
            <div className="w-full p-4 bg-gray-50 text-gray-600 rounded-xl border border-gray-200 text-sm font-medium">
              No pudimos encontrar el enlace de reseñas.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
