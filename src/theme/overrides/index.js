// overrides/index.js
// ─── Component Overrides Index ────────────────────────────────────────────────

import { getButtonOverrides } from './button';
import { getTextFieldOverrides } from './textField';
import { getCardOverrides } from './card';
import { getChipOverrides } from './chip';
import { getAppBarOverrides } from './appBar';

export const getComponentOverrides = (mode) => ({
  ...getButtonOverrides(),
  ...getTextFieldOverrides(mode),
  ...getCardOverrides(mode),
  ...getChipOverrides(),
  ...getAppBarOverrides(),
});
