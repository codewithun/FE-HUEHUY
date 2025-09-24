// Helper to crop and scale image using canvas
export async function getCroppedImg(imageSrc, crop) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    image.onload = () => {
      const maxSize = 1200;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;
      const cropWidth = crop.width * scaleX;
      const cropHeight = crop.height * scaleY;
      let outputWidth = cropWidth;
      let outputHeight = cropHeight;
      if (Math.max(cropWidth, cropHeight) > maxSize) {
        const ratio = maxSize / Math.max(cropWidth, cropHeight);
        outputWidth = Math.round(cropWidth * ratio);
        outputHeight = Math.round(cropHeight * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.92);
    };
    image.onerror = reject;
  });
}
