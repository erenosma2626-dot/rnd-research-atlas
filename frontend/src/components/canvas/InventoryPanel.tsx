import React, { useEffect, useState } from 'react';
import { getProjectInventory, InventoryItem } from '../../api/client';
import { InventoryItemCard } from './InventoryItemCard';

interface InventoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeCanvasId: string;
  onAddDocumentToCanvas: (doc: { id: string; original_filename: string; processing_status: string }) => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  isOpen,
  onClose,
  activeCanvasId,
  onAddDocumentToCanvas,
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await getProjectInventory();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter((it) =>
    it.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 sm:w-96 bg-bg-light/95 dark:bg-bg-dark/95 backdrop-blur-md border-l border-card-border-light dark:border-card-border-dark shadow-2xl flex flex-col transition-all duration-200">
      {/* Header */}
      <div className="p-5 border-b border-card-border-light dark:border-card-border-dark flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-accent flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
              Doküman Envanteri
            </h3>
            <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
              Projedeki tüm makaleler ({items.length})
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-secondary-light hover:bg-card-bg-light dark:hover:bg-card-bg-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-card-border-light/60 dark:border-card-border-dark/60">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Makale adı ile filtrele..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Hint */}
      <div className="px-4 py-2 bg-blue-50/50 dark:bg-blue-950/20 text-[11px] text-text-secondary-light border-b border-card-border-light/40 dark:border-card-border-dark/40 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Kartları doğrudan canvas üzerine sürükleyip bırakabilirsiniz.</span>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {loading ? (
          <div className="p-8 text-center text-xs text-text-secondary-light animate-pulse">
            Envanter yükleniyor...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-secondary-light">
            Eşleşen doküman bulunamadı.
          </div>
        ) : (
          filteredItems.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              activeCanvasId={activeCanvasId}
              onAddDirectly={(doc) => {
                onAddDocumentToCanvas({
                  id: doc.id,
                  original_filename: doc.original_filename,
                  processing_status: doc.processing_status,
                });
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
