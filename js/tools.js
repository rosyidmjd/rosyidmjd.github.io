/* ====== VLSM FUNCTIONS ====== */
function initVLSM() {
  const networkInput = document.getElementById("networkInput");
  const resultBody = document.getElementById("resultBody");
  const errorBox = document.getElementById("errorBox");

  window.addSubnet = function(name = "", hosts = "") {
    const list = document.getElementById("subnetList");
    const row = document.createElement("div");
    row.className = "subnet-row border rounded p-3 mb-3";

    row.innerHTML = `
      <div class="mb-2">
        <label class="form-label d-lg-none">Subnet Name</label>
        <input type="text" class="form-control subnet-name"
          placeholder="Subnet name" value="${name}">
      </div>
      <div class="mb-2">
        <label class="form-label d-lg-none">Required Hosts</label>
        <input type="number" class="form-control subnet-host"
          placeholder="Number of hosts" min="1" value="${hosts}">
      </div>
      <div class="d-grid d-lg-flex justify-content-lg-end">
        <button class="btn btn-sm btn-outline-danger"
          onclick="this.closest('.subnet-row').remove()">
          Remove
        </button>
      </div>
    `;
    list.appendChild(row);
  }

  window.calculateVLSM = function() {
    if (!networkInput || !resultBody || !errorBox) return;

    errorBox.classList.add("d-none");
    const base = parseCIDR(networkInput.value);
    let cursor = base.network;

    const subs = [...document.querySelectorAll(".subnet-row")]
      .map(r => ({
        name: r.querySelector(".subnet-name").value || "SUBNET",
        host: +r.querySelector(".subnet-host").value
      }))
      .filter(s => s.host > 0)
      .sort((a,b)=> b.host - a.host);

    resultBody.innerHTML = "";

    for (let s of subs) {
      let bits = Math.ceil(Math.log2(s.host + 2));
      let size = 2 ** bits;
      let mask = 32 - bits;

      let net = cursor;
      let bc  = net + size - 1;

      if (bc > base.broadcast) {
        errorBox.classList.remove("d-none");
        errorBox.innerHTML = `Subnet <b>${s.name}</b> exceeds available address space.`;
        return;
      }

      resultBody.innerHTML += `
        <tr>
          <td>${s.name}</td>
          <td>${s.host}</td>
          <td>${intToIp(net)}</td>
          <td>/${mask}</td>
          <td>${intToIp(net+1)} - ${intToIp(bc-1)}</td>
          <td>${intToIp(bc)}</td>
        </tr>
      `;

      cursor = bc + 1;
    }
  }
}

/* ====== IP SUBNET FUNCTIONS ====== */
function initIPSubnet() {
  const maskSelect = document.getElementById("maskSelect");
  if (!maskSelect) return;

  // populate dropdown
  for (let i = 8; i <= 32; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `/${i}`;
    if (i === 24) opt.selected = true;
    maskSelect.appendChild(opt);
  }

  // attach calculateSubnet ke window
  window.calculateSubnet = calculateSubnet;
}

/* ====== IP UTIL ====== */
function ipToInt(ip){
  return ip.split(".").reduce((a,o)=> (a<<8)+ +o,0)>>>0;
}

function intToIp(int){
  return [24,16,8,0].map(s=> (int>>s)&255).join(".");
}

function maskToInt(mask){
  return ~((1<<(32-mask))-1)>>>0;
}

function parseCIDR(cidr){
  let [ip,mask] = cidr.split("/");
  let base = ipToInt(ip);
  let m = ~((1<<(32-mask))-1)>>>0;

  return {
    network: base & m,
    broadcast: (base & m) | (~m>>>0)
  };
}

/* ====== CALCULATE IP SUBNET ====== */
function calculateSubnet() {
  const errorBox = document.getElementById("errorBox");
  errorBox.classList.add("d-none");

  const ipStr = document.getElementById("networkInput").value.trim();
  const mask = +document.getElementById("maskSelect").value;

  if(!ipStr.match(/^\d{1,3}(\.\d{1,3}){3}$/)){
    errorBox.classList.remove("d-none");
    errorBox.textContent = "Invalid IP format!";
    return;
  }

  const base = ipToInt(ipStr);
  const subnetMask = maskToInt(mask);

  const network = base & subnetMask;
  const broadcast = network | (~subnetMask>>>0);
  const firstHost = network + 1;
  const lastHost = broadcast - 1;
  const totalHosts = lastHost - firstHost + 1;

  const resultBody = document.getElementById("resultBody");
  if (!resultBody) return;

  resultBody.innerHTML = `
    <tr><td class="fw-semibold text-start">Network Address</td><td>${intToIp(network)}</td></tr>
    <tr><td class="fw-semibold text-start">Broadcast Address</td><td>${intToIp(broadcast)}</td></tr>
    <tr><td class="fw-semibold text-start">Subnet Mask</td><td>${intToIp(subnetMask)} (/ ${mask})</td></tr>
    <tr><td class="fw-semibold text-start">Usable Host Range</td><td>${intToIp(firstHost)} - ${intToIp(lastHost)}</td></tr>
    <tr><td class="fw-semibold text-start">Total Usable Hosts</td><td>${totalHosts > 0 ? totalHosts : 0}</td></tr>
  `;
}

//MikroTik Burst Limit Calculator
function preset(limit, max) {
  document.getElementById('limitAt').value = limit;
  document.getElementById('maxLimit').value = max;
  document.getElementById('burstLimit').value = max * 2;
  document.getElementById('burstThreshold').value = max * 1.5;
  document.getElementById('burstTime').value = 8;
  document.getElementById('priority').value = 8;
  generate();
}

function generate() {
  const name = document.getElementById('name').value || 'QUEUE-USER';
  const t  = document.getElementById('target').value;
  const la = document.getElementById('limitAt').value;
  const ml = document.getElementById('maxLimit').value;
  const bl = document.getElementById('burstLimit').value;
  const bt = document.getElementById('burstThreshold').value;
  const time = document.getElementById('burstTime').value;
  const p = document.getElementById('priority').value;

  document.getElementById('rateLimit').value =
`${ml}M/${ml}M ${bl}M/${bl}M ${bt}M/${bt}M ${time}s/${time}s ${p} ${la}M/${la}M`;

  document.getElementById('queueCmd').value =
`/queue simple add name="${name}" target=${t} limit-at=${la}M/${la}M max-limit=${ml}M/${ml}M burst-limit=${bl}M/${bl}M burst-threshold=${bt}M/${bt}M burst-time=${time}s/${time}s priority=${p}/${p}`;
}

function copyText(id) {
  navigator.clipboard.writeText(document.getElementById(id).value);
}