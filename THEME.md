# EPL Predictor Theme

- **Colour roles:** `ink` (`#1b2433`) is all text and UI chrome. `edge` is the near-black structural border. `border` (`#d9e0ea`) is the soft row-level rule. `rule-strong` is the stronger chart/table rule. `surface` is the page background (`#f6f8fb`), `white` is the default card surface, and `tint` is for nested panels, state messages, hover states, and the footer. Outcome colours, better/worse colours and their soft tints, and the Lean, Neural, and Linear goals model colours remain distinct data signals.
- **Chrome rule:** near-black is UI chrome only. Never recolour outcome bars, outcome labels, table data, better/worse states, or model colours. Violet is not used.
- **Radius:** cards use `rounded-card` (`1rem`); buttons, tabs, inputs, selects, tooltips, and compact labels use `rounded-button` (`0.625rem`); existing status and outcome pills use `rounded-full`.
- **Borders:** `border-edge` marks structural lines: cards, controls, header/footer rules, card dividers, and summary/table outer rules. `border-border` remains for row separators, table headers, chart gridlines/axes, waterfall steps, stats column rules, and empty outcome tracks.
- **Buttons:** `Button` and `LinkButton` share primary and secondary variants. Primary is near-black filled with white text and a lighter near-black hover; secondary is white with a near-black border and ink text. Keep 48px minimum tap targets and use at most one primary per screen.
- **Cards:** `Card` defaults to a white surface; use `variant="tint"` only for nested panels or state surfaces.
- **Tabs and links:** active tabs are near-black filled pills; inactive tabs are muted with a light tint hover. The model order is Track record, Lean, Neural network, Linear goals, Season outlook, with the outlook pushed right from `sm` upward. Inline links are ink, underlined, and use an ink decoration.
- **Typography:** Archivo is used for text and headings. DM Mono with tabular numbers is used for figures.
- **Motion:** Existing 200–700ms ease-out transitions and animations remain, with capped stagger. `prefers-reduced-motion` overrides are respected.
- **Mobile:** Design for about 380px first. Interactive controls target 48px. Wide tables scroll sideways rather than compressing their columns.
- **Tone:** Honest and hedged. This is a learning project, not betting advice; never imply a model beats the bookmaker.
- **Do:** Keep labels beside colour signals, preserve data roles, and use the shared button styles. **Don’t:** add violet, make colour the only signal, recolour outcome/model colours, add a featured/best model badge, or imply predictive superiority.
