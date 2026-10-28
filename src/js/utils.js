function isNum(data) {
  return !isNaN(Number(data, 10));
}

function round(number, index) {
  if (isNum(number)) {
    let a = 10 ** index;
    return parseInt(number * a) / a;
  }
  return number;
}

function firstUpperCase(string) {
  if (!string) return;
  string = string[0].toUpperCase() + string.slice(1);
  return string;
}

function formatBytes(bytes, originalUnit = '') {
  if (typeof bytes !== 'number' || isNaN(bytes)) return '0';
  var units = ['', 'K', 'M', 'G', 'T'];
  var unitIndex = units.indexOf(originalUnit);

  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex++;
  }
  return bytes.toFixed(2) + ' ' + units[unitIndex];
}

function timeFormatting(time) {
  const timeString = time;
  const dateTime = new Date(timeString);
  if (isNaN(dateTime.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${dateTime.getFullYear()}-${pad(dateTime.getMonth() + 1)}-${pad(dateTime.getDate())} ${pad(dateTime.getHours())}:${pad(dateTime.getMinutes())}:${pad(dateTime.getSeconds())}`;
}

const VIRTUAL_IFACE_RE = /^(lo|docker\d*|veth|br-|virbr|umbrel-vm|tun|tap|wg|zt|cni|flannel|cali|vxlan|kube)/;
function isPhysicalInterface(name) {
  return !!name && !VIRTUAL_IFACE_RE.test(name);
}

function formatNetworkType(type) {
  if (!type || typeof type !== 'string') return '-';
  const parts = [...new Set(type.split('&').map(s => s.trim()).filter(Boolean))];
  return parts.length ? parts.join(' / ') : '-';
}

function shortTime(time) {
  const d = new Date(time);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function celciusToFahrenheit(celcius) {
  return celcius * 9 / 5 + 32;
}


export { isNum, round, firstUpperCase, formatBytes, timeFormatting, celciusToFahrenheit, isPhysicalInterface, formatNetworkType, shortTime };