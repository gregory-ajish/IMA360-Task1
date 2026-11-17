// src/components/tables/actionsColumn.js
// ============================================================================
// PURPOSE:
//   Flexible, parent-controlled Actions column configuration and cell renderer
//   for Handsontable data grids (HandsontableSheet / AppHotTable).
//
// DESIGN PRINCIPLE:
//   The table does NOT hardcode or decide what actions exist.
//   The parent (page) decides:
//     - Which icons to show (e.g. scale, view, edit, delete, custom)
//     - What each action is named
//     - Tooltips, styles, visibility rules
//     - What happens on click (via onAction or action.onClick)
//   The table only renders the icons and dispatches the action event to the parent.
// ============================================================================

import { registerCellType } from 'handsontable/cellTypes';

/**
 * Built-in SVG presets for standard action icons.
 * Each preset is optimized for 14x14 / 16x16 table cell rendering.
 */
export const DEFAULT_ACTION_ICONS = {
  // Scale / Balance icon (used e.g. for customer pricing / rebate scale tiers)
  scale: `
    <svg style="width:14px;height:14px;display:block;pointer-events:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  `,

  // View / Eye icon
  view: `
    <svg style="width:14px;height:14px;display:block;pointer-events:none;" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  `,

  // Edit / Pencil icon
  edit: `
    <svg style="width:13px;height:13px;display:block;pointer-events:none;" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  `,

  // Delete / Trash icon
  delete: `
    <svg style="width:14px;height:14px;display:block;pointer-events:none;" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  `,

  // Copy / Duplicate icon
  copy: `
    <svg style="width:13px;height:13px;display:block;pointer-events:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="13" height="13" x="9" y="9" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  `,

  // Download icon
  download: `
    <svg style="width:14px;height:14px;display:block;pointer-events:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  `,

  // Info icon
  info: `
    <svg style="width:14px;height:14px;display:block;pointer-events:none;" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
  `,

  // Settings / Cog icon
  settings: `
    <svg style="width:14px;height:14px;display:block;pointer-events:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  `,
};

/**
 * Resolves an action's icon to an SVG markup string.
 *
 * @param {Object} action - Action configuration item
 * @param {*} rowData - Current row's data
 * @param {number} rowIndex - Row index
 * @returns {string} Safe HTML string containing the SVG
 */
export const resolveActionIconSvg = (action, rowData, rowIndex) => {
  if (!action) return '';

  let iconRaw = action.icon;
  if (typeof iconRaw === 'function') {
    iconRaw = iconRaw(rowData, rowIndex);
  }

  if (typeof iconRaw === 'string') {
    const trimmed = iconRaw.trim();
    if (trimmed.startsWith('<svg') || trimmed.startsWith('<span') || trimmed.startsWith('<i')) {
      return trimmed;
    }
    const preset = DEFAULT_ACTION_ICONS[trimmed.toLowerCase()];
    if (preset) {
      return preset.trim();
    }
  }

  // Fallback to name match in presets
  const namePreset = DEFAULT_ACTION_ICONS[String(action.name || '').toLowerCase()];
  if (namePreset) {
    return namePreset.trim();
  }

  // Generic fallback dot/bullet icon
  return `
    <svg style="width:12px;height:12px;display:block;pointer-events:none;" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="6" />
    </svg>
  `;
};

/**
 * Default color styling per action name/theme.
 */
const getDefaultActionColor = (actionName) => {
  switch (actionName) {
    case 'scale':
      return { color: '#0284c7', hoverBg: 'rgba(2, 132, 199, 0.15)' }; // Sky / Blue
    case 'view':
      return { color: '#0d9488', hoverBg: 'rgba(13, 148, 136, 0.15)' }; // Teal
    case 'edit':
      return { color: '#2563eb', hoverBg: 'rgba(37, 99, 235, 0.15)' }; // Royal Blue
    case 'delete':
      return { color: '#ef4444', hoverBg: 'rgba(239, 68, 68, 0.15)' }; // Red
    case 'copy':
      return { color: '#8b5cf6', hoverBg: 'rgba(139, 92, 246, 0.15)' }; // Purple
    case 'download':
      return { color: '#059669', hoverBg: 'rgba(5, 150, 105, 0.15)' }; // Emerald
    default:
      return { color: '#475569', hoverBg: 'rgba(100, 116, 139, 0.15)' }; // Slate
  }
};

/**
 * Handsontable Custom Cell Renderer for the parent-controlled Actions column.
 * Reads the list of actions configured by the parent and renders each icon button.
 */
export const actionsColumnRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  // Empty existing cell contents cleanly
  td.innerHTML = '';
  td.className = 'htCenter htMiddle';
  td.style.textAlign = 'center';
  td.style.verticalAlign = 'middle';
  td.style.padding = '0';
  td.style.lineHeight = '1';

  // 1. Resolve actions list from column definitions, cell properties, or hot settings
  const actionsList =
    cellProperties.actions ||
    instance.getSettings()?.columns?.[col]?.actions ||
    instance.getSettings()?.actions ||
    [];

  if (!Array.isArray(actionsList) || actionsList.length === 0) {
    return td;
  }

  // 2. Fetch row data to pass into dynamic action condition checks (show / disabled)
  let rowData = null;
  try {
    const physicalRow = instance.toPhysicalRow ? instance.toPhysicalRow(row) : row;
    rowData = instance.getSourceDataAtRow(physicalRow) ?? instance.getDataAtRow(row);
  } catch {
    rowData = null;
  }

  // 3. Render container
  const container = document.createElement('div');
  container.className = 'action-btn-group';
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.verticalAlign = 'middle';
  container.style.gap = '6px';
  container.style.lineHeight = '1';
  container.style.boxConfig = 'border-box';
  container.style.margin = '0 auto';
  container.style.padding = '0';

  actionsList.forEach((action) => {
    if (!action || !action.name) return;

    // Check visibility filter: action.show can be a boolean or (rowData, row) => boolean
    if (typeof action.show === 'function' && !action.show(rowData, row)) {
      return;
    }
    if (action.show === false) {
      return;
    }

    const defaultColor = getDefaultActionColor(action.name);
    const color = action.color || defaultColor.color;
    const hoverBg = action.hoverBg || defaultColor.hoverBg;
    const title = action.title || action.label || action.name;
    const isDisabled = typeof action.disabled === 'function' ? action.disabled(rowData, row) : Boolean(action.disabled);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `action-btn action-${action.name}-btn ${action.className || ''}`.trim();
    btn.setAttribute('data-action', action.name);
    btn.setAttribute('data-row', String(row));
    btn.setAttribute('title', title);
    btn.setAttribute('aria-label', title);

    if (isDisabled) {
      btn.setAttribute('disabled', 'disabled');
      btn.style.opacity = '0.4';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.style.cursor = 'pointer';
      btn.onmouseover = () => {
        btn.style.backgroundColor = hoverBg;
      };
      btn.onmouseout = () => {
        btn.style.backgroundColor = 'transparent';
      };
    }

    // Standard styling for clean grid alignment
    btn.style.background = 'transparent';
    btn.style.border = 'none';
    btn.style.padding = '3px';
    btn.style.margin = '0';
    btn.style.width = '22px';
    btn.style.height = '22px';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.verticalAlign = 'middle';
    btn.style.lineHeight = '1';
    btn.style.color = color;
    btn.style.borderRadius = '4px';
    btn.style.transition = 'background-color 0.15s ease, transform 0.1s ease';

    // SVG icon content
    btn.innerHTML = resolveActionIconSvg(action, rowData, row);

    container.appendChild(btn);
  });

  td.appendChild(container);
  return td;
};

// Register the custom cell type with Handsontable registry
try {
  registerCellType('actions', {
    renderer: actionsColumnRenderer,
    readOnly: true,
    editor: false,
  });
} catch {
  // Guard if already registered
}

/**
 * Normalizes user actions list into a standard configuration array.
 */
const normalizeActions = (actionsInput, isAdmin = true) => {
  // Case A: Array of action objects
  if (Array.isArray(actionsInput)) {
    return actionsInput;
  }

  // Case B: Legacy object shorthand, e.g. { view: true, edit: true, delete: true }
  if (actionsInput && typeof actionsInput === 'object') {
    const list = [];
    if (actionsInput.scale) {
      list.push({ name: 'scale', icon: 'scale', title: 'View Scales' });
    }
    if (actionsInput.view) {
      list.push({ name: 'view', icon: 'view', title: 'View details' });
    }
    if (actionsInput.edit && isAdmin) {
      list.push({ name: 'edit', icon: 'edit', title: 'Edit row' });
    }
    if (actionsInput.delete && isAdmin) {
      list.push({ name: 'delete', icon: 'delete', title: 'Delete row' });
    }
    return list;
  }

  return [];
};

/**
 * Calculates responsive width based on number of rendered icons.
 */
const calculateActionColumnWidth = (actionCount) => {
  if (actionCount <= 1) return 56;
  if (actionCount === 2) return 80;
  if (actionCount === 3) return 108;
  return Math.max(56, actionCount * 28 + 24);
};

/**
 * Creates a flexible Handsontable column definition for Actions.
 * Works just like other special columns (date, dropdown, numeric).
 *
 * Usage Examples:
 *
 * 1. Array of actions:
 *    createActionsColumn([
 *      { name: 'scale', icon: 'scale', title: 'Scales Tier' },
 *      { name: 'edit',  icon: 'edit',  title: 'Edit' },
 *    ])
 *
 * 2. Configuration Object:
 *    createActionsColumn({
 *      label: 'Actions',
 *      width: 90,
 *      actions: [
 *        { name: 'scale', icon: 'scale', title: 'View Scales' }
 *      ]
 *    })
 *
 * 3. Legacy Signature:
 *    createActionsColumn(isAdmin, { view: true, edit: true })
 *
 * @param {Array|Object|boolean} actionsOrIsAdmin - Actions list or legacy isAdmin flag
 * @param {Object} [options={}] - Additional column overrides (width, label, etc.)
 * @returns {Object} Handsontable column configuration
 */
export const createActionsColumn = (actionsOrIsAdmin, options = {}) => {
  let normalizedActions = [];
  let colOptions = options;

  if (typeof actionsOrIsAdmin === 'boolean') {
    // Legacy signature: createActionsColumn(isAdmin, { view: true, edit: true })
    const isAdmin = actionsOrIsAdmin;
    const actionConfig = options || {};
    normalizedActions = normalizeActions(actionConfig, isAdmin);
    colOptions = typeof options.options === 'object' ? options.options : {};
  } else if (Array.isArray(actionsOrIsAdmin)) {
    // Standard signature: createActionsColumn([...actions], options)
    normalizedActions = actionsOrIsAdmin;
  } else if (actionsOrIsAdmin && typeof actionsOrIsAdmin === 'object') {
    // Object signature: createActionsColumn({ actions: [...], width: 80 })
    normalizedActions = normalizeActions(actionsOrIsAdmin.actions || actionsOrIsAdmin);
    colOptions = actionsOrIsAdmin;
  }

  const width = colOptions.width || calculateActionColumnWidth(normalizedActions.length);
  const label = colOptions.label !== undefined ? colOptions.label : (colOptions.title || 'Actions');

  const colDef = {
    id: colOptions.id || 'actions',
    label,
    title: label,
    actions: normalizedActions,
    renderer: actionsColumnRenderer,
    readOnly: true,
    editor: false,
    copyable: false,
    className: 'htCenter htMiddle',
    width,
    manualColumnResize: false,
    ...colOptions,
  };

  // Only assign data if provided in colOptions, avoiding undefined string key on 2D array rows
  if (colOptions.data !== undefined) {
    colDef.data = colOptions.data;
  }

  return colDef;
};

export default createActionsColumn;
