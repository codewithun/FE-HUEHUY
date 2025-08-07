import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useState } from 'react';

export default function FloatingCommunityButton() {
  const [hasNewActivity, setHasNewActivity] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {isVisible && (
        <div className="fixed bottom-24 right-4 z-50">
          <Link href="/app/komunitas/komunitas">
            <div 
              className="relative group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Subtle Ring Effect */}
              <div className="absolute inset-0 rounded-full bg-primary opacity-20 scale-110 group-hover:scale-125 transition-transform duration-300"></div>
              
              {/* Main Button - Sesuai dengan primary color */}
              <div className="relative bg-primary text-white p-4 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-white">
                <FontAwesomeIcon icon={faUsers} className="text-xl" />
              </div>
              
              {/* Badge Notifikasi - Subtle animation */}
              {hasNewActivity && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30"></div>
                  <span className="relative z-10">3</span>
                </div>
              )}
              
              {/* Label Text - Muncul on hover */}
              <div className={`absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              }`}>
                Komunitas Baru!
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-4 border-transparent border-l-gray-900"></div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </>
  );
}