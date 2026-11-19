# Calculator

A clean, keyboard-friendly calculator built with plain HTML, CSS and JavaScript. No framework, no build step.

## Run
Open `index.html` in any browser.

## Structure
```
calculator/
  index.html
  README.md
  assets/
    favicon.svg
    fonts/            DM Sans, JetBrains Mono (self-hosted, OFL)
  css/
    fonts.css         @font-face rules
    theme.css         colours only, change the look here
    style.css         layout and components
  js/
    calculator.js     all logic
```

## Keyboard
0-9 and . to type, + - * / for operators, % for percent, Enter for equals, Backspace to delete, Esc to clear.

## Notes
Long results now shrink to fit the display instead of being clipped (`fitValue` in `calculator.js`).
