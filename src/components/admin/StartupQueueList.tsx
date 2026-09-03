'use client';

import React, { useState, useEffect } from 'react';
import { Startup } from '@/lib/supabase/types';
import { reorderStartupsAction } from '@/lib/auction/actions';
import {
  Search,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface StartupQueueListProps {
  startups: Startup[];
  activeStartupId?: string | null;
  onSelectStartup: (startup: Startup) => void;
  onReordered?: () => void;
}

export function StartupQueueList({
  startups,
  activeStartupId,
  onSelectStartup,
  onReordered,
}: StartupQueueListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<Startup[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Synchronize local items when prop updates
  useEffect(() => {
    const sorted = [...startups].sort((a, b) => a.display_order - b.display_order);
    setItems(sorted);
  }, [startups]);

  // Execute persistence to server
  const persistOrder = async (newOrder: Startup[]) => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const orderedIds = newOrder.map((s) => s.id);
      const res = await reorderStartupsAction(orderedIds);
      if (res.success) {
        setSaveStatus('Queue updated');
        setTimeout(() => setSaveStatus(null), 2500);
        if (onReordered) onReordered();
      } else {
        setSaveStatus(`Failed: ${res.error}`);
      }
    } catch (e: any) {
      setSaveStatus(`Error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (searchTerm.trim()) return; // Disable reordering while search filter is active
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const updated = [...items];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, removed);

    // Re-index display_order locally
    const reindexed = updated.map((s, idx) => ({ ...s, display_order: idx + 1 }));
    setItems(reindexed);
    handleDragEnd();

    await persistOrder(reindexed);
  };

  // Move up/down single step
  const moveItem = async (fromIndex: number, toIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (toIndex < 0 || toIndex >= items.length || isSaving) return;

    const updated = [...items];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);

    const reindexed = updated.map((s, idx) => ({ ...s, display_order: idx + 1 }));
    setItems(reindexed);

    await persistOrder(reindexed);
  };

  const filtered = items.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isFilterActive = searchTerm.trim().length > 0;

  return (
    <div className="rounded-xl p-5 sm:p-6 bg-[#eff4f0] border border-[#cad7cc] flex flex-col h-full max-h-[660px] shadow-sm transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#cad7cc] mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#203126] flex items-center gap-2">
            <span>Startup Queue</span>
            {isSaving && (
              <span className="flex items-center gap-1 text-[11px] text-[#1a5c3e] font-normal">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus && !isSaving && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-normal">
                <Check className="w-3 h-3" />
                {saveStatus}
              </span>
            )}
          </h3>
          <p className="text-xs text-[#56695e]">
            {items.length} Scheduled Venture Lots · Drag to reorder
          </p>
        </div>
        <span className="text-xs font-mono text-[#56695e]">
          {filtered.length} visible
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#56695e]" />
        <input
          type="text"
          placeholder="Filter by startup or sector..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#e5ece6] border border-[#cad7cc] text-xs text-[#203126] placeholder:text-[#56695e] focus:outline-none focus:border-[#1a5c3e] focus:ring-1 focus:ring-[#1a5c3e]"
        />
      </div>

      {isFilterActive && (
        <div className="mb-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Clear search filter to reorder lots via drag & drop</span>
        </div>
      )}

      {/* Reorderable Queue List */}
      <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
        {filtered.map((startup, idx) => {
          const isActive = startup.id === activeStartupId;
          const isDragging = draggedIndex === idx;
          const isDragOver = dragOverIndex === idx;

          return (
            <div
              key={startup.id}
              draggable={!isFilterActive}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectStartup(startup)}
              className={`group relative p-2.5 sm:p-3 rounded-md border transition-all cursor-pointer flex items-center justify-between ${
                isDragging
                  ? 'opacity-40 scale-[0.98] border-dashed border-[#1a5c3e] bg-[#1a5c3e]/5'
                  : isDragOver
                  ? 'border-t-2 border-t-[#1a5c3e] bg-[#1a5c3e]/10'
                  : isActive
                  ? 'bg-[#1a5c3e]/10 border-[#1a5c3e]/40 text-[#203126]'
                  : 'bg-[#f5f8f5] border-[#cad7cc] hover:bg-[#e5ece6] text-[#203126]'
              }`}
            >
              {/* Left Side: Drag Handle + Index Badge + Details */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Drag Handle & Up/Down Controls */}
                {!isFilterActive && (
                  <div className="flex items-center gap-0.5 text-[#56695e] group-hover:text-[#203126]">
                    <span title="Drag to reorder">
                      <GripVertical
                        className="w-3.5 h-3.5 cursor-grab active:cursor-grabbing shrink-0"
                      />
                    </span>
                    <div className="flex flex-col -space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => moveItem(idx, idx - 1, e)}
                        disabled={idx === 0 || isSaving}
                        title="Move up in queue"
                        className="p-0.5 hover:text-[#1a5c3e] disabled:opacity-20"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => moveItem(idx, idx + 1, e)}
                        disabled={idx === items.length - 1 || isSaving}
                        title="Move down in queue"
                        className="p-0.5 hover:text-[#1a5c3e] disabled:opacity-20"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Lot Number Badge */}
                <span
                  className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-semibold shrink-0 tabular-nums ${
                    isActive
                      ? 'bg-[#1a5c3e] text-white shadow-sm'
                      : 'bg-[#e5ece6] text-[#56695e]'
                  }`}
                >
                  #{startup.display_order}
                </span>

                {/* Startup Name & Floor */}
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#203126] truncate">
                    {startup.name}
                  </h4>
                  <span className="text-[11px] text-[#56695e] block truncate">
                    {startup.sector} · Floor Reserve: ₹{Number(startup.base_price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Right Side: Status Tag */}
              <div className="text-right shrink-0 pl-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider block border ${
                    startup.status === 'ACTIVE_BIDDING'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : startup.status === 'PRESENTING'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : startup.status === 'SOLD'
                      ? 'bg-[#1a5c3e]/10 text-[#1a5c3e] border-[#1a5c3e]/20 font-mono'
                      : startup.status === 'UNSOLD'
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : 'text-[#6b7a8d] border-transparent'
                  }`}
                >
                  {startup.status === 'SOLD' && startup.winning_bid_amount
                    ? `SOLD ₹${Number(startup.winning_bid_amount).toLocaleString('en-IN')}`
                    : startup.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
