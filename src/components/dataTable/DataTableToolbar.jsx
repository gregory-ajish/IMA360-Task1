// src/components/dataTable/DataTableToolbar.jsx
// ============================================================================
// PURPOSE:
//   Standardized toolbar controls for every Handsontable / DataTable instance.
//   Guarantees the presence of the 5 required features on every table:
//     1. Bulk Updater (BulkUpdater)
//     2. Delete (Delete with confirmation modal & range extraction)
//     3. Save View (Save Current View with modal)
//     4. Saved Views (Saved Views list with modal)
//     5. View Management (Drag & drop column ordering & visibility modal)
// ============================================================================

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Tooltip, IconButton } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { BulkUpdater } from './bulkUpdater/BulkUpdater';
import { Delete } from './delete';
import { SaveViewModal } from './viewManagement/SaveViewModal';
import { SavedViewsModal } from './viewManagement/SavedViewsModal';
import { ViewManagementModal } from './viewManagement/ViewManagementModal';

import { ViewsIcon, SavedViewsIcon, ViewColumnIcon } from '../../icons';
import { blcColors } from '../../theme';
import { saveView, setActiveView } from '../../store/viewsReducer';

export const DataTableToolbar = ({
  hotRef,
  deleteRef,
  dataset = [],
  onDelete,
  itemLabel = 'row',
  columns = [],
  onApplyBulkUpdate,
  visibleColumns = [],
  hiddenColumns = [],
  onColumnsChange,
  onResetColumns,
  onSaveView,
  onApplyView,
  pageKey,
  isDark = false,
  extraActions = null,
  showBulkUpdater = true,
  showDelete = true,
  showSaveView = true,
  showSavedViews = true,
  showViewManagement = true,
  sx = {},
}) => {
  const dispatch = useDispatch();
  const reduxViews = useSelector((state) => state.views?.views || []);
  const activeViewId = useSelector((state) => state.views?.activeViewId || null);

  const [saveViewModalOpen, setSaveViewModalOpen] = useState(false);
  const [savedViewsModalOpen, setSavedViewsModalOpen] = useState(false);
  const [viewManagementOpen, setViewManagementOpen] = useState(false);

  // Filter views by pageKey if provided
  const filteredViews = pageKey
    ? reduxViews.filter((v) => !v.pageKey || v.pageKey === pageKey)
    : reduxViews;

  const handleInternalSaveView = (name) => {
    if (onSaveView) {
      onSaveView(name);
      return;
    }
    const newView = {
      id: `view_${Date.now()}`,
      name,
      pageKey,
      visibleColumns: [...visibleColumns],
      hiddenColumns: [...hiddenColumns],
      createdAt: new Date().toISOString(),
    };
    dispatch(saveView(newView));
    toast.success(`View "${name}" saved!`);
  };

  const handleInternalApplyView = (view) => {
    if (onApplyView) {
      onApplyView(view);
      return;
    }
    if (view && onColumnsChange) {
      onColumnsChange(view.visibleColumns || [], view.hiddenColumns || []);
    }
    dispatch(setActiveView(view.id));
    toast.info(`Applied view: ${view.name}`);
  };

  const buttonStyle = {
    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
    color: isDark ? '#94a3b8' : '#475569',
    border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
    borderRadius: '8px',
    p: 0.85,
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
      color: isDark ? '#ffffff' : blcColors.navyAccent,
      borderColor: blcColors.navyAccent,
    },
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          ...sx,
        }}
      >
        {extraActions}

        {/* 1. Bulk Updater Icon */}
        {showBulkUpdater && (
          <BulkUpdater
            columns={columns}
            hotRef={hotRef}
            onApply={onApplyBulkUpdate}
            isDark={isDark}
          />
        )}

        {/* 2. Delete (Toolbar Button & Confirmation Modal) */}
        {showDelete && (
          <Delete
            ref={deleteRef}
            hotRef={hotRef}
            dataset={dataset}
            onDelete={onDelete}
            itemLabel={itemLabel}
            isDark={isDark}
          />
        )}

        {/* 3. Save Current View Icon */}
        {showSaveView && (
          <Tooltip title="Save Current View" placement="top" arrow>
            <IconButton
              aria-label="Save Current View"
              onClick={() => setSaveViewModalOpen(true)}
              sx={buttonStyle}
            >
              <ViewsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* 4. Saved Views Icon */}
        {showSavedViews && (
          <Tooltip title="Saved Views" placement="top" arrow>
            <IconButton
              aria-label="Saved Views"
              onClick={() => setSavedViewsModalOpen(true)}
              sx={buttonStyle}
            >
              <SavedViewsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* 5. View Management Icon */}
        {showViewManagement && (
          <Tooltip title="View Management" placement="top" arrow>
            <IconButton
              aria-label="View Management"
              onClick={() => setViewManagementOpen(true)}
              sx={buttonStyle}
            >
              <ViewColumnIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ── View Modals ── */}
      {showSaveView && (
        <SaveViewModal
          open={saveViewModalOpen}
          onClose={() => setSaveViewModalOpen(false)}
          onSave={handleInternalSaveView}
          existingViews={filteredViews}
          isDark={isDark}
        />
      )}

      {showSavedViews && (
        <SavedViewsModal
          open={savedViewsModalOpen}
          onClose={() => setSavedViewsModalOpen(false)}
          savedViews={filteredViews}
          activeViewId={activeViewId}
          onApplyView={handleInternalApplyView}
          pageKey={pageKey}
          isDark={isDark}
        />
      )}

      {showViewManagement && (
        <ViewManagementModal
          open={viewManagementOpen}
          onClose={() => setViewManagementOpen(false)}
          visibleColumns={visibleColumns}
          hiddenColumns={hiddenColumns}
          onColumnsChange={onColumnsChange}
          onReset={onResetColumns}
          isDark={isDark}
        />
      )}
    </>
  );
};

export default DataTableToolbar;
