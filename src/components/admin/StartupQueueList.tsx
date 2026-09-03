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
    <div className="rounded-xl p-5 sm:p-6 bg-white dark:bg-[#070D1E] border border-slate-200/80 dark:border-white/[0.08] flex flex-col h-full max-h-[660px] shadow-sm transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/[0.06] mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Startup Queue</span>
            {isSaving && (
              <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus && !isSaving && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                <Check className="w-3 h-3" />
                {saveStatus}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {items.length} Scheduled Venture Lots · Drag to reorder
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {filtered.length} visible
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by startup or sector..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#030712] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
        />
      </div>

      {isFilterActive && (
        <div className="mb-2 px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] flex items-center gap-1.5">
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
              className={`group relative p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                isDragging
                  ? 'opacity-40 scale-[0.98] border-dashed border-amber-500 bg-amber-500/5'
                  : isDragOver
                  ? 'border-t-2 border-t-amber-500 bg-amber-50/50 dark:bg-amber-500/10'
                  : isActive
                  ? 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-[#0A1124] border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-navy-900/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              {/* Left Side: Drag Handle + Index Badge + Details */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Drag Handle & Up/Down Controls */}
                {!isFilterActive && (
                  <div className="flex items-center gap-0.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
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
                        className="p-0.5 hover:text-amber-500 disabled:opacity-20"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => moveItem(idx, idx + 1, e)}
                        disabled={idx === items.length - 1 || isSaving}
                        title="Move down in queue"
                        className="p-0.5 hover:text-amber-500 disabled:opacity-20"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Lot Number Badge */}
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 tabular-nums ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  #{startup.display_order}
                </span>

                {/* Startup Name & Floor */}
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {startup.name}
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                    {startup.sector} · Floor ₹{Number(startup.base_price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Right Side: Status Tag */}
              <div className="text-right shrink-0 pl-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider block ${
                    startup.status === 'ACTIVE_BIDDING'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : startup.status === 'PRESENTING'
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                      : startup.status === 'SOLD'
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono'
                      : startup.status === 'UNSOLD'
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                      : 'text-slate-400 dark:text-slate-500'
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
