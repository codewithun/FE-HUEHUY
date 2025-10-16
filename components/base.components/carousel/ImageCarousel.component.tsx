/* eslint-disable no-console */
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './ImageCarousel.module.css';

interface ImageCarouselProps {
  images: string[];
  title?: string;
  className?: string;
  onImageClick?: (index: number) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images = [],
  title = '',
  className = '',
  onImageClick
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  // Pastikan ada gambar untuk ditampilkan
  const displayImages = useMemo(() => {
    if (!images || !Array.isArray(images)) {
      return ['/default-avatar.png'];
    }
    const validImages = images.length > 0 ? images : ['/default-avatar.png'];
    
    // Debug log
    console.log('🎠 ImageCarousel displayImages:', {
      inputImages: images,
      validImages: validImages,
      count: validImages.length
    });
    
    return validImages;
  }, [images]);

  // Clear auto slide when component unmounts or images change
  useEffect(() => {
    return () => {
      if (autoSlideRef.current) {
        clearTimeout(autoSlideRef.current);
      }
    };
  }, []);

  // Reset currentIndex if it's out of bounds when images change
  useEffect(() => {
    if (currentIndex >= displayImages.length) {
      setCurrentIndex(0);
    }
  }, [displayImages.length, currentIndex]);

  const nextSlide = useCallback(() => {
    if (isTransitioning || displayImages.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    
    // Reset transition flag after animation completes
    setTimeout(() => setIsTransitioning(false), 300);
  }, [displayImages.length, isTransitioning]);

  const prevSlide = useCallback(() => {
    if (isTransitioning || displayImages.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    
    // Reset transition flag after animation completes
    setTimeout(() => setIsTransitioning(false), 300);
  }, [displayImages.length, isTransitioning]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex || displayImages.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    // Reset transition flag after animation completes
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, displayImages.length, isTransitioning]);

  // Clear auto slide when user interacts
  const clearAutoSlide = useCallback(() => {
    if (autoSlideRef.current) {
      clearTimeout(autoSlideRef.current);
      autoSlideRef.current = null;
    }
  }, []);

  // Mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (displayImages.length <= 1 || isTransitioning) return;
    
    e.preventDefault();
    clearAutoSlide();
    setIsDragging(true);
    setStartX(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || displayImages.length <= 1 || isTransitioning) return;
    
    e.preventDefault();
    const currentX = e.clientX;
    const diffX = currentX - startX;
    setDragOffset(diffX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || displayImages.length <= 1) return;
    
    const diffX = e.clientX - startX;
    const threshold = 50; // Increased threshold for better UX
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    
    setIsDragging(false);
    setStartX(0);
    setDragOffset(0);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (displayImages.length <= 1 || isTransitioning) return;
    
    clearAutoSlide();
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || displayImages.length <= 1 || isTransitioning) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    setDragOffset(diffX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || displayImages.length <= 1) return;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - startX;
    const threshold = 50; // Consistent threshold
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    
    setIsDragging(false);
    setStartX(0);
    setDragOffset(0);
  };

  const handleImageClick = (index: number) => {
    // Prevent click during drag or transition
    if (isDragging || isTransitioning || Math.abs(dragOffset) > 10) return;
    
    if (onImageClick) {
      onImageClick(index);
    } else {
      setShowFullscreen(true);
    }
  };

  // Calculate transform dengan drag offset
  const getTransform = () => {
    // Setiap slide mengambil (100 / jumlah_gambar)% dari track
    // Jadi untuk pindah ke slide berikutnya, kita perlu shift sebesar itu
    const slideWidth = 100 / displayImages.length; // Dalam persen
    const baseTransform = -currentIndex * slideWidth;
    
    // Debug log
    console.log('🎠 Transform calculation:', {
      currentIndex,
      displayImagesLength: displayImages.length,
      slideWidth,
      baseTransform,
      isDragging,
      dragOffset
    });
    
    if (isDragging && dragOffset !== 0) {
      const containerWidth = containerRef.current?.offsetWidth || 300;
      const dragPercent = (dragOffset / containerWidth) * slideWidth; // Scale drag to slide width
      const finalTransform = baseTransform + dragPercent;
      console.log('🎠 Drag transform:', { containerWidth, dragPercent, finalTransform });
      return `translateX(${finalTransform}%)`;
    }
    return `translateX(${baseTransform}%)`;
  };

  return (
    <>
      <div className={`${styles.imageCarousel} ${className}`}>
        {/* Main carousel container dengan aspect ratio 1:1 */}
        <div className={`${styles.carouselContainer} bg-white rounded-[20px] shadow-lg border border-slate-100`}>
          {/* Image container */}
          <div
            ref={containerRef}
            className={`${styles.carouselDraggable} ${isDragging ? styles.carouselDragging : ''} relative w-full h-full overflow-hidden select-none`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              ref={trackRef}
              className={styles.carouselTrack}
              style={{
                transform: getTransform(),
                width: `${displayImages.length * 100}%`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
              }}
            >
              {displayImages.map((image, index) => (
                <div
                  key={index}
                  className={styles.carouselSlide}
                  style={{ 
                    width: `${100 / displayImages.length}%` // Setiap slide = lebar container / jumlah slides
                  }}
                >
                  <Image
                    src={image}
                    alt={`${title} - Image ${index + 1}`}
                    className={styles.carouselImage}
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SU1BR0U8L3RleHQ+PC9zdmc+"
                    priority={index === 0}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                    onClick={() => handleImageClick(index)}
                  />
                  
                  {/* Expand icon overlay */}
                  <button
                    onClick={() => handleImageClick(index)}
                    className={styles.carouselExpand}
                    aria-label="Expand image"
                  >
                    <span className="text-xs">⛶</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows - hanya muncul jika lebih dari 1 gambar */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className={`${styles.carouselNav} ${styles.prev}`}
                disabled={isDragging || isTransitioning}
                aria-label="Previous image"
              >
                <span className="text-sm">‹</span>
              </button>
              
              <button
                onClick={nextSlide}
                className={`${styles.carouselNav} ${styles.next}`}
                disabled={isDragging || isTransitioning}
                aria-label="Next image"
              >
                <span className="text-sm">›</span>
              </button>
            </>
          )}

          {/* Image counter */}
          {displayImages.length > 1 && (
            <div className={styles.carouselCounter}>
              {currentIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>

        {/* Dots indicator - hanya muncul jika lebih dari 1 gambar */}
        {displayImages.length > 1 && (
          <div className={styles.carouselDots}>
            {displayImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                className={`${styles.carouselDot} ${index === currentIndex ? styles.active : ''}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {showFullscreen && (
        <div className={`${styles.carouselFullscreen} ${styles.carouselFadeIn}`}>
          <div className={styles.fullscreenContainer}>
            {/* Close button */}
            <button
              onClick={() => setShowFullscreen(false)}
              className={styles.fullscreenClose}
              aria-label="Close fullscreen"
            >
              ✕
            </button>
            
            {/* Fullscreen image */}
            <div className="relative w-full h-full">
              <Image
                src={displayImages[currentIndex]}
                alt={`${title} - Fullscreen`}
                className={styles.fullscreenImage}
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>

            {/* Fullscreen navigation */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  disabled={isTransitioning}
                  className={`${styles.fullscreenNav} ${styles.prev}`}
                  aria-label="Previous image"
                >
                  <span className="text-lg">‹</span>
                </button>
                
                <button
                  onClick={nextSlide}
                  disabled={isTransitioning}
                  className={`${styles.fullscreenNav} ${styles.next}`}
                  aria-label="Next image"
                >
                  <span className="text-lg">›</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageCarousel;