import { useState } from 'react';

type StarRatingProps = {
  rating: number;
  onRatingChange: (rating: number) => void;
};

export default function StarRating({ rating, onRatingChange }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex justify-center space-x-2 my-6">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoverRating || rating);
        
        return (
          <button
            key={star}
            type="button"
            className={`w-12 h-12 md:w-16 md:h-16 transition-colors duration-200 focus:outline-none touch-manipulation flex items-center justify-center rounded-full ${isActive ? 'text-yellow-400 hover:bg-yellow-50' : 'text-gray-300 hover:bg-gray-50'}`}
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${star} stars out of 5`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-10 h-10 md:w-14 md:h-14 transition-transform duration-200 transform hover:scale-110 active:scale-95"
            >
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
