// ViewManagementModal.jsx
// ============================================================================
// PURPOSE:
//   A theme-aware popup modal for managing table columns in the Revenue Tracker.
//   Powered by @dnd-kit to provide smooth, accessible drag-and-drop reordering
//   and moving columns between "Visible Columns" and "Hidden Columns".
// ============================================================================

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Chip,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ViewColumn as ViewColumnIcon,
  DragIndicator as DragIndicatorIcon,
  RestartAlt as ResetIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

// @dnd-kit core and sortable imports
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { blcColors, typographyTokens } from '../../theme';
import { AppButton } from '../common/AppButton';

// ─── Droppable Container Box Component ───────────────────────────────────────
function DroppableContainer({ id, children, isDark, title, count, icon, emptyText, emptySubtext }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '12px',
        bgcolor: isDark
          ? isOver
            ? 'rgba(30, 58, 138, 0.18)'
            : '#0f172a'
          : isOver
          ? 'rgba(30, 58, 138, 0.05)'
          : '#f8fafc',
        border: `1.5px ${isOver ? 'dashed' : 'solid'} ${
          isOver
            ? blcColors.navyAccent
            : isDark
            ? '#334155'
            : '#e2e8f0'
        }`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 360,
        maxHeight: 460,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Box Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          pb: 1.5,
          borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography
            sx={{
              fontFamily: typographyTokens.fontMono,
              fontWeight: typographyTokens.weightBold,
              fontSize: '0.92rem',
            }}
          >
            {title}
          </Typography>
        </Box>
        <Chip
          label={count}
          size="small"
          sx={{
            fontFamily: typographyTokens.fontMono,
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 22,
            bgcolor:
              id === 'visible'
                ? `${blcColors.navyAccent}20`
                : isDark
                ? 'rgba(255,255,255,0.06)'
                : '#e2e8f0',
            color:
              id === 'visible'
                ? blcColors.navyAccent
                : isDark
                ? '#94a3b8'
                : '#64748b',
          }}
        />
      </Box>

      {/* Box Contents */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          overflowY: 'auto',
          pr: 0.5,
          minHeight: 200,
        }}
      >
        {count === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              textAlign: 'center',
              border: `1px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
              borderRadius: '8px',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: isDark ? '#64748b' : '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              {emptyText}
            </Typography>
            {emptySubtext && (
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? '#475569' : '#94a3b8',
                  mt: 0.5,
                  display: 'block',
                }}
              >
                {emptySubtext}
              </Typography>
            )}
          </Box>
        ) : (
          children
        )}
      </Box>
    </Paper>
  );
}

// ─── Sortable Column Card Component ─────────────────────────────────────────
function SortableColumnCard({ col, isDark, onToggleVisibility, isVisible, isOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1.25,
        px: 1.75,
        borderRadius: '8px',
        bgcolor: isDark ? blcColors.darkCard : '#ffffff',
        border: `1px solid ${
          isOverlay
            ? blcColors.navyAccent
            : isDark
            ? blcColors.darkBorder
            : '#e2e8f0'
        }`,
        boxShadow: isOverlay
          ? '0 12px 28px rgba(0,0,0,0.3)'
          : isDark
          ? '0 1px 4px rgba(0,0,0,0.2)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          borderColor: blcColors.navyAccent,
          boxShadow: isDark
            ? '0 2px 8px rgba(0,0,0,0.35)'
            : '0 2px 8px rgba(30,58,138,0.08)',
        },
      }}
      {...attributes}
      {...listeners}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <DragIndicatorIcon
          fontSize="small"
          sx={{
            color: isDark ? '#64748b' : '#94a3b8',
            fontSize: '1.1rem',
          }}
        />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            fontSize: '0.85rem',
            color: isDark ? '#e2e8f0' : blcColors.textDark,
          }}
        >
          {col.label}
        </Typography>
      </Box>

      {/* Quick Move / Toggle Button (also supports single-click transfer) */}
      <Tooltip title={isVisible ? 'Hide Column' : 'Show Column'} arrow>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(col.id);
          }}
          onPointerDown={(e) => e.stopPropagation()} // Prevents drag from starting on click
          sx={{
            color: isDark ? '#94a3b8' : '#64748b',
            p: 0.5,
            '&:hover': {
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
              color: blcColors.navyAccent,
            },
          }}
        >
          {isVisible ? (
            <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
          ) : (
            <ArrowBackIcon sx={{ fontSize: '1rem' }} />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ─── Main ViewManagementModal Component ─────────────────────────────────────
export const ViewManagementModal = ({
  open,
  onClose,
  visibleColumns = [],
  hiddenColumns = [],
  onColumnsChange,
  onResetColumns,
  isDark = false,
}) => {
  const [activeId, setActiveId] = useState(null);

  // Setup sensors with a 5px activation constraint so clicks don't initiate accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper to find which container an item belongs to
  const findContainer = (id) => {
    if (id === 'visible') return 'visible';
    if (id === 'hidden') return 'hidden';
    if (visibleColumns.some((col) => col.id === id)) return 'visible';
    if (hiddenColumns.some((col) => col.id === id)) return 'hidden';
    return null;
  };

  // Find the active column object being dragged
  const activeCol =
    visibleColumns.find((c) => c.id === activeId) ||
    hiddenColumns.find((c) => c.id === activeId);

  // ── Handlers ──
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Moving item from one container to the other
    let newVisible = [...visibleColumns];
    let newHidden = [...hiddenColumns];

    if (activeContainer === 'visible' && overContainer === 'hidden') {
      const itemToMove = newVisible.find((c) => c.id === active.id);
      if (!itemToMove) return;
      newVisible = newVisible.filter((c) => c.id !== active.id);

      const overIndex = newHidden.findIndex((c) => c.id === over.id);
      if (overIndex >= 0) {
        newHidden.splice(overIndex, 0, itemToMove);
      } else {
        newHidden.push(itemToMove);
      }
      onColumnsChange(newVisible, newHidden);
    } else if (activeContainer === 'hidden' && overContainer === 'visible') {
      const itemToMove = newHidden.find((c) => c.id === active.id);
      if (!itemToMove) return;
      newHidden = newHidden.filter((c) => c.id !== active.id);

      const overIndex = newVisible.findIndex((c) => c.id === over.id);
      if (overIndex >= 0) {
        newVisible.splice(overIndex, 0, itemToMove);
      } else {
        newVisible.push(itemToMove);
      }
      onColumnsChange(newVisible, newHidden);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) return;

    // If reordering within the same container
    if (activeContainer === overContainer && active.id !== over.id) {
      if (activeContainer === 'visible') {
        const oldIndex = visibleColumns.findIndex((c) => c.id === active.id);
        const newIndex = visibleColumns.findIndex((c) => c.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(visibleColumns, oldIndex, newIndex);
          onColumnsChange(reordered, hiddenColumns);
        }
      } else {
        const oldIndex = hiddenColumns.findIndex((c) => c.id === active.id);
        const newIndex = hiddenColumns.findIndex((c) => c.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(hiddenColumns, oldIndex, newIndex);
          onColumnsChange(visibleColumns, reordered);
        }
      }
    }
  };

  // Quick one-click toggle visibility
  const handleToggleVisibility = (colId) => {
    const isCurrentlyVisible = visibleColumns.some((c) => c.id === colId);
    if (isCurrentlyVisible) {
      // Don't allow hiding the last remaining column
      if (visibleColumns.length <= 1) return;
      const itemToHide = visibleColumns.find((c) => c.id === colId);
      const newVisible = visibleColumns.filter((c) => c.id !== colId);
      const newHidden = [...hiddenColumns, itemToHide];
      onColumnsChange(newVisible, newHidden);
    } else {
      const itemToShow = hiddenColumns.find((c) => c.id === colId);
      const newHidden = hiddenColumns.filter((c) => c.id !== colId);
      const newVisible = [...visibleColumns, itemToShow];
      onColumnsChange(newVisible, newHidden);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            color: isDark ? '#e2e8f0' : blcColors.textDark,
            border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
            boxShadow: isDark
              ? '0 24px 64px rgba(0,0,0,0.7)'
              : '0 20px 50px rgba(15,23,42,0.12)',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* ── Modal Header ── */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2.5,
          borderBottom: `1px solid ${isDark ? blcColors.darkBorder : '#f1f5f9'}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: `${blcColors.navyAccent}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: blcColors.navyAccent,
            }}
          >
            <ViewColumnIcon fontSize="small" />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: typographyTokens.fontMono,
                fontWeight: typographyTokens.weightBold,
                fontSize: '1.15rem',
                lineHeight: 1.2,
              }}
            >
              View Management
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: isDark ? '#94a3b8' : '#64748b',
                fontSize: '0.8rem',
                mt: 0.25,
              }}
            >
              Drag cards to reorder columns or move them between boxes to show/hide
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close dialog"
          sx={{
            color: isDark ? '#94a3b8' : '#64748b',
            '&:hover': {
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
              color: isDark ? '#ffffff' : '#0f172a',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ── Modal Body: Two Drag & Drop Boxes ── */}
      <DialogContent sx={{ p: 3, pt: 3 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2.5,
            }}
          >
            {/* Box 1: Visible Columns */}
            <SortableContext
              id="visible"
              items={visibleColumns.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableContainer
                id="visible"
                title="Visible Columns"
                count={visibleColumns.length}
                icon={<VisibilityIcon fontSize="small" sx={{ color: blcColors.navyAccent }} />}
                emptyText="No visible columns"
                emptySubtext="Drag columns here to display them in the table"
                isDark={isDark}
              >
                {visibleColumns.map((col) => (
                  <SortableColumnCard
                    key={col.id}
                    col={col}
                    isVisible={true}
                    isDark={isDark}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </DroppableContainer>
            </SortableContext>

            {/* Box 2: Hidden Columns */}
            <SortableContext
              id="hidden"
              items={hiddenColumns.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableContainer
                id="hidden"
                title="Hidden Columns"
                count={hiddenColumns.length}
                icon={<VisibilityOffIcon fontSize="small" sx={{ color: isDark ? '#94a3b8' : '#64748b' }} />}
                emptyText="No hidden columns"
                emptySubtext="Drag or click arrow to hide columns from the table"
                isDark={isDark}
              >
                {hiddenColumns.map((col) => (
                  <SortableColumnCard
                    key={col.id}
                    col={col}
                    isVisible={false}
                    isDark={isDark}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </DroppableContainer>
            </SortableContext>
          </Box>

          {/* Floating Drag Overlay */}
          <DragOverlay>
            {activeCol ? (
              <SortableColumnCard
                col={activeCol}
                isVisible={visibleColumns.some((c) => c.id === activeCol.id)}
                isDark={isDark}
                isOverlay={true}
                onToggleVisibility={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </DialogContent>

      {/* ── Modal Footer ── */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${isDark ? blcColors.darkBorder : '#f1f5f9'}`,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        {onResetColumns && (
          <AppButton
            variant="ghost"
            size="small"
            startIcon={<ResetIcon />}
            onClick={onResetColumns}
          >
            Reset to Default
          </AppButton>
        )}
        <AppButton variant="primary" size="medium" onClick={onClose}>
          Done
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};
