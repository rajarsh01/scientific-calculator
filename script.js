let expr = "", memory = 0, angleType = "DEG";
const expression = document.getElementById("expression");
const result = document.getElementById("result");
const keys = document.querySelectorAll(".keys button");
const deg = document.getElementById("deg");
const rad = document.getElementById("rad");

// Toggle angle mode
deg.onclick = () => { angleType = "DEG"; deg.classList.add("active"); rad.classList.remove("active"); };
rad.onclick = () => { angleType = "RAD"; rad.classList.add("active"); deg.classList.remove("active"); };

function safeEval(s) {
  // eslint-disable-next-line
  return Function('"use strict";return ('+s+')')();
}

function parseConstants(x) {
  return x.replace(/π/g, "Math.PI")
          .replace(/e/g, "Math.E");
}

function trigFn(fn, v) {
  const t = angleType === "DEG" ? (v * Math.PI/180) : v;
  switch(fn) {
    case 'sin': return Math.sin(t);
    case 'cos': return Math.cos(t);
    case 'tan': return Math.tan(t);
    case 'asin': return angleType==="DEG"?Math.asin(v)*180/Math.PI:Math.asin(v);
    case 'acos': return angleType==="DEG"?Math.acos(v)*180/Math.PI:Math.acos(v);
    case 'atan': return angleType==="DEG"?Math.atan(v)*180/Math.PI:Math.atan(v);
    // Add hyperbolic if needed
    default: return 0;
  }
}

function display() {
  expression.value = expr || "0";
  result.value = (() => {
    try {
      if (!expr) return "";
      let s = expr
        .replace(/(\d+)!/g, (m, n) => factorial(+n))
        .replace(/sin\(/g, "trigFn('sin',")
        .replace(/cos\(/g, "trigFn('cos',")
        .replace(/tan\(/g, "trigFn('tan',")
        .replace(/ln\(/g, "Math.log(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/√/g, "Math.sqrt")
        .replace(/(\d+)\^/g, "$1**")
        .replace(/π/g, "Math.PI")
        .replace(/e/g, "Math.E");
      return safeEval(s);
    } catch {
      return "";
    }
  })();
}

function factorial(n) { return n<=1?1:n*factorial(n-1); }

keys.forEach(btn => {
  btn.onclick = () => {
    const v = btn.dataset.action;
    if (v === "=") {
      try { expr = result.value.toString(); } catch { expr = "Error"; }
    } else if (["+", "-", "*", "/", "^", "(", ")", ".", "%"].includes(v) || !isNaN(Number(v))) {
      expr += v;
    } else if (["sin","cos","tan","log","ln","√"].includes(v)) {
      expr += v + "(";
    } else if (v === "π" || v === "e") {
      expr += v;
    } else if (v === "C") {
      expr = "";
    } else if (v === "Del") {
      expr = expr.slice(0, -1);
    } else if (v === "!") {
      expr += "!";
    } else if (v === "rand") {
      expr += Math.random().toString();
    } else if (v === "M+") {
      try { memory += parseFloat(result.value); } catch {}
    } else if (v === "M-") {
      try { memory -= parseFloat(result.value); } catch {}
    } else if (v === "MC") {
      memory = 0;
    } else if (v === "MR") {
      expr += memory.toString();
    }
    display();
  };
});

display();
