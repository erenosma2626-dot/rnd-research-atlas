import React, { useState } from 'react';
import { Eye, X, ZoomIn } from 'lucide-react';

export interface ImageGalleryItem {
  image_url: string;
  caption?: string;
  page?: number;
  figure_type?: string;
}

export const ImageGallerySection: React.FC<{ images: ImageGalleryItem[] }> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<ImageGalleryItem | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="p-4 text-xs text-black/50 dark:text-white/50 italic text-center font-mono">
        Makalede çıkarılabilir görsel veya şema bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((img, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedImage(img)}
            className="group relative rounded-2xl overflow-hidden bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/25 dark:hover:border-white/25 cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md"
          >
            {/* Image Preview */}
            <div className="h-48 w-full flex items-center justify-center p-3 bg-white/50 dark:bg-black/40 overflow-hidden">
              <img
                src={img.image_url}
                alt={img.caption || 'Makale Görseli'}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            {/* Caption & Metadata */}
            <div className="p-3 bg-white/80 dark:bg-[#141414]/80 backdrop-blur-xs border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2">
              <div className="truncate text-xs font-medium text-[#0A0A0A] dark:text-white font-sans">
                {img.caption || 'Görsel'}
              </div>
              {img.page && (
                <span className="flex-shrink-0 text-[10px] font-mono text-black/40 dark:text-white/40 px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                  S. {img.page}
                </span>
              )}
            </div>

            {/* Hover Icon Overlay */}
            <div className="absolute inset-0 bg-black/20 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <div className="p-2 rounded-full bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white shadow-md">
                <ZoomIn className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-[#141414] rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-[#0A0A0A] dark:text-white">
                <Eye className="w-4 h-4" />
                <span>{selectedImage.caption || 'Makale Görseli'}</span>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-black/60 dark:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Large Image View */}
            <div className="p-6 flex-1 flex items-center justify-center overflow-auto bg-black/[0.02] dark:bg-black/60">
              <img
                src={selectedImage.image_url}
                alt={selectedImage.caption || 'Makale Görseli'}
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-sm"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs text-black/50 dark:text-white/50 font-mono">
              <span>{selectedImage.figure_type ? `Tip: ${selectedImage.figure_type}` : 'Görsel'}</span>
              {selectedImage.page && <span>Sayfa {selectedImage.page}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
