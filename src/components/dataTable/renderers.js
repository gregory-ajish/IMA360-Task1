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
