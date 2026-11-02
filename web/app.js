"use strict";
/* ReembolsaYa — prototipo de demostración (AseguraTech26).
   RegTech para seguros de salud: de la puerta de la clínica hasta que te pagan.
   Personas, clínicas, aseguradoras, montos y precios de referencia son ficticios o ilustrativos. */

// ---------------------------------------------------------------------------
// Datos de la demo
// ---------------------------------------------------------------------------
const POLIZA = { aseguradora: "Seguros Tepuy", numero: "HCM-2026-118204", titular: "Carlos Mendoza", cedula: "V-18.***.***", suma: 24000, usadoBase: 5550, deducible: 500, plazo: 15 };
const TASA = 61.0; // Bs por USD, ilustrativa
const CLINICAS = ["Clínica Ejemplo Caracas", "Policlínica Demo Valencia", "Centro Médico Muestra Maracay"];
const MOTIVOS = ["Dicen que la aseguradora les debe", "Exigen pago por adelantado aunque tengo carta aval", "No reconocen mi póliza", "Otro"];

const SEMILLA = () => ({
  v: 1,
  vista: "clinica",           // paso activo del paciente
  carta: null,                // carta aval { n, monto, min }
  negativa: null,             // { paso, clinica, motivo, n }
  reem: { etapa: "inicio", recipe: false },
  chat: [],
  casos: [
    { id: "RY-2026-0402", que: "Resonancia de rodilla + consulta", monto: 380, dias: 19, estado: "En revisión", alerta: "Plazo vencido", reclamo: false },
    { id: "RY-2026-0388", que: "Exámenes de laboratorio", monto: 95, dias: 6, estado: "Pagado", alerta: "" },
    { id: "RY-2026-0371", que: "Fisioterapia (6 sesiones)", monto: 240, dias: 9, estado: "Aprobado", alerta: "" },
  ],
  bandeja: [
    { id: "RY-2026-0417", quien: "M. P.", que: "Consulta de cardiología", monto: 90, completo: true, alerta: "", estado: "Recibido" },
    { id: "RY-2026-0416", quien: "J. R.", que: "Ecografía abdominal", monto: 140, completo: true, alerta: "Factura duplicada", estado: "Recibido" },
    { id: "RY-2026-0402", quien: "C. M.", que: "Resonancia de rodilla + consulta", monto: 380, completo: true, alerta: "Plazo vencido", estado: "En revisión" },
    { id: "RY-2026-0399", quien: "L. G.", que: "Honorarios de cirugía menor", monto: 1450, completo: true, alerta: "Honorarios altos", estado: "En revisión" },
    { id: "RY-2026-0395", quien: "A. S.", que: "Medicamentos", monto: 62, completo: true, alerta: "", estado: "Aprobado" },
  ],
  negativas: 57,
  admision: null,             // vista clínica: { codigo, estado }
});

// ---------------------------------------------------------------------------
// Estado y utilidades
// ---------------------------------------------------------------------------
const CLAVE = "reembolsaya_demo";
let S = cargar();
function cargar() { try { const s = JSON.parse(localStorage.getItem(CLAVE)); if (s && s.v === SEMILLA().v) return s; } catch { /* */ } return SEMILLA(); }
function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch { /* */ } }
function set(c) { Object.assign(S, c); guardar(); render(); }
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const usd = (n) => "$" + Number(n).toLocaleString("es-VE", { maximumFractionDigits: 0 });
const bs = (n) => "Bs " + Number(n).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hhmm = () => new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", hour12: false });
function aleatorio(n) { const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
function toast(m) { document.querySelectorAll(".toast").forEach((t) => t.remove()); const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }
function usado() { return POLIZA.usadoBase + S.casos.filter((c) => c.estado === "Pagado" && !["RY-2026-0388"].includes(c.id)).reduce((a, c) => a + c.monto, 0); }
function chipEstado(e) { return `<span class="chip ${{ Pagado: "ok", Aprobado: "info", "En revisión": "warn", Recibido: "neutro", Enviado: "neutro" }[e] || "neutro"}">${e}</span>`; }

// QR ilustrativo
function qr(codigo, tam = 160) {
  const N = 25; let h = 2166136261;
  for (const c of codigo) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
  const enF = (x, y) => [[0, 0], [N - 7, 0], [0, N - 7]].some(([a, b]) => x >= a - 1 && x < a + 8 && y >= b - 1 && y < b + 8);
  let r = "";
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!enF(x, y) && rnd() > 0.5) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  const f = (a, b) => `<rect x="${a}" y="${b}" width="7" height="7"/><rect x="${a + 1}" y="${b + 1}" width="5" height="5" fill="#fff"/><rect x="${a + 2}" y="${b + 2}" width="3" height="3"/>`;
  return `<svg width="${tam}" height="${tam}" viewBox="-1 -1 ${N + 2} ${N + 2}" shape-rendering="crispEdges" fill="#111">${f(0, 0)}${f(N - 7, 0)}${f(0, N - 7)}${r}</svg>`;
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------
function ruta() { return (location.hash.slice(1) || "/").replace(/^\//, "").split("?")[0]; }
function render() {
  const r = ruta();
  document.querySelectorAll("#nav a").forEach((a) => a.classList.toggle("activo", a.dataset.r === r));
  const vistas = { "": landing, paciente, clinica, aseguradora, supervisor };
  $("#app").innerHTML = (vistas[r] || landing)();
}
window.addEventListener("hashchange", () => { document.querySelectorAll(".toast").forEach((t) => t.remove()); render(); window.scrollTo(0, 0); });
$("#reiniciar").addEventListener("click", () => { S = SEMILLA(); guardar(); render(); toast("Demo reiniciada"); });

// ---------------------------------------------------------------------------
// Landing
// ---------------------------------------------------------------------------
function landing() {
  return `
  <section class="hero">
    <div class="entra">
      <span class="etq am">AseguraTech26 · Desafío 4 · RegTech</span>
      <h1>De la puerta de la clínica <mark>hasta que te pagan.</mark></h1>
      <p class="lead">ReembolsaYa pone orden en el seguro de salud: un pase digital para que la clínica vea tu cobertura al instante, la carta aval en minutos, el reembolso con una foto y un reclamo formal automático si se vence el plazo. Y el supervisor, por fin, ve dónde se traba todo.</p>
      <div class="ctas"><a class="btn am lg" href="#/paciente">Probar como paciente →</a><a class="btn lg" href="#/supervisor">Ver panel del supervisor</a></div>
    </div>
    <div class="collage entra" style="animation-delay:.1s">
      <div class="caja" style="left:20px;top:10px;width:300px;transform:rotate(-2deg)"><span class="etq me">Pase de salud</span><div class="fila" style="margin-top:12px">${qr("RY-PASE-DEMO", 90)}<div><b style="font-size:18px">Póliza vigente</b><div class="sub">Disponible ${usd(18450)}</div></div></div></div>
      <div class="caja amarilla" style="right:10px;top:120px;width:280px;transform:rotate(2.5deg)"><span class="etq">Carta aval</span><div style="font-size:30px;font-weight:900;margin-top:8px">12 min</div><div class="sub" style="color:#111">aprobada, sin llamadas ni colas</div></div>
      <div class="caja rosa" style="left:40px;top:250px;width:290px;transform:rotate(1.5deg)"><span class="etq">Reembolso</span><div style="font-weight:850;margin-top:8px">📸 Una foto de la factura</div><div class="sub" style="color:#111">La IA lee el RIF, el n.º de control y el monto en bolívares y dólares.</div></div>
      <span class="pegatina" style="right:40px;top:360px;background:var(--menta);transform:rotate(-6deg)">Pagado ✓</span>
    </div>
  </section>
  <section class="seccion">
    <span class="etq ro">El problema</span>
    <h2 class="grande">Tener seguro de salud no garantiza que te atiendan, ni que te paguen a tiempo.</h2>
    <div class="grid3" style="margin-top:22px">
      <div class="caja"><div class="dato">6 %</div><p>de los venezolanos tiene una póliza de salud. Quien la tiene la cuida como un tesoro… hasta que la necesita.</p><div class="fuente">Finanzas Digital, abril 2026</div></div>
      <div class="caja"><div class="dato">Te dejan en la puerta</div><p>El Ministerio Público anunció en 2023 una investigación a clínicas que se negaban a atender a asegurados al día con sus cuotas.</p><div class="fuente">NTN24 / Ministerio Público, agosto 2023</div></div>
      <div class="caja"><div class="dato">1 PDF</div><p>Así se pide hoy un reembolso: escanear todo en un solo archivo, enviarlo por correo y esperar. Si falta un papel, empieza de nuevo.</p><div class="fuente">Instructivos de aseguradoras y corredores</div></div>
    </div>
  </section>
  <section class="seccion">
    <span class="etq ce">La solución</span>
    <h2 class="grande">Un solo recorrido, cinco momentos.</h2>
    <div class="viaje">
      <div style="background:var(--menta)"><span class="n">01</span><b>En la puerta</b><p>Pase digital: la clínica ve la póliza vigente y el saldo.</p></div>
      <div style="background:var(--amarillo)"><span class="n">02</span><b>Carta aval</b><p>Presupuesto claro: qué cubre el seguro y qué pagas tú.</p></div>
      <div style="background:var(--rosa)"><span class="n">03</span><b>Reembolso con foto</b><p>La IA lee y valida antes de enviar.</p></div>
      <div style="background:var(--celeste)"><span class="n">04</span><b>Seguimiento</b><p>Cuenta regresiva del plazo de la póliza.</p></div>
      <div style="background:var(--lila)"><span class="n">05</span><b>Reclamo formal</b><p>Si se vence, sale listo con un toque.</p></div>
    </div>
  </section>
  <section class="seccion">
    <span class="etq li">Prueba el prototipo</span>
    <h2 class="grande">Cuatro miradas al mismo sistema.</h2>
    <div class="grid4" style="margin-top:22px">
      <a class="caja" style="text-decoration:none" href="#/paciente"><div style="font-size:30px">🙋‍♂️</div><h2 class="sec" style="margin-top:8px">Paciente</h2><p class="sub">Pase, carta aval, reembolso con foto, plazos y reclamo formal.</p></a>
      <a class="caja" style="text-decoration:none" href="#/clinica"><div style="font-size:30px">🏥</div><h2 class="sec" style="margin-top:8px">Clínica</h2><p class="sub">Admisión con el pase y carta aval en minutos.</p></a>
      <a class="caja" style="text-decoration:none" href="#/aseguradora"><div style="font-size:30px">🏢</div><h2 class="sec" style="margin-top:8px">Aseguradora</h2><p class="sub">Casos completos, duplicados y sobrecobros detectados.</p></a>
      <a class="caja" style="text-decoration:none" href="#/supervisor"><div style="font-size:30px">🔎</div><h2 class="sec" style="margin-top:8px">Supervisor</h2><p class="sub">Tiempos de pago, negativas de atención y sobrecobros, en datos agregados.</p></a>
    </div>
  </section>
  <footer class="pie"><span>ReembolsaYa · Prototipo para AseguraTech26 (SUDEASEG) · Noviembre de 2026</span><span>ReembolsaYa es software: no vende seguros ni intermedia. El riesgo sigue en la aseguradora y la relación con el cliente, en su corredor.</span></footer>`;
}

// ---------------------------------------------------------------------------
// Paciente
// ---------------------------------------------------------------------------
const PASOS = [
  ["clinica", "En la clínica"], ["presupuesto", "Presupuesto y carta aval"], ["reembolso", "Reembolso con foto"], ["casos", "Mis casos"], ["cubre", "¿Me cubre?"],
];
function paciente() {
  const u = usado(), disp = POLIZA.suma - u;
  const vencido = S.casos.some((c) => c.alerta === "Plazo vencido" && !c.reclamo);
  return `
  <div class="contenedor"><div class="app">
    <aside class="lateral pila">
      <div class="caja">
        <div class="perfil"><span class="av">CM</span><div><b>${POLIZA.titular}</b><div class="sub">${POLIZA.aseguradora} · HCM</div></div></div>
        <div class="saldo"><div class="entre"><span class="sub">Usado</span><b>${usd(u)} de ${usd(POLIZA.suma)}</b></div>
          <div class="barra-saldo"><i style="width:${(u / POLIZA.suma) * 100}%"></i></div>
          <div class="entre"><span class="sub">Disponible</span><b style="font-size:20px">${usd(disp)}</b></div></div>
        <ul class="pasos">${PASOS.map(([k, t], i) => `<li><button class="${S.vista === k ? "on" : ""}" data-vista="${k}"><span class="n">${i + 1}</span>${t}${k === "casos" && vencido ? '<span class="alerta" title="Plazo vencido"></span>' : ""}</button></li>`).join("")}</ul>
      </div>
      <div class="caja amarilla"><b>Así se usa la demo</b><p class="sub" style="color:#111;margin-top:4px">Recorre los pasos en orden. Lo que hagas llega a las vistas de clínica, aseguradora y supervisor.</p></div>
    </aside>
    <section class="entra" key="${S.vista}">${{ clinica: vClinica, presupuesto: vPresupuesto, reembolso: vReembolso, casos: vCasos, cubre: vCubre }[S.vista]()}</section>
  </div></div>`;
}

function vClinica() {
  const n = S.negativa;
  let neg = "";
  if (!n) neg = `<button class="btn ro" data-acc="negativa">🚫 Me negaron la atención</button>`;
  else if (n.paso === 1) {
    neg = `<div class="caja rosa entra"><h2 class="sec">¿Dónde y por qué?</h2>
      <label class="sub" style="color:#111;font-weight:700">Clínica</label>
      <select class="btn bloque" id="neg-clinica" style="justify-content:flex-start;margin:6px 0 12px">${CLINICAS.map((c) => `<option>${c}</option>`).join("")}</select>
      <label class="sub" style="color:#111;font-weight:700">Motivo que te dieron</label>
      <div style="margin-top:6px">${MOTIVOS.map((m, i) => `<label class="doc" style="cursor:pointer"><input type="radio" name="motivo" value="${esc(m)}" ${i === 0 ? "checked" : ""}> ${m}</label>`).join("")}</div>
      <div class="fila" style="margin-top:14px"><button class="btn ne" data-acc="neg-enviar">Registrar y avisar</button><button class="btn" data-acc="neg-cancelar">Cancelar</button></div></div>`;
  } else {
    neg = `<div class="caja menta entra"><span class="etq">Registro ${n.n}</span><h2 class="sec" style="margin-top:10px">Quedó registrado a las ${n.hora}</h2>
      <div class="linea"><span>Clínica</span><b>${esc(n.clinica)}</b></div><div class="linea"><span>Motivo</span><b>${esc(n.motivo)}</b></div>
      <div class="linea"><span>Aviso a ${POLIZA.aseguradora}</span><b>✓ enviado</b></div><div class="linea"><span>Datos al supervisor</span><b>✓ anónimos</b></div>
      <h2 class="sec" style="margin-top:14px">Clínicas con convenio cerca</h2>
      <div class="doc"><span class="ic">🏥</span><div><b>Policlínica Demo Valencia</b><div class="sub">Convenio activo · aceptó 98 % de pases este mes</div></div></div>
      <div class="doc"><span class="ic">🏥</span><div><b>Centro Médico Muestra Maracay</b><div class="sub">Convenio activo · carta aval promedio 14 min</div></div></div>
      <button class="btn sm" style="margin-top:12px" data-acc="neg-cancelar">Cerrar</button></div>`;
  }
  return `
    <span class="etq me">Paso 1</span><h1 class="titulo">Tu pase de salud</h1>
    <p class="sub" style="font-size:15.5px">Muéstralo en la admisión. La clínica ve al instante que tu póliza está vigente, tu saldo y si ya tienes carta aval. Así no hay excusa para dejarte en la puerta.</p>
    <div class="ticket pase" style="margin-top:20px">
      <div>
        <span class="chip ok">● Póliza vigente</span>
        <div style="font-size:28px;font-weight:900;letter-spacing:-.03em;margin-top:10px">${POLIZA.titular}</div>
        <div class="linea"><span>Aseguradora</span><b>${POLIZA.aseguradora}</b></div>
        <div class="linea"><span>Póliza</span><b class="mono">${POLIZA.numero}</b></div>
        <div class="linea"><span>Disponible</span><b>${usd(POLIZA.suma - usado())}</b></div>
        <div class="linea"><span>Carta aval</span><b>${S.carta ? `<span class="chip ok">${S.carta.n} · ${usd(S.carta.monto)}</span>` : `<span class="chip neutro">Sin carta aval activa</span>`}</b></div>
      </div>
      <div class="qr">${qr("RY-PASE-" + POLIZA.numero)}<div class="mono" style="font-weight:800;margin-top:6px">RY-PASE-7K2M</div></div>
    </div>
    <div class="grid2" style="margin-top:22px;align-items:start">
      <div class="caja"><h2 class="sec">🚑 ¿Es una emergencia?</h2><p class="sub">La clínica puede pedir la carta aval desde su pantalla con tu pase. No tienes que llamar a nadie.</p><a class="btn am" style="margin-top:12px" href="#/clinica">Ver la pantalla de la clínica →</a></div>
      <div class="caja"><h2 class="sec">🚫 ¿No te quisieron atender?</h2><p class="sub">Regístralo en un minuto. Avisamos a tu aseguradora, te mostramos clínicas con convenio y el caso suma (anónimo) al panel del supervisor.</p><div style="margin-top:12px">${neg}</div></div>
    </div>`;
}

function vPresupuesto() {
  const items = [["Honorarios del cirujano", 2900, "Alto para la zona (ref. $1.800–2.300)"], ["Anestesiología", 600, ""], ["Pabellón y hospitalización (2 días)", 2400, ""], ["Material e injerto", 900, ""]];
  return `
    <span class="etq am">Paso 2</span><h1 class="titulo">Presupuesto antes de operarte</h1>
    <p class="sub" style="font-size:15.5px">Carlos necesita una reconstrucción de ligamento cruzado. Sube el presupuesto y ReembolsaYa le dice qué cubre la póliza, qué paga él y qué está caro.</p>
    <div class="grid2" style="margin-top:20px;align-items:start">
      <div class="caja"><h2 class="sec">📄 Presupuesto de la clínica</h2>
        ${items.map(([t, m, a]) => `<div class="linea"><span>${t}${a ? `<br><span class="chip warn" style="margin-top:4px">⚠ ${a}</span>` : ""}</span><b>${usd(m)}</b></div>`).join("")}
        <div class="linea" style="font-size:17px"><b>Total</b><b>${usd(6800)}</b></div></div>
      <div class="pila">
        <div class="caja menta"><div class="sub" style="color:#111;font-weight:700">Lo que cubre tu póliza</div><div style="font-size:44px;font-weight:900;letter-spacing:-.04em">${usd(5900)}</div></div>
        <div class="caja rosa"><div class="sub" style="color:#111;font-weight:700">Lo que pagas tú</div><div style="font-size:44px;font-weight:900;letter-spacing:-.04em">${usd(900)}</div><div class="sub" style="color:#111">Deducible ${usd(500)} + diferencia de habitación superior ${usd(400)}</div></div>
        ${S.carta ? `<div class="caja amarilla entra"><span class="etq">Carta aval ${S.carta.n}</span><div style="font-size:24px;font-weight:900;margin-top:8px">Aprobada por ${usd(S.carta.monto)}</div><div class="sub" style="color:#111">Respuesta en ${S.carta.min} minutos · ya aparece en tu pase y en la clínica</div></div>`
          : `<button class="btn am lg bloque" data-acc="carta">Pedir carta aval por ${usd(5900)}</button>`}
        <div class="caja"><b>💡 Sugerencia</b><p class="sub">Los honorarios están por encima de la referencia de la zona. Puedes pedir a tu corredor que los negocie antes de operarte.</p></div>
      </div>
    </div>`;
}

function vReembolso() {
  const r = S.reem;
  let cuerpo = "";
  if (r.etapa === "inicio") {
    cuerpo = `<div class="zona-foto"><div style="font-size:44px">📸</div><h2 class="sec" style="justify-content:center;margin-top:6px">Toma una foto del informe y la factura</h2><p class="sub">También funciona por WhatsApp. Aquí puedes usar documentos de ejemplo.</p>
      <button class="btn am lg" style="margin-top:14px" data-acc="foto">Usar documentos de ejemplo</button></div>`;
  } else if (r.etapa === "leyendo") {
    cuerpo = `<div class="zona-foto"><div style="font-size:44px">🤖</div><h2 class="sec" style="justify-content:center;margin-top:6px">Leyendo tus documentos…</h2><p class="sub">Buscando RIF, número de control, montos y tasa del día.</p></div>`;
  } else if (r.etapa === "leido") {
    const docs = [["Informe médico", true], ["Factura fiscal", true], ["Récipe o indicación médica", r.recipe]];
    const ok = docs.every((d) => d[1]);
    cuerpo = `<div class="grid2" style="align-items:start">
      <div class="caja"><h2 class="sec">🤖 Lo que leyó la IA</h2>
        <div class="campo"><b>Médico</b><span>Dra. Ana Rivas · Traumatología</span></div>
        <div class="campo"><b>Prestador</b><span>Clínica Ejemplo Caracas</span></div>
        <div class="campo"><b>RIF</b><span class="mono">J-50999888-1 ✓</span></div>
        <div class="campo"><b>N.º de control</b><span class="mono">00-004512 ✓ no duplicado</span></div>
        <div class="campo"><b>Fecha</b><span>28/10/2026</span></div>
        <div class="campo"><b>Monto</b><span>${bs(120 * TASA)} · tasa ${bs(TASA)} → <b>${usd(120)}</b></span></div>
        <div class="campo"><b>Concepto</b><span>Consulta de traumatología</span></div>
        <div class="doc" style="background:var(--amarillo)"><span class="ic">⚠️</span><div><b>Cobro por encima de la referencia</b><div class="sub" style="color:#111">Consulta de traumatología en la zona: $60–80. Se envía igual, con la nota para la aseguradora.</div></div></div>
      </div>
      <div class="caja"><h2 class="sec">📋 Documentos</h2>
        ${docs.map(([t, v]) => `<div class="doc" style="background:${v ? "var(--menta)" : "var(--rosa)"}"><span class="ic">${v ? "✅" : "❌"}</span><div><b>${t}</b><div class="sub" style="color:#111">${v ? "Listo y legible" : "Falta: tu póliza lo exige para consultas"}</div></div>${v ? "" : `<button class="btn sm" style="margin-left:auto" data-acc="recipe">📸 Agregar</button>`}</div>`).join("")}
        <p class="sub" style="margin-top:12px">${ok ? "Todo completo. Tu caso llega a la aseguradora sin devoluciones." : "Te avisamos ahora, no dentro de 15 días cuando te lo devuelvan."}</p>
        <button class="btn ne lg bloque" style="margin-top:12px" data-acc="enviar-reem" ${ok ? "" : "disabled"}>Enviar a ${POLIZA.aseguradora}</button>
      </div></div>`;
  } else {
    cuerpo = `<div class="caja menta entra"><span class="etq">${r.id}</span><h2 class="sec" style="margin-top:10px;font-size:26px">¡Enviado completo! 🎉</h2>
      <ul class="linea-t" style="margin-top:8px"><li class="ok"><b>Enviado</b> · hoy ${hhmm()}</li><li class="ok"><b>Recibido por ${POLIZA.aseguradora}</b> · validado sin observaciones</li><li class="ahora"><b>En revisión</b> · plazo de tu póliza: ${POLIZA.plazo} días hábiles</li><li><b>Aprobado</b></li><li><b>Pagado</b></li></ul>
      <div class="fila" style="margin-top:10px"><button class="btn" data-vista="casos">Ver mis casos</button><button class="btn" data-acc="reem-nuevo">Otro reembolso</button></div></div>`;
  }
  return `<span class="etq ro">Paso 3</span><h1 class="titulo">Tu reembolso en una foto</h1>
    <p class="sub" style="font-size:15.5px">Nada de escanear todo en un solo PDF. La IA lee los datos, verifica que no falte nada y detecta cobros fuera de lo normal antes de enviar.</p>
    <div style="margin-top:20px">${cuerpo}</div>`;
}

function vCasos() {
  const c0 = S.casos.find((c) => c.id === "RY-2026-0402");
  const carta = `Caracas, ${new Date().toLocaleDateString("es-VE")}

Señores ${POLIZA.aseguradora}
Ref.: Reclamo ${c0.id} · Póliza ${POLIZA.numero}

Han pasado ${c0.dias} días hábiles desde que entregué completos
los documentos y el reembolso por ${usd(c0.monto)} sigue sin respuesta.
La póliza establece un plazo de ${POLIZA.plazo} días hábiles.

Solicito el pago o una respuesta motivada en un plazo de
5 días hábiles. De no recibirla, acudiré a la instancia de
atención al asegurado de la SUDEASEG.

${POLIZA.titular} · ${POLIZA.cedula}`;
  return `<span class="etq ce">Paso 4</span><h1 class="titulo">Mis casos</h1>
    <p class="sub" style="font-size:15.5px">Cada caso muestra su estado y cuántos días hábiles van del plazo de la póliza.</p>
    <div class="pila" style="margin-top:20px">
      ${S.casos.map((c) => {
        const pct = Math.min(100, (c.dias / POLIZA.plazo) * 100), venc = c.dias > POLIZA.plazo && c.estado !== "Pagado";
        return `<div class="caja ${venc && !c.reclamo ? "rosa" : ""}"><div class="entre"><div><span class="mono" style="font-weight:800">${c.id}</span><div style="font-size:18px;font-weight:850">${esc(c.que)}</div></div><div style="text-align:right"><div style="font-size:24px;font-weight:900">${usd(c.monto)}</div>${chipEstado(c.estado)}</div></div>
          ${c.estado !== "Pagado" ? `<div class="barra-saldo" style="margin-top:12px"><i style="width:${pct}%;background:${venc ? "var(--rojo)" : "var(--celeste)"}"></i></div><div class="sub" style="color:#111">Día hábil ${c.dias} de ${POLIZA.plazo}${venc ? ` · <b>vencido hace ${c.dias - POLIZA.plazo} días</b>` : ""}</div>` : `<div class="sub" style="margin-top:8px">Pagado en ${c.dias} días hábiles ✓</div>`}
          ${venc && !c.reclamo ? `<div style="margin-top:14px"><b>Tu reclamo formal ya está redactado:</b><div class="carta" style="margin-top:8px">${esc(carta)}</div><button class="btn ne" style="margin-top:12px" data-acc="reclamo">Enviar reclamo formal</button></div>` : ""}
          ${c.reclamo ? `<div class="chip ok" style="margin-top:12px">✓ Reclamo formal enviado hoy · copia al registro del supervisor</div>` : ""}
        </div>`;
      }).join("")}
    </div>`;
}

const RESPUESTAS = {
  "¿Me cubre una resonancia?": ["Sí. Los estudios de imagen indicados por un médico están cubiertos al 100 % hasta el saldo disponible.", "Condicionado general, cláusula 7.3 · Estudios especiales"],
  "¿Me cubren una hospitalización por dengue?": ["Sí. Las enfermedades infecciosas tropicales están cubiertas desde el día 1, sin período de espera.", "Condicionado general, cláusula 9.2 · Enfermedades sin período de espera"],
  "¿Cuánto tienen para pagarme?": [`Tu póliza fija ${POLIZA.plazo} días hábiles desde que entregas todos los documentos completos.`, "Condiciones particulares, cláusula 15 · Plazo de pago"],
  "¿Me cubren lentes?": ["No. Los lentes y monturas están excluidos, salvo después de una cirugía de cataratas.", "Condicionado general, cláusula 12.8 · Exclusiones"],
};
function vCubre() {
  return `<span class="etq li">Paso 5</span><h1 class="titulo">¿Me cubre?</h1>
    <p class="sub" style="font-size:15.5px">Pregunta en tus palabras. La respuesta cita la cláusula exacta de tu póliza, para que nadie te diga "eso no está cubierto" sin mostrarte dónde.</p>
    <div class="caja" style="margin-top:20px">
      <div class="chat">${S.chat.length ? S.chat.map((m) => m.yo ? `<div class="burbuja yo">${esc(m.t)}</div>` : `<div class="burbuja bot entra">${esc(m.t)}<span class="cl">📎 ${esc(m.c)}</span></div>`).join("") : `<div class="burbuja bot">Hola, Carlos. ¿Qué quieres saber de tu póliza HCM?<span class="cl">📎 Póliza ${POLIZA.numero} · ${POLIZA.aseguradora}</span></div>`}</div>
      <div class="sugerencias" style="margin-top:16px">${Object.keys(RESPUESTAS).map((q) => `<button class="btn sm" data-pregunta="${esc(q)}">${esc(q)}</button>`).join("")}</div>
      <p class="sub" style="margin-top:12px">En la demo, las respuestas y las cláusulas son de ejemplo.</p>
    </div>`;
}

// ---------------------------------------------------------------------------
// Clínica
// ---------------------------------------------------------------------------
function clinica() {
  const a = S.admision;
  let res = "";
  if (a) {
    res = `<div class="caja entra" style="margin-top:20px"><div class="entre"><div><span class="chip ok">● Póliza vigente</span><div style="font-size:28px;font-weight:900;margin-top:8px">${POLIZA.titular}</div><div class="sub">${POLIZA.cedula} · ${POLIZA.aseguradora} · ${POLIZA.numero}</div></div><div style="text-align:right"><div class="sub">Disponible</div><div style="font-size:30px;font-weight:900">${usd(POLIZA.suma - usado())}</div></div></div>
      <div class="grid2" style="margin-top:16px">
        <div class="caja ${S.carta ? "menta" : "amarilla"}" style="box-shadow:none">${S.carta ? `<b>Carta aval ${S.carta.n}</b><div style="font-size:24px;font-weight:900">${usd(S.carta.monto)} garantizados</div><div class="sub" style="color:#111">Aprobada en ${S.carta.min} min · pago directo de ${POLIZA.aseguradora}</div>` : `<b>Sin carta aval</b><div class="sub" style="color:#111">Pídela aquí mismo con el diagnóstico y el presupuesto.</div><button class="btn ne" style="margin-top:10px" data-acc="carta">Solicitar carta aval</button>`}</div>
        <div class="caja" style="box-shadow:none"><b>Estado de pagos de ${POLIZA.aseguradora} con esta clínica</b><div style="margin-top:8px"><span class="chip ok">Al día · 11 días promedio</span></div><div class="sub" style="margin-top:6px">Visible para la clínica y, en agregado, para el supervisor.</div></div>
      </div>
      <div class="fila" style="margin-top:16px"><button class="btn me lg" data-acc="admitir">✓ Admitir paciente</button><button class="btn ro" data-acc="no-admitir">No admitir (registrar motivo)</button></div></div>`;
  }
  return `<div class="contenedor">
    <span class="etq me">Vista de la clínica</span><h1 class="titulo">Admisión · Clínica Ejemplo Caracas</h1>
    <p class="sub" style="font-size:15.5px">La recepcionista escanea el pase o escribe la cédula. En segundos ve la póliza, el saldo y la carta aval.</p>
    <div class="grid4" style="margin-top:20px">
      <div class="caja kpi"><div class="v">14</div><div class="e">cartas aval hoy</div><div class="d">tiempo promedio 13 min</div></div>
      <div class="caja kpi"><div class="v">96 %</div><div class="e">pases aceptados</div><div class="d">este mes</div></div>
      <div class="caja kpi amarilla"><div class="v">2</div><div class="e">aseguradoras con atraso</div><div class="d" style="color:#111">más de 45 días sin pagar</div></div>
      <div class="caja kpi"><div class="v">0</div><div class="e">negativas registradas</div><div class="d">en los últimos 30 días</div></div>
    </div>
    <div class="caja" style="margin-top:20px"><div class="fila" style="flex-wrap:wrap"><input class="btn mono" style="flex:1;min-width:220px;justify-content:flex-start;text-align:left;box-shadow:none" id="cod" value="${a ? "RY-PASE-7K2M" : ""}" placeholder="Código del pase o cédula"><button class="btn am" data-acc="escanear">📷 Escanear pase de ejemplo</button></div>${res}</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Aseguradora
// ---------------------------------------------------------------------------
function aseguradora() {
  const sobre = 1240 + (S.reem.etapa === "enviado" ? 50 : 0);
  return `<div class="contenedor">
    <span class="etq ce">Vista de la aseguradora</span><h1 class="titulo">${POLIZA.aseguradora} · Bandeja de salud</h1>
    <p class="sub" style="font-size:15.5px">Los casos llegan completos y estandarizados, con las alertas ya calculadas.</p>
    <div class="grid4" style="margin-top:20px">
      <div class="caja kpi menta"><div class="v">92 %</div><div class="e">casos completos al llegar</div><div class="d" style="color:#111">antes: devoluciones por papeles faltantes</div></div>
      <div class="caja kpi"><div class="v">${usd(sobre)}</div><div class="e">sobrecobros detectados este mes</div></div>
      <div class="caja kpi"><div class="v">4,1</div><div class="e">días hábiles de pago promedio</div></div>
      <div class="caja kpi rosa"><div class="v">${S.bandeja.filter((b) => b.alerta === "Plazo vencido" && b.estado !== "Pagado").length}</div><div class="e">casos fuera de plazo</div><div class="d" style="color:#111">con reclamo formal del asegurado</div></div>
    </div>
    <div class="tabla" style="margin-top:20px"><table><thead><tr><th>Caso</th><th>Asegurado</th><th>Concepto</th><th>Monto</th><th>Alertas</th><th>Estado</th><th></th></tr></thead><tbody>
      ${S.bandeja.map((b) => `<tr><td class="mono" style="font-weight:800">${b.id}</td><td>${esc(b.quien)}</td><td>${esc(b.que)}</td><td><b>${usd(b.monto)}</b></td>
        <td>${b.alerta ? `<span class="chip ${b.alerta === "Plazo vencido" ? "mal" : "warn"}">⚠ ${esc(b.alerta)}</span>` : `<span class="chip ok">Completo</span>`}</td><td>${chipEstado(b.estado)}</td>
        <td style="white-space:nowrap">${b.estado === "Pagado" ? "—" : b.estado === "Aprobado" ? `<button class="btn sm me" data-pagar="${b.id}">Pagar</button>` : `<button class="btn sm am" data-aprobar="${b.id}">Aprobar</button>`}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="grid2" style="margin-top:20px">
      <div class="caja"><h2 class="sec">🧾 Cómo se detecta un sobrecobro</h2><p class="sub">Cada factura se compara con el rango de precios de su procedimiento en la misma zona, calculado con los reclamos procesados en la plataforma. Si se sale del rango, el caso llega con la alerta y la diferencia.</p></div>
      <div class="caja"><h2 class="sec">🚫 Negativas de atención a tus asegurados</h2><p class="sub">${S.negativa && S.negativa.paso === 2 ? `<b>1 nueva hoy:</b> ${esc(S.negativa.clinica)} · "${esc(S.negativa.motivo)}".` : "Sin negativas nuevas hoy."} Cada negativa llega con la clínica y el motivo, para resolverla antes de que escale.</p></div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Supervisor
// ---------------------------------------------------------------------------
const TIEMPOS = [["Aseguradora A", 3.8], ["Aseguradora B", 6.1], ["Seguros Tepuy", 4.1], ["Aseguradora C", 9.4], ["Aseguradora D", 17.6]];
const ESTADOS = [["Distrito Capital", 21], ["Carabobo", 12], ["Táchira", 9], ["Zulia", 8], ["Lara", 7]];
const SOBRECOBROS = [["Consulta de traumatología", "$60–80", "$95", "+19 %"], ["Resonancia de rodilla", "$180–240", "$265", "+10 %"], ["Reconstrucción de ligamento cruzado (honorarios)", "$1.800–2.300", "$2.700", "+17 %"], ["Ecografía abdominal", "$45–65", "$72", "+11 %"]];
function supervisor() {
  const neg = S.negativas + (S.negativa && S.negativa.paso === 2 ? 1 : 0);
  const maxT = 20;
  return `<div class="contenedor">
    <span class="etq li">Vista del supervisor</span><h1 class="titulo">Panel de supervisión · Salud</h1>
    <p class="sub" style="font-size:15.5px">Datos anónimos y agregados de todos los casos que pasan por ReembolsaYa. Para supervisar con evidencia, no solo con denuncias. Cifras ilustrativas.</p>
    <div class="grid4" style="margin-top:20px">
      <div class="caja kpi"><div class="v">4.812</div><div class="e">reclamos de salud este trimestre</div></div>
      <div class="caja kpi menta"><div class="v">71 %</div><div class="e">pagados dentro del plazo de la póliza</div></div>
      <div class="caja kpi rosa"><div class="v">${neg}</div><div class="e">negativas de atención registradas</div><div class="d" style="color:#111">este mes</div></div>
      <div class="caja kpi amarilla"><div class="v">+18 %</div><div class="e">sobrecobro promedio sobre la referencia</div></div>
    </div>
    <div class="grid2" style="margin-top:20px;align-items:start">
      <div class="caja"><h2 class="sec">⏱️ Días hábiles de pago por aseguradora</h2>
        ${TIEMPOS.map(([n, d]) => `<div class="hbar"><span>${n}</span><span class="pista"><i style="width:${(d / maxT) * 100}%;background:${d > POLIZA.plazo ? "var(--rosa)" : d > 8 ? "var(--amarillo)" : "var(--menta)"}"></i><span class="meta" style="left:${(POLIZA.plazo / maxT) * 100}%"></span></span><b>${d.toLocaleString("es-VE")} d</b></div>`).join("")}
        <div class="leyenda"><span><i style="border-style:dashed;width:0;border-width:0 0 0 3px"></i>Plazo típico de póliza (${POLIZA.plazo} d)</span><span><i style="background:var(--rosa)"></i>Fuera de plazo</span></div></div>
      <div class="caja"><h2 class="sec">🚫 Negativas de atención por estado</h2>
        ${ESTADOS.map(([n, v]) => `<div class="hbar"><span>${n}</span><span class="pista"><i style="width:${(v / 25) * 100}%;background:var(--rosa)"></i></span><b>${v}</b></div>`).join("")}
        <div class="linea" style="margin-top:8px"><span>Motivo más frecuente</span><b>"La aseguradora nos debe" · 46 %</b></div>
        <div class="linea"><span>Exigen pago adelantado con carta aval</span><b>31 %</b></div></div>
    </div>
    <div class="caja" style="margin-top:20px"><h2 class="sec">💸 Sobrecobros por procedimiento (Gran Caracas)</h2>
      <div class="tabla"><table><thead><tr><th>Procedimiento</th><th>Referencia de la zona</th><th>Mediana cobrada</th><th>Diferencia</th></tr></thead><tbody>
      ${SOBRECOBROS.map((r) => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td><span class="chip warn">${r[3]}</span></td></tr>`).join("")}</tbody></table></div>
      <p class="sub" style="margin-top:10px">Un sobrecobro consume la suma asegurada del paciente: protegerlo también es supervisar precios.</p></div>
    <div class="caja negra" style="margin-top:20px"><h2 class="sec">📣 Reclamos escalados al supervisor</h2><p style="opacity:.85">${S.casos.some((c) => c.reclamo) ? "<b>1 nuevo hoy:</b> reembolso de $380 fuera de plazo con Seguros Tepuy (reclamo formal enviado por el asegurado). " : ""}Cada reclamo formal llega con su línea de tiempo y documentos, sin que el asegurado tenga que ir a una oficina.</p></div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------
let timer = null;
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-acc],[data-vista],[data-pregunta],[data-aprobar],[data-pagar]");
  if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.vista) { if (ruta() !== "paciente") location.hash = "#/paciente"; return set({ vista: d.vista }); }
  if (d.pregunta) { const [t, c] = RESPUESTAS[d.pregunta]; return set({ chat: [...S.chat, { yo: true, t: d.pregunta }, { yo: false, t, c }] }); }
  if (d.aprobar || d.pagar) {
    const id = d.aprobar || d.pagar;
    S.bandeja = S.bandeja.map((b) => b.id === id ? { ...b, estado: d.aprobar ? "Aprobado" : "Pagado" } : b);
    S.casos = S.casos.map((c) => c.id === id ? { ...c, estado: d.aprobar ? "Aprobado" : "Pagado" } : c);
    toast(d.aprobar ? `${id} aprobado` : `${id} pagado`); return set({});
  }
  switch (d.acc) {
    case "negativa": return set({ negativa: { paso: 1 } });
    case "neg-cancelar": return set({ negativa: null });
    case "neg-enviar": {
      const clinica = $("#neg-clinica").value, motivo = (document.querySelector('input[name="motivo"]:checked') || {}).value || MOTIVOS[0];
      toast("Negativa registrada. Avisamos a tu aseguradora.");
      return set({ negativa: { paso: 2, clinica, motivo, hora: hhmm(), n: `NEG-2026-${String(S.negativas + 1).padStart(4, "0")}` } });
    }
    case "carta": toast("Carta aval aprobada"); return set({ carta: { n: `CA-2026-${aleatorio(4)}`, monto: 5900, min: 12 } });
    case "foto":
      set({ reem: { etapa: "leyendo", recipe: false } });
      clearTimeout(timer); timer = setTimeout(() => set({ reem: { ...S.reem, etapa: "leido" } }), 1400); return;
    case "recipe": toast("Récipe agregado y legible"); return set({ reem: { ...S.reem, recipe: true } });
    case "enviar-reem": {
      const id = `RY-2026-0${419 + S.casos.length - 3}`;
      S.casos = [{ id, que: "Consulta de traumatología", monto: 120, dias: 0, estado: "Recibido", alerta: "" }, ...S.casos];
      S.bandeja = [{ id, quien: "C. M.", que: "Consulta de traumatología", monto: 120, completo: true, alerta: "Honorarios altos", estado: "Recibido" }, ...S.bandeja];
      return set({ reem: { etapa: "enviado", recipe: true, id } });
    }
    case "reem-nuevo": return set({ reem: { etapa: "inicio", recipe: false } });
    case "reclamo": toast("Reclamo formal enviado"); S.casos = S.casos.map((c) => c.id === "RY-2026-0402" ? { ...c, reclamo: true } : c); return set({});
    case "escanear": return set({ admision: { codigo: "RY-PASE-7K2M" } });
    case "admitir": toast("Paciente admitido con carta aval"); return set({ admision: null });
    case "no-admitir": toast("Motivo registrado: la aseguradora y el supervisor fueron notificados"); return set({ admision: null, negativas: S.negativas + 1 });
  }
});

render();
