/*
 * Calculator logic.
 * State: current (what is typed), previous + operator (pending operation),
 * waitingForNewValue (an operator was just chosen), justEvaluated (= was pressed).
 * fitValue() only resizes the on-screen text; it never changes any number.
 */
(function () {
  'use strict';

  const valueEl = document.getElementById('value');
  const historyEl = document.getElementById('history');
  const keys = Array.from(document.querySelectorAll('.key'));

  const MAX_DIGITS = 12;

  let current = '0';
  let previous = null;
  let operator = null;
  let waitingForNewValue = false;
  let justEvaluated = false;

  function render() {
    valueEl.textContent = formatForDisplay(current);
    historyEl.textContent = previous !== null && operator
      ? `${formatForDisplay(previous)} ${operator}`
      : '\u00A0';

    keys.forEach((k) => k.classList.remove('is-selected'));
    if (operator) {
      const opKey = keys.find((k) => k.dataset.op === operator);
      if (opKey && waitingForNewValue) opKey.classList.add('is-selected');
    }

    fitValue();
  }

  // Shrink the big number just enough to stay inside the display
  // (long results such as 123,456,789,012 used to be cut off).
  function fitValue() {
    valueEl.style.fontSize = '';
    const available = valueEl.clientWidth;
    const needed = valueEl.scrollWidth;
    if (available > 0 && needed > available) {
      const base = parseFloat(getComputedStyle(valueEl).fontSize);
      valueEl.style.fontSize = Math.floor((base * available / needed) * 100) / 100 + 'px';
    }
  }

  function formatForDisplay(numStr) {
    if (numStr === 'Error') return 'Error';
    const negative = numStr.startsWith('-');
    let n = negative ? numStr.slice(1) : numStr;
    let [intPart, decPart] = n.split('.');
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    let result = decPart !== undefined ? `${intPart}.${decPart}` : intPart;
    return (negative ? '-' : '') + result;
  }

  function inputDigit(d) {
    if (justEvaluated) {
      current = d === '0' ? '0' : d;
      previous = null;
      operator = null;
      justEvaluated = false;
      waitingForNewValue = false;
      render();
      return;
    }
    if (waitingForNewValue) {
      current = d;
      waitingForNewValue = false;
      render();
      return;
    }
    const digitsOnly = current.replace('-', '').replace('.', '');
    if (digitsOnly.length >= MAX_DIGITS) return;

    current = current === '0' ? d : current + d;
    render();
  }

  function inputDecimal() {
    if (justEvaluated) {
      current = '0.';
      previous = null;
      operator = null;
      justEvaluated = false;
      waitingForNewValue = false;
      render();
      return;
    }
    if (waitingForNewValue) {
      current = '0.';
      waitingForNewValue = false;
      render();
      return;
    }
    if (!current.includes('.')) {
      current += '.';
      render();
    }
  }

  function chooseOperator(op) {
    if (current === 'Error') return;
    justEvaluated = false;

    if (operator && waitingForNewValue) {
      operator = op;
      render();
      return;
    }

    if (previous !== null && !waitingForNewValue) {
      const result = compute(previous, current, operator);
      if (result === null) {
        showError();
        return;
      }
      previous = result;
      current = result;
    } else {
      previous = current;
    }

    operator = op;
    waitingForNewValue = true;
    render();
  }

  function compute(a, b, op) {
    const x = parseFloat(a);
    const y = parseFloat(b);
    let result;
    switch (op) {
      case '+': result = x + y; break;
      case '−': result = x - y; break;
      case '×': result = x * y; break;
      case '÷':
        if (y === 0) return null;
        result = x / y;
        break;
      default: return b;
    }
    if (!isFinite(result)) return null;
    return trimResult(result);
  }

  function trimResult(num) {
    let str = num.toPrecision(12);
    if (str.includes('.')) {
      str = str.replace(/0+$/, '').replace(/\.$/, '');
    }
    if (Math.abs(num) < 1e-12) str = '0';
    return parseFloat(str).toString();
  }

  function equals() {
    if (current === 'Error') return;
    if (operator === null || previous === null) return;
    const operand = waitingForNewValue ? previous : current;
    const result = compute(previous, operand, operator);
    if (result === null) {
      showError();
      return;
    }
    previous = null;
    current = result;
    operator = null;
    waitingForNewValue = false;
    justEvaluated = true;
    render();
  }

  function clearAll() {
    current = '0';
    previous = null;
    operator = null;
    waitingForNewValue = false;
    justEvaluated = false;
    render();
  }

  function backspace() {
    if (justEvaluated || current === 'Error') {
      clearAll();
      return;
    }
    if (waitingForNewValue) return;
    if (current.length <= 1 || (current.length === 2 && current.startsWith('-'))) {
      current = '0';
    } else {
      current = current.slice(0, -1);
    }
    render();
  }

  function negate() {
    if (current === 'Error') return;
    if (current === '0') return;
    current = current.startsWith('-') ? current.slice(1) : '-' + current;
    waitingForNewValue = false;
    render();
  }

  function percent() {
    if (current === 'Error') return;
    const val = parseFloat(current) / 100;
    current = trimResult(val);
    render();
  }

  function showError() {
    current = 'Error';
    previous = null;
    operator = null;
    waitingForNewValue = false;
    justEvaluated = true;
    render();
  }

  function handleKeyAction(key) {
    const { num, op, action } = key.dataset;
    if (num !== undefined) inputDigit(num);
    else if (op !== undefined) chooseOperator(op);
    else if (action === 'decimal') inputDecimal();
    else if (action === 'equals') equals();
    else if (action === 'clear') clearAll();
    else if (action === 'negate') negate();
    else if (action === 'percent') percent();
  }

  function pressAnimate(key) {
    key.classList.add('is-active');
    setTimeout(() => key.classList.remove('is-active'), 120);
  }

  keys.forEach((key) => {
    key.addEventListener('click', () => {
      handleKeyAction(key);
    });
  });

  // Keyboard shortcut -> selector of the on-screen key it triggers
  const keyMap = {
    '.': '[data-action="decimal"]',
    '+': '[data-op="+"]',
    '-': '[data-op="−"]',
    '*': '[data-op="×"]',
    'x': '[data-op="×"]',
    '/': '[data-op="÷"]',
    '%': '[data-action="percent"]',
    'Enter': '[data-action="equals"]',
    '=': '[data-action="equals"]',
    'Escape': '[data-action="clear"]',
  };
  for (let d = 0; d <= 9; d++) keyMap[String(d)] = `[data-num="${d}"]`;

  function findKey(selector) {
    return document.querySelector(selector);
  }

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;

    if (e.key === 'Backspace') {
      backspace();
      const clearKey = findKey('[data-action="clear"]');
      if (clearKey) pressAnimate(clearKey);
      e.preventDefault();
      return;
    }

    const selector = keyMap[e.key];
    if (!selector) return;

    const key = findKey(selector);
    if (!key) return;

    e.preventDefault();
    handleKeyAction(key);
    pressAnimate(key);
  });

  window.addEventListener('resize', fitValue);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitValue);

  render();
})();
