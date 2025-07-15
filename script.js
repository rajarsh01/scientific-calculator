let expr = "", memory = 0, angleType = "DEG";
const expression = document.getElementById("expression");
const result = document.getElementById("result");
const keys = document.querySelectorAll(".keys button");
const deg = document.getElementById("deg");
const rad = document.getElementById("rad");
const themeSwitch = document.getElementById('themeSwitch');
const themeLabel = document.getElementById('theme-label');
const fontSizeSlider = document.getElementById('fontSize');
const btnSizeSlider = document.getElementById('btnSize');
let lastError = "";

themeSwitch.onchange = function() {
  const mode = themeSwitch.checked ? "light" : "dark";
  document.documentElement.setAttribute('data-theme', mode);
  themeLabel.textContent = themeSwitch.checked ? "Dark Mode" : "Light Mode";
  localStorage.setItem("theme", mode);
};
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeSwitch.checked = savedTheme === "light";
    themeLabel.textContent = themeSwitch.checked ? "Dark Mode" : "Light Mode";
  }
  fontSizeSlider.value = localStorage.getItem('fontSize') || 24;
  btnSizeSlider.value = localStorage.getItem('btnSize') || 48;
  document.documentElement.style.setProperty('--font-size', fontSizeSlider.value + 'px');
  document.documentElement.style.setProperty('--btn-height', btnSizeSlider.value + 'px');
});

fontSizeSlider.oninput = function() {
  document.documentElement.style.setProperty('--font-size', this.value + "px");
  localStorage.setItem('fontSize', this.value);
}
btnSizeSlider.oninput = function() {
  document.documentElement.style.setProperty('--btn-height', this.value + "px");
  localStorage.setItem('btnSize', this.value);
}

deg.onclick = function() {
  angleType = "DEG";
  deg.classList.add("active"); deg.setAttribute("aria-pressed", "true");
  rad.classList.remove("active"); rad.setAttribute("aria-pressed", "false");
}
rad.onclick = function() {
  angleType = "RAD";
  rad.classList.add("active"); rad.setAttribute("aria-pressed", "true");
  deg.classList.remove("active"); deg.setAttribute("aria-pressed", "false");
}

function haptic() {
  if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
}

function factorial(n) {
  if (n % 1 !== 0) throw "Factorial only defined for integers!";
  if (n < 0 || n > 170) throw "Out of range! n >= 0, n <= 170";
  return n <= 1 ? 1 : n * factorial(n - 1);
}
function precSafe(n) { return Math.round(n * 1e12) / 1e12; }
function trig(fn, v) {
  if (angleType === "DEG") v = v * Math.PI / 180;
  switch (fn) {
    case "sin": return Math.sin(v);
    case "cos": return Math.cos(v);
    case "tan": return Math.tan(v);
    default: return v;
  }
}
function safeEval(s) {
  s = s.replace(/(\d+)!/g, (_, n) => `factorial(${n})`)
       .replace(/sin\(/g, "trig('sin',")
       .replace(/cos\(/g, "trig('cos',")
       .replace(/tan\(/g, "trig('tan',")
       .replace(/log10\(/g, "Math.log10(")
       .replace(/ln\(/g, "Math.log(")
       .replace(/log\(/g, "Math.log10(")
       .replace(/√\(/g, "Math.sqrt(")
       .replace(/π/g, "Math.PI")
       .replace(/e/g, "Math.E")
       .replace(/\^/g, "**");
  return Function("factorial,trig", `"use strict"; return (${s})`)(factorial, trig);
}

function show() {
  expression.value = expr || "0";
  clearError();
  if (!expr) {
    result.value = "";
    return;
  }
  let incomplete =
    /[+\-*/^.]$/.test(expr) ||
    /\($/.test(expr) ||
    expr.split('(').length > expr.split(')').length;
  if (incomplete) {
    result.value = "";
    return;
  }
  try {
    let res = safeEval(expr);
    if (!Number.isFinite(res)) throw "Result not finite";
    result.value = precSafe(res);
    clearError();
  } catch (e) {
    result.value = "";
    clearError();
  }
}

function showError(msg) {
  result.classList.add('error');
  expression.classList.add('error');
  result.setAttribute('aria-live', 'assertive');
  result.setAttribute('aria-label', 'Result. Error: ' + msg);
  result.value = msg;
  lastError = msg;
}
function clearError() {
  result.classList.remove('error');
  expression.classList.remove('error');
  result.setAttribute('aria-live', 'polite');
  result.setAttribute('aria-label', 'Result');
  lastError = "";
}

function handleInput(v) {
  if (result.value.includes("Error")) expr = "";
  if (v === "=") {
    let openP = (expr.match(/\(/g) || []).length,
        closeP = (expr.match(/\)/g) || []).length;
    if (openP !== closeP) {
      showError("Mismatched parentheses");
      return;
    }
    if (
      /[+\-*/^.]$/.test(expr) ||
      /\($/.test(expr)
    ) {
      showError("Incomplete expression");
      return;
    }
    try {
      expr = safeEval(expr).toString();
      clearError();
    } catch (e) {
      showError(typeof e === "string" ? e : "Syntax Error");
    }
  } else if ("0123456789".includes(v) || v === ".") {
    expr += v;
  } else if (["+", "-", "*", "/", "^", "(", ")", "%"].includes(v)) {
    expr += v;
  } else if (["sin(", "cos(", "tan(", "ln(", "log(", "√("].includes(v)) {
    expr += v;
  } else if (v === "π" || v === "e") {
    expr += v;
  } else if (v === "C") {
    expr = "";
    clearError();
  } else if (v === "Del") {
    expr = expr.slice(0, -1);
    clearError();
  } else if (v === "!") {
    expr += "!";
  } else if (v === "rand") {
    expr += Math.random().toString().slice(0, 8);
  } else if (v === "M+") {
    try { memory += parseFloat(result.value) || 0; } catch {}
  } else if (v === "M-") {
    try { memory -= parseFloat(result.value) || 0; } catch {}
  } else if (v === "MC") {
    memory = 0;
  } else if (v === "MR") {
    expr += (memory || 0).toString();
  }
  show();
  haptic();
}

keys.forEach(btn => {
  btn.onclick = () => handleInput(btn.dataset.action);
  btn.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") handleInput(btn.dataset.action); };
});

const keyTable = {
  Enter: "=", "=": "=",
  Escape: "C", c: "C", C: "C",
  Backspace: "Del", Delete: "Del", 
  "+": "+", "-": "-", "*": "*", x: "*", X: "*", "/": "/", "^": "^", ".": ".",
  "%": "%", "(": "(", ")": ")",
  "s": "sin(", "S": "sin(",
  "l": "ln(", "L": "ln(",
  "g": "log(", "G": "log(",
  "r": "√(", "R": "√(",
  "t": "tan(", "T": "tan(",
  "p": "π", "P": "π",
  "e": "e", "E": "e",
  "f": "!", "F": "!",
  "!": "!", 
};

document.addEventListener('keydown', function(e) {
  if ((e.key >= "0" && e.key <= "9") || e.key === ".") return handleInput(e.key);
  if (keyTable[e.key] !== undefined) return handleInput(keyTable[e.key]);
  if (e.key === "m") return handleInput("MR");
  if (e.key === "M") return handleInput("M+");
  if (e.key === "n") return handleInput("M-");
  if (["ArrowDown","ArrowUp","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
});

[deg, rad, themeSwitch, ...keys].forEach(el => {el.tabIndex = 0;});
show();
