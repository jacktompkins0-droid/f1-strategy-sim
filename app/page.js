'use client';
import { useState, useEffect } from 'react';
import './globals.css';

const initialField = [
  { id: 'VER', name: 'Verstappen', team: 'Red Bull', pos: 1, compound: 'Medium', tireAge: 0, pits: 0, pace: 1.0, penalty: 0 },
  { id: 'NOR', name: 'Norris', team: 'McLaren', pos: 2, compound: 'Soft', tireAge: 0, pits: 0, pace: 1.02, penalty: 0 },
  { id: 'LEC', name: 'Leclerc', team: 'Ferrari', pos: 3, compound: 'Hard', tireAge: 0, pits: 0, pace: 1.05, penalty: 0 },
  { id: 'HAM', name: 'Hamilton', team: 'Ferrari', pos: 4, compound: 'Hard', tireAge: 0, pits: 0, pace: 1.05, penalty: 0 },
  { id: 'RUS', name: 'Russell', team: 'Mercedes', pos: 5, compound: 'Medium', tireAge: 0, pits: 0, pace: 1.06, penalty: 0 },
  { id: 'PIA', name: 'Piastri', team: 'McLaren', pos: 6, compound: 'Soft', tireAge: 0, pits: 0, pace: 1.03, penalty: 0 },
  { id: 'SAI', name: 'Sainz', team: 'Williams', pos: 7, compound: 'Medium', tireAge: 0, pits: 0, pace: 1.08, penalty: 0 },
  { id: 'ALO', name: 'Alonso', team: 'Aston Martin', pos: 8, compound: 'Hard', tireAge: 0, pits: 0, pace: 1.07, penalty: 0 },
];

const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export default function Home() {
  const [lap, setLap] = useState(1);
  const [totalLaps] = useState(57);
  const [field, setField] = useState(initialField);
  const [log, setLog] = useState(['Race started.']);
  const [pitCompound, setPitCompound] = useState('Medium');
  const [raceFinished, setRaceFinished] = useState(false);
  const [driversChamp, setDriversChamp] = useState({ LEC: 0, HAM: 0, VER: 0, NOR: 0 });
  const [constructorsChamp, setConstructorsChamp] = useState({ Ferrari: 0, 'Red Bull': 0, McLaren: 0 });

  const tireLife = { Soft: 15, Medium: 22, Hard: 30 };

  useEffect(() => {
    if (lap >= totalLaps && !raceFinished) {
      finishRace();
    }
  }, [lap]);

  function getTirePercent(car) {
    const max = tireLife[car.compound] || 20;
    return Math.max(0, Math.round((1 - car.tireAge / max) * 100));
  }

  function advance(laps = 1) {
    if (raceFinished) return;
    setField(prev => {
      let updated = prev.map(car => {
        let newAge = car.tireAge + laps;
        let drop = 0;
        const max = tireLife[car.compound] || 20;
        if (newAge > max * 0.75) drop = 0.4;
        if (newAge > max) drop = 1.2;
        return { ...car, tireAge: newAge, pace: car.pace + drop * 0.01 + (car.penalty * 0.002) };
      });
      updated.sort((a, b) => (a.pace + a.tireAge * 0.008 + a.penalty * 0.05) - (b.pace + b.tireAge * 0.008 + b.penalty * 0.05));
      updated.forEach((c, i) => c.pos = i + 1);
      return updated;
    });
    setLap(l => Math.min(l + laps, totalLaps));
    setLog(l => [...l, `Advanced ${laps} lap(s).`]);
  }

  function pit(driverId) {
    if (raceFinished) return;
    setField(prev => prev.map(car => {
      if (car.id === driverId) {
        return { ...car, compound: pitCompound, tireAge: 0, pits: car.pits + 1, pace: Math.max(0.9, car.pace - 0.04) };
      }
      return car;
    }));
    setLog(l => [...l, `${driverId} pitted for ${pitCompound}.`]);
  }

  function applyPenalty(driverId, type) {
    const amount = type === 'engine' ? 10 : type === 'gearbox' ? 5 : 3;
    setField(prev => prev.map(car => car.id === driverId ? { ...car, penalty: car.penalty + amount, pace: car.pace + 0.05 } : car));
    setLog(l => [...l, `${driverId} received ${type} penalty (+${amount}s effective).`]);
  }

  function finishRace() {
    setRaceFinished(true);
    const sorted = [...field].sort((a, b) => a.pos - b.pos);
    const winner = sorted[0];
    setLog(l => [...l, `RACE FINISHED. Winner: ${winner.name}`]);

    // Award points
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
          <div className="card">
            <h3>Drivers Championship</h3>
            {sortedDrivers.map(([id, pts]) => <p key={id}>{id}: {pts} pts</p>)}
          </div>
          <div className="card">
            <h3>Constructors Championship</h3>
            {sortedCons.map(([team, pts]) => <p key={team}>{team}: {pts} pts</p>)}
          </div>
        </div>
        <button onClick={() => { setRaceFinished(false); setLap(1); setField(initialField); setLog(['New race started.']); }}>New Race</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Ferrari Pit Strategy Simulator</h1>
      <p>Lap {lap} / {totalLaps} | Leader: {leader?.name} ({leader?.compound}, age {leader?.tireAge})</p>

      <div className="grid">
        <div className="card">
          <h2>Leclerc (P{lec?.pos})</h2>
          <p>Compound: {lec?.compound} | Age: {lec?.tireAge} | Pits: {lec?.pits} | Penalty: {lec?.penalty}s</p>
          <p>Tire left: {getTirePercent(lec)}%</p>
          <div className="tire-bar"><div style={{width: getTirePercent(lec)+'%', background: getTirePercent(lec)<20?'#e10600':'#0f0'}}></div></div>
          <button onClick={() => pit('LEC')}>Pit Leclerc</button>
          <button onClick={() => applyPenalty('LEC', 'engine')}>Engine Penalty</button>
          <button onClick={() => applyPenalty('LEC', 'gearbox')}>Gearbox Penalty</button>
          <button onClick={() => applyPenalty('LEC', 'mcu')}>MCU Penalty</button>
        </div>
        <div className="card">
          <h2>Hamilton (P{ham?.pos})</h2>
          <p>Compound: {ham?.compound} | Age: {ham?.tireAge} | Pits: {ham?.pits} | Penalty: {ham?.penalty}s</p>
          <p>Tire left: {getTirePercent(ham)}%</p>
          <div className="tire-bar"><div style={{width: getTirePercent(ham)+'%', background: getTirePercent(ham)<20?'#e10600':'#0f0'}}></div></div>
          <button onClick={() => pit('HAM')}>Pit Hamilton</button>
          <button onClick={() => applyPenalty('HAM', 'engine')}>Engine Penalty</button>
          <button onClick={() => applyPenalty('HAM', 'gearbox')}>Gearbox Penalty</button>
          <button onClick={() => applyPenalty('HAM', 'mcu')}>MCU Penalty</button>
        </div>
      </div>

      <div className="card" style={{marginTop: 20}}>
        <h2>Tire Life Leaderboard</h2>
        <table>
          <thead><tr><th>Driver</th><th>Compound</th><th>Age</th><th>% Left</th><th>Pits</th></tr></thead>
          <tbody>
            {[...field].sort((a,b) => getTirePercent(b) - getTirePercent(a)).map(car => (
              <tr key={car.id} style={{background: car.team === 'Ferrari' ? '#331111' : 'transparent'}}>
                <td>{car.name}</td>
                <td>{car.compound}</td>
                <td>{car.tireAge}</td>
                <td>{getTirePercent(car)}%</td>
                <td>{car.pits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{marginTop: 20}}>
        <h2>Full Field</h2>
        <table>
          <thead><tr><th>Pos</th><th>Driver</th><th>Compound</th><th>Tire Age</th><th>Pits</th><th>Penalty</th><th>Team</th></tr></thead>
          <tbody>
            {field.map(car => (
              <tr key={car.id} style={{background: car.team === 'Ferrari' ? '#331111' : 'transparent'}}>
                <td>{car.pos}</td><td>{car.name}</td><td>{car.compound}</td><td>{car.tireAge}</td><td>{car.pits}</td><td>{car.penalty}</td><td>{car.team}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{marginTop: 20}}>
        <select value={pitCompound} onChange={e => setPitCompound(e.target.value)}>
          <option>Soft</option><option>Medium</option><option>Hard</option>
        </select>
        <button onClick={() => advance(1)}>Advance 1 Lap</button>
        <button onClick={() => advance(5)}>Advance 5 Laps</button>
      </div>

      <div className="tire-symbols" style={{marginTop: 30, display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
        {field.map(car => (
          <div key={car.id} title={`${car.name}: ${getTirePercent(car)}%`} style={{textAlign: 'center'}}>
            <div style={{fontSize: '24px'}}>🛞</div>
            <div style={{height: '8px', width: '40px', background: '#333', margin: '4px auto'}}>
              <div style={{height: '100%', width: getTirePercent(car)+'%', background: getTirePercent(car)<25 ? '#e10600' : '#00c853'}}></div>
            </div>
            <small>{car.name.slice(0,3)}</small>
          </div>
        ))}
      </div>

      <div className="card" style={{marginTop: 20}}>
        <h3>Strategy Log</h3>
        {log.slice(-10).map((entry, i) => <p key={i}>{entry}</p>)}
      </div>
    </div>
  );
}