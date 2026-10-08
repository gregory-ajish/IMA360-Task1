/**
 * tableWorker.js
 * ============================================================================
 * Generic, high-performance Web Worker for Data Tables.
 * 
 * FEATURES:
 * - Offloads sorting, filtering, and batch hydration for 1,000,000+ rows
 *   from the main UI thread to a background CPU thread.
 * - Entirely generic: accepts arbitrary row data or pre-generated batches
 *   from any table component (RevenueTracker, UserLedger, AuditLog, etc.).
 * - Zero revenue-specific domain logic embedded inside this worker.
 * ============================================================================
 */

let dataset = [];
let totalRowsCount = 0;

// activeIndices holds the sequence of physical row indices matching active filters + sort order
let activeIndices = new Uint32Array(0);
let activeCount = 0;

// Current state
let currentSort = { columnId: null, dataIndex: null, direction: 'none', type: 'text' };
let currentFilters = {
  conditionsStack: [],
  search: '',
};

/**
 * Extracts value for a given row and column data index.
 */
function getRowValue(rowIdx, colDataIndex) {
  const row = dataset[rowIdx];
  if (!row) return null;
  if (Array.isArray(row)) {
    return row[colDataIndex] ?? null;
  }
  if (typeof row === 'object') {
    return row[colDataIndex] ?? null;
  }
  return null;
}

/**
 * Pre-compiles matchers for Handsontable conditionCollection filter definitions.
 */
function buildConditionsMatchers(conditionsStack) {
  if (!Array.isArray(conditionsStack) || conditionsStack.length === 0) return null;
  const matchers = [];

  for (const item of conditionsStack) {
    const colIdx = item.column;
    const condList = item.conditions || [];
    for (const cond of condList) {
      const name = (cond.name || '').toLowerCase();
      const args = cond.args || [];

      if (name === 'by_value') {
        const allowedVals = Array.isArray(args[0]) ? args[0] : [args[0]];
        const set = new Set(allowedVals.map((v) => String(v ?? '').replace(/[$,\s]/g, '').toLowerCase()));
        matchers.push((rowIdx) => {
          const rawCell = getRowValue(rowIdx, colIdx);
          if (rawCell === null || rawCell === undefined) return false;
          const clean = String(rawCell).replace(/[$,\s]/g, '').toLowerCase();
          return set.has(clean) || set.has(String(rawCell).toLowerCase());
        });
      } else if (name === 'contains') {
        const str = String(args[0] || '').replace(/[$,\s]/g, '').toLowerCase();
        matchers.push((rowIdx) => {
          const rawCell = getRowValue(rowIdx, colIdx);
          const cellStr = String(rawCell ?? '').toLowerCase();
          const cleanCell = cellStr.replace(/[$,\s]/g, '');
          return cellStr.includes(str) || cleanCell.includes(str);
        });
      } else if (name === 'not_contains') {
        const str = String(args[0] || '').replace(/[$,\s]/g, '').toLowerCase();
        matchers.push((rowIdx) => {
          const rawCell = getRowValue(rowIdx, colIdx);
          const cellStr = String(rawCell ?? '').toLowerCase();
          const cleanCell = cellStr.replace(/[$,\s]/g, '');
          return !cellStr.includes(str) && !cleanCell.includes(str);
        });
      } else if (name === 'eq' || name === 'equal') {
        const rawArg = args[0] ?? '';
        const cleanArg = String(rawArg).replace(/[$,\s]/g, '').trim().toLowerCase();
        matchers.push((rowIdx) => {
          const rawCell = getRowValue(rowIdx, colIdx);
          if (rawCell === null || rawCell === undefined) return false;
          const cleanCell = String(rawCell).replace(/[$,\s]/g, '').trim().toLowerCase();
          if (cleanCell === cleanArg) return true;
          const numCell = Number(cleanCell);
          const numArg = Number(cleanArg);
          if (!isNaN(numCell) && !isNaN(numArg) && cleanArg !== '') {
            return numCell === numArg;
          }
          return false;
        });
      } else if (name === 'not_equal' || name === 'neq') {
        const rawArg = args[0] ?? '';
        const cleanArg = String(rawArg).replace(/[$,\s]/g, '').trim().toLowerCase();
        matchers.push((rowIdx) => {
          const rawCell = getRowValue(rowIdx, colIdx);
          if (rawCell === null || rawCell === undefined) return true;
          const cleanCell = String(rawCell).replace(/[$,\s]/g, '').trim().toLowerCase();
          if (cleanCell === cleanArg) return false;
          const numCell = Number(cleanCell);
          const numArg = Number(cleanArg);
          if (!isNaN(numCell) && !isNaN(numArg) && cleanArg !== '') {
            return numCell !== numArg;
          }
          return true;
        });
      } else if (name === 'gt' || name === 'greater_than') {
        const num = Number(String(args[0] ?? '').replace(/[$,\s]/g, ''));
        matchers.push((rowIdx) => {
          const rawCell = getRowValue(rowIdx, colIdx);
          const numCell = Number(String(rawCell ?? '').replace(/[$,\s]/g, ''));
          return !isNaN(numCell) && numCell > num;
        });
      } else if (name === 'gte' || name === 'greater_than_or_equal') {
        const num = Number(String(args[0] ?? '').replace(/[$,\s]/g, ''));
        matchers.push((rowIdx) => {
          const rawCell = getRowValue(rowIdx, colIdx);
          const numCell = Number(String(rawCell ?? '').replace(/[$,\s]/g, ''));
          return !isNaN(numCell) && numCell >= num;
        });
      } else if (name === 'lt' || name === 'less_than') {
        const num = Number(String(args[0] ?? '').replace(/[$,\s]/g, ''));
        matchers.push((rowIdx) => {
          const rawCell = getRowValue(rowIdx, colIdx);
          const numCell = Number(String(rawCell ?? '').replace(/[$,\s]/g, ''));
          return !isNaN(numCell) && numCell < num;
        });
      } else if (name === 'lte' || name === 'less_than_or_equal') {
        const num = Number(String(args[0] ?? '').replace(/[$,\s]/g, ''));
        matchers.push((rowIdx) => {
          const rawCell = getRowValue(rowIdx, colIdx);
          const numCell = Number(String(rawCell ?? '').replace(/[$,\s]/g, ''));
          return !isNaN(numCell) && numCell <= num;
        });
      } else if (name === 'between') {
        const min = Number(String(args[0] ?? '').replace(/[$,\s]/g, ''));
        const max = Number(String(args[1] ?? '').replace(/[$,\s]/g, ''));
        matchers.push((rowIdx) => {
          const rawCell = getRowValue(rowIdx, colIdx);
          const v = Number(String(rawCell ?? '').replace(/[$,\s]/g, ''));
          return !isNaN(v) && v >= min && v <= max;
        });
      } else if (name === 'not_between') {
        const min = Number(String(args[0] ?? '').replace(/[$,\s]/g, ''));
        const max = Number(String(args[1] ?? '').replace(/[$,\s]/g, ''));
        matchers.push((rowIdx) => {
          const rawCell = getRowValue(rowIdx, colIdx);
          const v = Number(String(rawCell ?? '').replace(/[$,\s]/g, ''));
          return !isNaN(v) && (v < min || v > max);
        });
      } else if (name === 'begins_with') {
        const str = String(args[0] || '').toLowerCase();
        matchers.push((rowIdx) => String(getRowValue(rowIdx, colIdx) ?? '').toLowerCase().startsWith(str));
      } else if (name === 'ends_with') {
        const str = String(args[0] || '').toLowerCase();
        matchers.push((rowIdx) => String(getRowValue(rowIdx, colIdx) ?? '').toLowerCase().endsWith(str));
      } else if (name === 'empty') {
        matchers.push((rowIdx) => {
          const v = getRowValue(rowIdx, colIdx);
          return v === '' || v === null || v === undefined;
        });
      } else if (name === 'not_empty') {
        matchers.push((rowIdx) => {
          const v = getRowValue(rowIdx, colIdx);
          return v !== '' && v !== null && v !== undefined;
        });
      }
    }
  }
  return matchers;
}

/**
 * Applies current filters to dataset and updates activeIndices.
 */
function applyFilters() {
  const { conditionsStack, search } = currentFilters;
  const searchLower = (search || '').trim().toLowerCase();
  const hasSearch = searchLower.length > 0;

  const stackMatchers = buildConditionsMatchers(conditionsStack);
  const numStackMatchers = stackMatchers ? stackMatchers.length : 0;

  let count = 0;
  for (let i = 0; i < totalRowsCount; i++) {
    // Search check across all fields in the row
    if (hasSearch) {
      const rowStr = JSON.stringify(dataset[i] || '').toLowerCase();
      if (!rowStr.includes(searchLower)) {
        continue;
      }
    }

    // Handsontable dropdown conditions check
    if (numStackMatchers > 0) {
      let pass = true;
      for (let m = 0; m < numStackMatchers; m++) {
        if (!stackMatchers[m](i)) {
          pass = false;
          break;
        }
      }
      if (!pass) continue;
    }

    activeIndices[count++] = i;
  }

  activeCount = count;
}

/**
 * Sorts activeIndices based on currentSort configuration.
 */
function applySort() {
  const { dataIndex, direction, type } = currentSort;
  if (dataIndex === null || dataIndex === undefined || direction === 'none' || activeCount <= 1) {
    return;
  }

  const sub = activeIndices.subarray(0, activeCount);
  const isAsc = direction === 'asc';

  if (type === 'numeric') {
    sub.sort((a, b) => {
      const rawA = getRowValue(a, dataIndex);
      const rawB = getRowValue(b, dataIndex);
      const aEmpty = rawA === null || rawA === undefined || rawA === '';
      const bEmpty = rawB === null || rawB === undefined || rawB === '';
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;

      const numA = Number(String(rawA).replace(/[$,\s]/g, '')) || 0;
      const numB = Number(String(rawB).replace(/[$,\s]/g, '')) || 0;
      return isAsc ? numA - numB : numB - numA;
    });
  } else {
    sub.sort((a, b) => {
      const rawA = getRowValue(a, dataIndex);
      const rawB = getRowValue(b, dataIndex);
      const aEmpty = rawA === null || rawA === undefined || rawA === '';
      const bEmpty = rawB === null || rawB === undefined || rawB === '';
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;

      const valA = String(rawA).toLowerCase();
      const valB = String(rawB).toLowerCase();
      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });
  }
}

/**
 * Slices a batch of display rows from activeIndices.
 */
function getRowBatch(startIndex, count) {
  const batch = [];
  const endIndex = Math.min(startIndex + count, activeCount);
  for (let i = startIndex; i < endIndex; i++) {
    batch.push(dataset[activeIndices[i]]);
  }
  return batch;
}

// ──────────────────────────────────────────────────────────────────────────
// Message Handler
// ──────────────────────────────────────────────────────────────────────────
self.onmessage = function (e) {
  const { type, payload = {} } = e.data;

  if (type === 'INIT') {
    const { rows = [], totalCount } = payload;
    dataset = rows;
    totalRowsCount = totalCount || rows.length;

    if (activeIndices.length < totalRowsCount) {
      activeIndices = new Uint32Array(totalRowsCount);
    }

    for (let i = 0; i < totalRowsCount; i++) {
      activeIndices[i] = i;
    }
    activeCount = totalRowsCount;

    currentSort = { columnId: null, dataIndex: null, direction: 'none', type: 'text' };
    currentFilters = { conditionsStack: [], search: '' };

    const batch = getRowBatch(0, payload.count || 100);
    self.postMessage({
      type: 'INIT_COMPLETE',
      rows: batch,
      totalCount: activeCount,
      totalRows: totalRowsCount,
    });
  } else if (type === 'SET_DATASET') {
    // Allows sending full or chunked dataset to worker
    const { rows = [], totalCount } = payload;
    dataset = rows;
    totalRowsCount = totalCount || rows.length;

    if (activeIndices.length < totalRowsCount) {
      activeIndices = new Uint32Array(totalRowsCount);
    }

    for (let i = 0; i < totalRowsCount; i++) {
      activeIndices[i] = i;
    }
    activeCount = totalRowsCount;

    applyFilters();
    applySort();

    const batch = getRowBatch(0, payload.count || 100);
    self.postMessage({
      type: 'DATASET_UPDATED',
      rows: batch,
      totalCount: activeCount,
    });
  } else if (type === 'GET_ROWS') {
    const { startIndex = 0, count = 100 } = payload;
    const batch = getRowBatch(startIndex, count);
    self.postMessage({
      type: 'ROWS_LOADED',
      rows: batch,
      startIndex,
      count,
      totalCount: activeCount,
    });
  } else if (type === 'SORT') {
    const t0 = performance.now();
    const { columnId, dataIndex, direction, type: sortType = 'text' } = payload;
    currentSort = { columnId, dataIndex, direction, type: sortType };

    applyFilters();
    applySort();

    const durationMs = Math.round(performance.now() - t0);
    const batch = getRowBatch(0, payload.count || 100);

    self.postMessage({
      type: 'SORT_COMPLETE',
      rows: batch,
      columnId,
      direction,
      totalCount: activeCount,
      durationMs,
    });
  } else if (type === 'FILTER') {
    const t0 = performance.now();
    currentFilters = { ...currentFilters, ...(payload.filters || {}) };

    applyFilters();
    applySort();

    const durationMs = Math.round(performance.now() - t0);
    const batch = getRowBatch(0, payload.count || 100);

    self.postMessage({
      type: 'FILTER_COMPLETE',
      rows: batch,
      totalCount: activeCount,
      durationMs,
      activeFilters: currentFilters,
    });
  } else if (type === 'RESET') {
    currentSort = { columnId: null, dataIndex: null, direction: 'none', type: 'text' };
    currentFilters = { conditionsStack: [], search: '' };
    
    if (payload.rows) {
      dataset = payload.rows;
      totalRowsCount = dataset.length;
    }

    if (activeIndices.length < totalRowsCount) {
      activeIndices = new Uint32Array(totalRowsCount);
    }

    for (let i = 0; i < totalRowsCount; i++) {
      activeIndices[i] = i;
    }
    activeCount = totalRowsCount;

    const batch = getRowBatch(0, payload.count || 100);
    self.postMessage({
      type: 'RESET_COMPLETE',
      rows: batch,
      totalCount: totalRowsCount,
    });
  }
};
