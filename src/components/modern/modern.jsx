import React from 'react';
import { useTheme } from '@mui/material/styles';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { formatBytes, formatNetworkType, isPhysicalInterface, celciusToFahrenheit } from '../../js/utils.js';
import './modern.css';

const C = { temp: '#ff7a59', cpu: '#4c9fff', mem: '#22c3a6', disk: '#a78bfa', up: '#34d399', down: '#60a5fa', warn: '#f5b942', hot: '#ef4444' };

const fmtB = (v) => formatBytes(v).replace(/\.00 /, ' ').replace(/ $/, ' ') + 'B';
const fmtBs = (v) => (!v ? '0' : formatBytes(v).replace(/(\.\d)\d/, '$1').replace(/ $/, ' ') + 'B/s');
const timeLabel = (t) => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); };

const useVars = () => {
  const t = useTheme();
  const dark = t.palette.mode === 'dark';
  return {
    style: {
      '--mbg': dark ? '#151a23' : '#ffffff',
      '--mborder': dark ? '#232a36' : '#e5e8ee',
      '--mtrack': dark ? '#262e3b' : '#e9edf3',
      color: t.palette.text.primary,
    },
    axis: dark ? '#8b95a7' : '#5f6b7d',
    grid: dark ? '#222a36' : '#edf0f4',
    tip: { backgroundColor: dark ? '#1d2430' : '#fff', border: `1px solid ${dark ? '#2c3545' : '#dde2ea'}`, borderRadius: 8, fontSize: 12 },
  };
};

// data arrives newest first; real samples only, oldest -> newest
const series = (data) => data.filter(d => d && Object.keys(d).length > 1).slice().reverse();
const latest = (data) => data.find(d => d && Object.keys(d).length > 1) || {};

const Shell = ({ title, color, primary, unit, right, children, compact }) => {
  const v = useVars();
  return (
    <div className={'mcard' + (compact ? ' compact' : '')} style={v.style}>
      <div className="mhead">
        <div className="mtitle"><span className="mdot" style={{ background: color }} />{title}</div>
        {right}
      </div>
      {primary !== undefined && <div className="mprimary">{primary}{unit && <small>{unit}</small>}</div>}
      {children}
    </div>
  );
};

const Stats = ({ items }) => (
  <div className="mstats">
    {items.filter(Boolean).map(([k, val]) => <div className="mstat" key={k}><div className="k">{k}</div><div className="v" title={String(val)}>{val}</div></div>)}
  </div>
);

const Bar = ({ pct, color }) => <div className="mbar"><div style={{ width: `${Math.max(0, Math.min(100, pct || 0))}%`, background: color }} /></div>;

const TimeChart = ({ data, lines, domain, yFmt, refs, area, height, ticks }) => {
  const v = useVars();
  const gid = React.useId().replace(/:/g, '');
  const Chart = area ? AreaChart : LineChart;
  return (
    <div className="mchart" style={height ? { height } : undefined}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <defs>
            {lines.map(l => (
              <linearGradient key={l.key} id={`g${gid}-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={l.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={l.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={v.grid} vertical={false} />
          <XAxis dataKey="time" tickFormatter={timeLabel} tick={{ fontSize: 11, fill: v.axis }} stroke={v.grid} minTickGap={70} tickMargin={6} />
          <YAxis domain={domain} tickFormatter={yFmt} tick={{ fontSize: 11, fill: v.axis }} stroke={v.grid} width={58} tickCount={4} ticks={ticks} allowDecimals={false} />
          <Tooltip contentStyle={v.tip} labelFormatter={timeLabel} formatter={(val, name, it) => [it.payload && l2f(lines, it.dataKey)(val), name]} />
          {(refs || []).map(r => <ReferenceLine key={r.y} y={r.y} stroke={r.color} strokeDasharray="4 4" label={{ value: r.label, position: 'insideTopRight', fill: r.color, fontSize: 11 }} />)}
          {lines.map(l => area
            ? <Area key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} fill={`url(#g${gid}-${l.key})`} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
            : <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />)}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
};
const l2f = (lines, key) => (lines.find(l => l.key === key) || {}).fmt || ((x) => x);

export const ModernTemperature = ({ data, unit }) => {
  const F = unit === 'F';
  const conv = (c) => (c === undefined || c === null ? undefined : (F ? celciusToFahrenheit(c) : c));
  const u = F ? '°F' : '°C';
  const s = series(data).map(d => ({ time: d.time, cpu: conv(d.cpu_temperature), gpu: conv(d.gpu_temperature) }));
  const L = latest(data);
  const t = L.cpu_temperature;
  const color = t >= 75 ? C.hot : t >= 60 ? C.warn : C.temp;
  const w = conv(60), h = conv(75);
  const lines = [{ key: 'cpu', name: 'CPU', color, fmt: (x) => `${x?.toFixed(1)} ${u}` }];
  if (s.some(x => x.gpu)) lines.push({ key: 'gpu', name: 'GPU', color: C.warn, fmt: (x) => `${x?.toFixed(1)} ${u}` });
  const vals = s.map(x => x.cpu).filter(x => x !== undefined);
  const max = Math.max(...vals, w);
  const step = F ? 20 : 10;
  const tLo = Math.floor(Math.min(...vals, conv(30)) / step) * step;
  const tHi = Math.ceil((max + 1) / step) * step;
  const tTicks = []; for (let x = tLo; x <= tHi; x += step) tTicks.push(x);
  return (
    <Shell title="Temperature" color={color} primary={t !== undefined ? conv(t).toFixed(1) : '–'} unit={u}
      right={<span style={{ fontSize: 12, color }}>{t >= 75 ? 'Hot' : t >= 60 ? 'Warm' : 'Normal'}</span>}>
      <Stats items={[
        'pwm_fan_speed' in L && ['Fan speed', `${L.pwm_fan_speed} RPM`],
        'gpio_fan_state' in L && ['GPIO fan', L.gpio_fan_state ? 'On' : 'Off'],
        L.gpu_temperature && ['GPU', `${conv(L.gpu_temperature).toFixed(1)} ${u}`],
        vals.length > 0 && ['Peak', `${Math.max(...vals).toFixed(1)} ${u}`],
      ]} />
      <TimeChart data={s} lines={lines} area
        domain={[tLo, tHi]} ticks={tTicks}
        yFmt={(x) => `${Math.round(x)}°`}
        refs={[{ y: w, color: C.warn, label: `${Math.round(w)}°` }, ...(max >= h - 5 ? [{ y: h, color: C.hot, label: `${Math.round(h)}°` }] : [])]} />
    </Shell>
  );
};

export const ModernProcessor = ({ data }) => {
  const L = latest(data);
  const n = L.cpu_count || 0;
  const cores = Array.from({ length: n }, (_, i) => L[`cpu_${i}_percent`]).filter(x => x !== undefined);
  const usage = L.cpu_percent !== undefined ? L.cpu_percent : (cores.length ? cores.reduce((a, b) => a + b, 0) / cores.length : undefined);
  const s = series(data).map(d => ({ time: d.time, cpu: d.cpu_percent }));
  return (
    <Shell title="Processor" color={C.cpu} primary={usage !== undefined ? usage.toFixed(1) : '–'} unit="%">
      <Stats items={[['Cores', n || '–'], L.cpu_freq && ['Frequency', `${(L.cpu_freq / 1000).toFixed(2)} GHz`], L.cpu_freq_max && ['Max', `${(L.cpu_freq_max / 1000).toFixed(1)} GHz`]]} />
      {cores.length > 0 && <div className="mcores">
        {cores.map((p, i) => <div className="mcore" key={i}><div className="k"><span>Core {i}</span><span>{Math.round(p)}%</span></div><Bar pct={p} color={C.cpu} /></div>)}
      </div>}
      <TimeChart data={s} area lines={[{ key: 'cpu', name: 'CPU', color: C.cpu, fmt: (x) => `${x?.toFixed(1)} %` }]} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} yFmt={(x) => `${x}%`} height={140} />
    </Shell>
  );
};

export const ModernMemory = ({ data }) => {
  const L = latest(data);
  const s = series(data).map(d => ({ time: d.time, pct: d.memory_percent }));
  return (
    <Shell title="Memory" color={C.mem} primary={L.memory_percent !== undefined ? L.memory_percent.toFixed(1) : '–'} unit="%">
      <Bar pct={L.memory_percent} color={C.mem} />
      <Stats items={[['Used', fmtB(L.memory_used)], ['Available', fmtB(L.memory_available)], ['Total', fmtB(L.memory_total)]]} />
      <TimeChart data={s} area lines={[{ key: 'pct', name: 'Memory', color: C.mem, fmt: (x) => `${x?.toFixed(1)} %` }]} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} yFmt={(x) => `${x}%`} />
    </Shell>
  );
};

export const ModernStorage = ({ data, mountSwitchChecked }) => {
  const L = latest(data);
  const disks = {};
  Object.keys(L).forEach(k => {
    const m = k.match(/^disk_(.+)_(total|used|free|percent|mounted)$/);
    if (!m) return;
    (disks[m[1]] = disks[m[1]] || { name: m[1] })[m[2]] = L[k];
  });
  const list = Object.values(disks).filter(d => d.total && (d.mounted !== 0 || mountSwitchChecked));
  const main = list[0] || {};
  return (
    <Shell title="Storage" color={C.disk} primary={main.percent !== undefined ? main.percent.toFixed(1) : '–'} unit="% used">
      {list.map(d => (
        <div key={d.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="mlist"><div><span>{d.name}</span><span>{d.mounted === 0 ? 'Not mounted' : `${d.percent}%`}</span></div></div>
          <Bar pct={d.percent} color={d.percent >= 90 ? C.hot : d.percent >= 75 ? C.warn : C.disk} />
          <Stats items={[['Used', fmtB(d.used)], ['Free', fmtB(d.free)], ['Total', fmtB(d.total)]]} />
        </div>
      ))}
      {list.length === 0 && <div style={{ opacity: .6, fontSize: 13 }}>No disks reported</div>}
    </Shell>
  );
};

export const ModernNetwork = ({ data }) => {
  const L = latest(data);
  const s = series(data).map(d => ({ time: d.time, up: d.network_upload_speed, down: d.network_download_speed }));
  const peak = Math.max(1024, ...s.map(x => Math.max(x.up || 0, x.down || 0)));
  const mag = Math.pow(1024, Math.floor(Math.log(peak) / Math.log(1024)));
  const raw = peak / mag / 3;
  const nice = [0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500].find(x => x >= raw) || 500;
  const step = nice * mag;
  const nTicks = [0, step, step * 2, step * 3, ...(step * 3 < peak ? [step * 4] : [])];
  return (
    <Shell title="Network" color={C.down} primary={fmtBs(L.network_download_speed)} unit="down"
      right={<div className="mlegend"><span><i className="mdot" style={{ background: C.down }} />Down</span><span><i className="mdot" style={{ background: C.up }} />Up</span></div>}>
      <Stats items={[['Download', fmtBs(L.network_download_speed)], ['Upload', fmtBs(L.network_upload_speed)], ['Type', formatNetworkType(L.network_type)]]} />
      <TimeChart data={s} lines={[
        { key: 'down', name: 'Down', color: C.down, fmt: fmtBs },
        { key: 'up', name: 'Up', color: C.up, fmt: fmtBs },
      ]} domain={[0, nTicks[nTicks.length - 1]]} ticks={nTicks} yFmt={fmtBs} />
    </Shell>
  );
};

const fmtUptime = (boot) => {
  if (!boot) return '–';
  let s = Math.max(0, Date.now() / 1000 - boot);
  const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); const m = Math.floor((s - h * 3600) / 60);
  return d ? `${d}d ${h}h` : `${h}h ${m}m`;
};

export const ModernSystem = ({ data }) => {
  const L = latest(data);
  const ifs = Object.keys(L).filter(k => k.startsWith('ip_') && isPhysicalInterface(k.slice(3)));
  return (
    <Shell title="System" color="#94a3b8" compact primary={fmtUptime(L.boot_time)} unit="uptime">
      <div className="mlist">
        {'gpio_fan_state' in L && <div><span>GPIO fan</span><span>{L.gpio_fan_state ? 'On' : 'Off'}</span></div>}
        {'pwm_fan_speed' in L && <div><span>PWM fan</span><span>{L.pwm_fan_speed} RPM</span></div>}
        {ifs.map(k => <div key={k}><span>{k.slice(3)} IP</span><span>{L[k]}</span></div>)}
        {Object.keys(L).filter(k => k.startsWith('mac_') && isPhysicalInterface(k.slice(4))).map(k => <div key={k}><span>{k.slice(4)} MAC</span><span>{L[k]}</span></div>)}
      </div>
    </Shell>
  );
};
