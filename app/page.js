'use client';
import { useState, useEffect } from 'react';
import './globals.css';

const initialField = [
  { id: 'VER', name: 'Verstappen', team: 'Red Bull', pos: 1, compound: 'Medium', tires: [0,0,0,0], pits: 0, pace: 1.0, penalty: 0, action: 'manage' },
  { id: 'NOR', name: 'Norris', team: 'McLaren', pos: 2, compound: 'Soft', tires: [0,0,0,0], pits: 0, pace: 1.02, penalty: 0, action: 'manage' },
  { id: 'LEC', name: 'Leclerc', team: 'Ferrari', pos: 3, compound: 'Hard', tires: [0,0,0,0], pits: 0, pace: 1.05, penalty: 0, action: 'manage' },
  { id: 'HAM', name: 'Hamilton', team: 'Ferrari', pos: 4, compound: 'Hard', tires: [0,0,0,0], pits: 0, pace: 1.05, penalty: 0, action: 'manage' },
  { id: 'RUS', name: 'Russell', team: 'Mercedes', pos: 5, compound: 'Medium', tires: [0,0,0,0], pits: 0, pace: 1.06, penalty: 0, action: 'manage' },
  { id: 'PIA', name: 'Piastri', team: 'McLaren', pos: 6, compound: 'Soft', tires: [0,0,0,0], pits: 0, pace: 1.03, penalty: 0, action: 'manage' },
  { id: 'SAI', name: 'Sainz', team: 'Williams', pos: 7, compound: 'Medium', tires: [0,0,0,0], pits: 0, pace: 1.08, penalty: 0, action: 'manage' },
  { id: 'ALO', name: 'Alonso', team: 'Aston Martin', pos: 8, compound: 'Hard', tires: [0,0,0,0], pits: 0, pace: 1.07, penalty: 0, action: 'manage' },
];

const radioMessages = [
  'Push now!',
  'Conserve tires',
  'Box this lap',
  'Stay out',
  'You are faster',
  'Gap is closing',
  'Manage the delta',
  'Attack mode',
  'Save the engine',
  'Pit window open',
  'Undercut possible',
  'Hold position',
  'Give me everything',
  'Tires are gone',
  'Clear air ahead'
];

const points = [25, 18, 15, 12, 10, 8, 6, 4];

export default function Home() {
  const [lap, setLap] = useState(1);
  const [totalLaps] = useState(57);
  const [field, setField] = useState(initialField);
  const [log, setLog] = useState([{lap: 0, text: 'Race started. Lights out and away we go.'}]);
  const [pitCompound, setPitCompound] = useState('Medium');
  const [raceFinished, setRaceFinished] = useState(false);
  const [driversChamp, setDriversChamp] = useState({ LEC: 0, HAM: 0, VER: 0, NOR: 0 });
  const [constructorsChamp, setConstructorsChamp] = useState({ Ferrari: 0, 'Red Bull': 0, McLaren: 0 });
  const [selectedRadio, setSelectedRadio] = useState(radioMessages[0]);

  const tireLife = { Soft: 15, Medium: 22, Hard: 30 };

  useEffect(() => {
    if (lap >= totalLaps && !raceFinished) finishRace();
  }, [lap]);

  function addLog(text) {
    setLog(prev => [...prev, { lap, text }]);
  }

  function avgTireAge(car) {
    return car.tires.reduce((a, b) => a + b, 0) / 4;
  }

  function getTirePercent(car) {
    const max = tireLife[car.compound] || 20;
    const avg = avgTireAge(car);
    return Math.max(0, Math.round((1 - avg / max) * 100));
  }

  function advance(laps = 1) {
    if (raceFinished) return;
    const prevLeader = field.find(c => c.pos === 1)?.name;
    setField(prev => {
      let updated = prev.map(car => {
        const wearRate = car.action === 'push' ? 1.4 : car.action === 'conserve' ? 0.7 : 1.0;
        const newTires = car.tires.map(t => t + laps * wearRate);
        const avg = newTires.reduce((a,b)=>a+b,0)/4;
        let drop = 0;
        const max = tireLife[car.compound] || 20;
        if (avg > max * 0.8 && avg <= max) drop = 0.3;
        if (avg > max) drop = 1.0;
        return { ...car, tires: newTires, pace: car.pace + drop * 0.01 + (car.penalty * 0.002) };
      });
      const oldPos = {};
      prev.forEach(c => oldPos[c.id] = c.pos);
      updated.sort((a, b) => (a.pace + avgTireAge(a) * 0.008 + a.penalty * 0.05) - (b.pace + avgTireAge(b) * 0.008 + b.penalty * 0.05));
      updated.forEach((c, i) => {
        c.pos = i + 1;
        if (oldPos[c.id] && oldPos[c.id] > c.pos) {
          addLog(`${c.name} gains position to P${c.pos}`);
        }
        if (avgTireAge(c) > (tireLife[c.compound] || 20) * 0.9) {
          addLog(`${c.name} tires approaching cliff`);
        }
      });
      return updated;
    });
    const newLap = Math.min(lap + laps, totalLaps);
    setLap(newLap);
    addLog(`Lap ${newLap} complete.`);
    const newLeader = field.find(c => c.pos === 1)?.name;
    if (newLeader && newLeader !== prevLeader) {
      addLog(`LEAD CHANGE: ${newLeader} now leads`);
    }
  }

  function pit(driverId) {
    if (raceFinished) return;
    const car = field.find(c => c.id === driverId);
    setField(prev => prev.map(c => {
      if (c.id === driverId) {
        return { ...c, compound: pitCompound, tires: [0,0,0,0], pits: c.pits + 1, pace: Math.max(0.9, c.pace - 0.04) };
      }
      return c;
    }));
    addLog(`${car?.name} pits for ${pitCompound} (stop #${(car?.pits || 0) + 1})`);
  }

  function setAction(driverId, action) {
    setField(prev => prev.map(car => car.id === driverId ? { ...car, action } : car));
    addLog(`${driverId} strategy set to ${action}`);
  }

  function sendRadio(driverId) {
    addLog(`Radio → ${driverId}: "${selectedRadio}"`);
  }

  function adjustTire(driverId, index, delta) {
    const labels = ['FL','FR','RL','RR'];
    setField(prev => prev.map(car => {
      if (car.id === driverId) {
        const newTires = [...car.tires];
        newTires[index] = Math.max(0, newTires[index] + delta);
        return { ...car, tires: newTires };
      }
      return car;
    }));
    addLog(`${driverId} ${labels[index]} tire adjusted by ${delta > 0 ? '+' : ''}${delta}`);
  }

  function applyPenalty(driverId, type) {
    const amount = type === 'engine' ? 10 : type === 'gearbox' ? 5 : 3;
    setField(prev => prev.map(car => car.id === driverId ? { ...car, penalty: car.penalty + amount } : car));
    addLog(`PENALTY: ${driverId} ${type} (+${amount}s)`);
  }

  function finishRace() {
    setRaceFinished(true);
    const sorted = [...field].sort((a, b) => a.pos - b.pos);
    const winner = sorted[0];
    addLog(`CHECKERED FLAG. Winner: ${winner.name}`);
    const newDrivers = { ...driversChamp };
    const newCons = { ...constructorsChamp };
    sorted.slice(0, 8).forEach((car, i) => {
      const pts = points[i] || 0;
      if (newDrivers[car.id] !== undefined) newDrivers[car.id] += pts;
      if (newCons[car.team] !== undefined) newCons[car.team] += pts;
    });
    setDriversChamp(newDrivers);
    setConstructorsChamp(newCons);
  }

  const lec = field.find(c => c.id === 'LEC');
  const ham = field.find(c => c.id === 'HAM');
  const leader = field.find(c => c.pos === 1);

  if (raceFinished) {
    const sortedDrivers = Object.entries(driversChamp).sort((a, b) => b[1] - a[1]);
    const sortedCons = Object.entries(constructorsChamp).sort((a, b) => b[1] - a[1]);
    return (
      <div className="container">
        <h1>Race Finished</h1>
        <h2>Winner: {field.find(c => c.pos === 1)?.name}</h2>
        <div className="grid">
          <div className="card"><h3>Drivers Championship</h3>{sortedDrivers.map(([id, pts]) => <p key={id}>{id}: {pts} pts</p>)}</div>
          <div className="card"><h3>Constructors Championship</h3>{sortedCons.map(([team, pts]) => <p key={team}>{team}: {pts} pts</p>)}</div>
        </div>
        <button onClick={() => { setRaceFinished(false); setLap(1); setField(initialField); setLog([{lap:0, text:'New race started.'}]); }}>New Race</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Ferrari Pit Strategy Simulator</h1>
      <p>Lap {lap}/{totalLaps} | Leader: {leader?.name}</p>

      <div className="grid">
        <div className="card">
          <h2>Leclerc (P{lec?.pos})</h2>
          <p>Action: {lec?.action} | Compound: {lec?.compound} | Pits: {lec?.pits}</p>
          <p>Avg tire age: {avgTireAge(lec).toFixed(1)} | Left: {getTirePercent(lec)}%</p>
          <select value={lec?.action} onChange={e => setAction('LEC', e.target.value)}>
            <option value="push">Push</option>
            <option value="manage">Manage</option>
            <option value="conserve">Conserve</option>
          </select>
          <button onClick={() => pit('LEC')}>Pit</button>
          <button onClick={() => sendRadio('LEC')}>Radio</button>
          <div style={{marginTop:8}}>
            {['FL','FR','RL','RR'].map((label, i) => (
              <span key={i} style={{marginRight:8}}>
                {label}: <button onClick={() => adjustTire('LEC', i, -1)}>-</button> {lec?.tires[i].toFixed(1)} <button onClick={() => adjustTire('LEC', i, 1)}>+</button>
              </span>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Hamilton (P{ham?.pos})</h2>
          <p>Action: {ham?.action} | Compound: {ham?.compound} | Pits: {ham?.pits}</p>
          <p>Avg tire age: {avgTireAge(ham).toFixed(1)} | Left: {getTirePercent(ham)}%</p>
          <select value={ham?.action} onChange={e => setAction('HAM', e.target.value)}>
            <option value="push">Push</option>
            <option value="manage">Manage</option>
            <option value="conserve">Conserve</option>
          </select>
          <button onClick={() => pit('HAM')}>Pit</button>
          <button onClick={() => sendRadio('HAM')}>Radio</button>
          <div style={{marginTop:8}}>
            {['FL','FR','RL','RR'].map((label, i) => (
              <span key={i} style={{marginRight:8}}>
                {label}: <button onClick={() => adjustTire('HAM', i, -1)}>-</button> {ham?.tires[i].toFixed(1)} <button onClick={() => adjustTire('HAM', i, 1)}>+</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{margin: '15px 0'}}>
        <select value={selectedRadio} onChange={e => setSelectedRadio(e.target.value)}>
          {radioMessages.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={pitCompound} onChange={e => setPitCompound(e.target.value)}>
          <option>Soft</option><option>Medium</option><option>Hard</option>
        </select>
        <button onClick={() => advance(1)}>+1 Lap</button>
        <button onClick={() => advance(5)}>+5 Laps</button>
      </div>

      <div className="card">
        <h3>Gaps to All</h3>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
          {field.map(car => (
            <div key={car.id} style={{background: car.team==='Ferrari'?'#331111':'#222', padding: '6px 10px', borderRadius: 4}}>
              P{car.pos} {car.name}: +{((car.pos-1)*1.8).toFixed(1)}s
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{marginTop: 15, maxHeight: '280px', overflowY: 'auto', background: '#111'}}>
        <h3>Race Events & Log</h3>
        {log.slice().reverse().map((entry, i) => (
          <p key={i} style={{margin: '4px 0', fontSize: '14px', borderBottom: '1px solid #222', paddingBottom: '4px'}}>
            <strong>L{entry.lap}</strong> {entry.text}
          </p>
        ))}
      </div>
    </div>
  );
}