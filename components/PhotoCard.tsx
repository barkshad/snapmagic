
import React from 'react';
import type { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onDelete: (id: string) => void;
}

const DeleteIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const Spinner: React.FC = () => (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg z-10">
        <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="absolute inset-0 bg-red-900 bg-opacity-80 flex flex-col items-center justify-center text-center p-4 rounded-lg z-10">
        <p className="text-white font-semibold">Error</p>
        <p className="text-red-200 text-xs mt-1">{message}</p>
    </div>
);

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onDelete }) => {
  return (
    <div className="relative group aspect-square bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ease-in-out">
      {photo.status === 'processing' && <Spinner />}
      {photo.status === 'error' && <ErrorDisplay message="Processing failed" />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full transition-all duration-500 ease-in-out">
        <div className={`relative h-full w-full ${photo.editedUrl ? '' : 'md:col-span-2'}`}>
            <img src={photo.originalUrl} alt="Original" className="object-cover h-full w-full" />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">Before</div>
        </div>
        {photo.editedUrl && (
            <div className="relative h-full w-full animate-[fadeIn_0.5s_ease-in-out]">
                <img src={photo.editedUrl} alt="Edited" className="object-cover h-full w-full" />
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">After</div>
            </div>
        )}
      </div>

      <button
        onClick={() => onDelete(photo.id)}
        className="absolute top-2 right-2 z-20 p-1.5 bg-black bg-opacity-40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
        aria-label="Delete photo"
      >
        <DeleteIcon />
      </button>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
