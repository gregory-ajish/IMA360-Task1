// src/components/dataTable/renderers.js
// PURPOSE: Dedicated Handsontable custom cell renderers.

/**
 * Custom HTML cell renderer for reusable Action / Delete column buttons.
 */
export const deleteButtonRenderer = (_instance, td) => {
  td.innerHTML = `
    <button
      type="button"
      class="rt-delete-btn"
      title="Delete row"
      style="
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #ef4444;
        border-radius: 4px;
        transition: background 0.15s ease;
      "
      onmouseover="this.style.background='rgba(239,68,68,0.1)'"
      onmouseout="this.style.background='transparent'"
    >
      <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    </button>
  `;
  td.style.textAlign = 'center';
  td.style.verticalAlign = 'middle';
  td.style.padding = '0';
  return td;
};

/**
 * Custom HTML cell renderer for Action column containing 3 buttons: Delete, Edit, View.
 */
export const actionButtonsRenderer = (_instance, td) => {
  td.innerHTML = `
    <div class="action-btn-group" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;position:relative;top:-12px;box-sizing:border-box;">
      <button
        type="button"
        class="action-delete-btn rt-delete-btn"
        title="Delete row"
        style="
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:28px;
          height:28px;
          padding:0;
          color:#ef4444;
          background:rgba(239,68,68,0.08);
          border:1px solid rgba(239,68,68,0.25);
          border-radius:6px;
          cursor:pointer;
          transition:all 0.15s ease;
        "
        onmouseover="this.style.background='#ef4444';this.style.color='#ffffff'"
        onmouseout="this.style.background='rgba(239,68,68,0.08)';this.style.color='#ef4444'"
      >
        <svg style="width:16px;height:16px;pointer-events:none;" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
      <button
        type="button"
        class="action-edit-btn rt-edit-btn"
        title="Edit row"
        style="
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:28px;
          height:28px;
          padding:0;
          color:#0284c7;
          background:rgba(2,132,199,0.08);
          border:1px solid rgba(2,132,199,0.25);
          border-radius:6px;
          cursor:pointer;
          transition:all 0.15s ease;
        "
        onmouseover="this.style.background='#0284c7';this.style.color='#ffffff'"
        onmouseout="this.style.background='rgba(2,132,199,0.08)';this.style.color='#0284c7'"
      >
        <svg style="width:16px;height:16px;pointer-events:none;" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
      </button>
      <button
        type="button"
        class="action-view-btn rt-view-btn"
        title="View details"
        style="
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:28px;
          height:28px;
          padding:0;
          color:#0d9488;
          background:rgba(13,148,136,0.08);
          border:1px solid rgba(13,148,136,0.25);
          border-radius:6px;
          cursor:pointer;
          transition:all 0.15s ease;
        "
        onmouseover="this.style.background='#0d9488';this.style.color='#ffffff'"
        onmouseout="this.style.background='rgba(13,148,136,0.08)';this.style.color='#0d9488'"
      >
        <svg style="width:16px;height:16px;pointer-events:none;" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
      </button>
    </div>
  `;
  td.style.textAlign = 'center';
  td.style.verticalAlign = 'middle';
  td.style.padding = '0';
  return td;
};

