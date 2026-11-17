// src/components/tables/AppHotTable.jsx
// ============================================================================
// PURPOSE:
//   AppHotTable enterprise data grid component wrapping HandsontableSheet.
//   Provides full support for parent-controlled flexible Actions column,
//   infinite scrolling, sorting, filtering, and custom cell renderers.
// ============================================================================

import React, { forwardRef } from 'react';
import { HandsontableSheet } from './HandsontableSheet';

export const AppHotTable = forwardRef(function AppHotTable(props, ref) {
  return <HandsontableSheet ref={ref} {...props} />;
});

export default AppHotTable;
