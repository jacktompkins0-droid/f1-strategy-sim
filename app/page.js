'use client';
import { useState } from 'react';
import './globals.css';

const initialField = [
  { id: 'VER', name: 'Verstappen', team: 'Red Bull', pos: 1, compound: 'Medium', tireAge: 0, pits: 0, pace: 1.0 },
  { id: 'NOR', name: 'Norris', team: 'McLaren', pos: 2, compound: 'Soft', tireAge: 0, pits: 0, pace: 1.02 },
  { id: 'LEC', name: 'Leclerc', team: 'Ferrari', pos: 3, compound: 'Hard', tireAge: 0, pits: 0, pace: 1.05 },
  { id: 'HAM', name: 'Hamilton', team: 'Ferrari', pos: 4, compound: 'Hard', tireAge: 0, pits: 0, pace: 1.05 },
  { id: 'RUS', name: 'Russell', team: 'Mercedes', pos: 5, compound: 'Medium', tireAge: 0, pits: 0, pace: 1.06 },
  { id: 'PIA', name: 'Piastri', team: 'McLaren', pos: 6, compound: 'Soft', tireAge: 0, pits: 0, pace: 1.03 },
  { id: 'SAI', name: 'Sainz', team: 'Williams', pos: 7, compound: 'Medium', tireAge: 0, pits: 0, pace: 1.08 },
  { id: 'ALO', name: 'Alonso', team: 'Aston Martin', pos: 8, compound: 'Hard', tireAge: 0, pits: 0, pace: 1.07 },
];

export default function Home() {
  const [lap, setLap] = useState(1);
  const [totalLaps] = useState(57);
  const [field, setField] = useState(initialField);
  const [log, setLog] = useState(['Race started. Both Ferraris on Hards.']);
  const [lecAction, setLecAction] = useState('manage');
  const [hamAction, setHamAction] = useState('manage');
  const [pitCompound, setPitCompound] = useState('Medium');

  const tireLife = { Soft: 15, Medium: 22, Hard: 30 };

  function advance(laps = 1) {
    setField(prev => {
      let updated = prev.map(car => {
        let newAge = car.tireAge + laps;
        let drop = 0;
        if (newAge > tireLife[car.compound] * 0.7) drop = 0.3;
        if (newAge > tireLife[car.compound]) drop = 0.8;
        return { ...car, tireAge: newAge, pace: car.pace + drop * 0.01 };
      });
      // Simple sort by effective pace (lower better)
      updated.sort((a, b) => (a.pace + a.tireAge * 0.01) - (b.pace + b.tireAge * 0.01));
      updated.forEach((c, i) => c.pos = i + 1);
      return updated;
    });
    setLap(l => Math.min(l + laps, totalLaps));
    setLog(l => [...l, `Advanced ${laps} lap(s).`]);
  }

  function pit(driverId) {
    setField(prev => prev.map(car => {
      if (car.id === driverId) {
        return { ...car, compound: pitCompound, tireAge: 0, pits: car.pits + 1, pace: car.pace - 0.05 };
      }
      return car;
    }));
    setLog(l => [...l, `${driverId} pitted for ${pitCompound}.`]);
  }

  const lec = field.find(c => c.id === 'LEC');
  const ham = field.find(c => c.id === 'HAM');
  const leader = field.find(c => c.pos === 1);

  return (
    <div className="container">
      <h1>Ferrari Pit Strategy Simulator</h1>
      <p>Lap {lap} / {totalLaps} | Leader: {leader?.name} ({leader?.compound}, {leader?.tireAge} laps old)</p>
      
      <div className="grid">
        <div className="card">
          <h2>Leclerc (P{lec?.pos})</h2>
          <p>Compound: {lec?.compound} | Age: {lec?.tireAge} | Pits: {lec?.pits}</p>
          <p>Gap to leader: ~{(lec?.pos - 1) * 2.5}s</p>
          <select value={lecAction} onChange={e => setLecAction(e.target.value)}>
            <option value="push">Push</option>
            <option value="manage">Manage</option>
            <option value="conserve">Conserve</option>
          </select>
          <button onClick={() => pit('LEC')}>Pit Leclerc</button>
        </div>
        <div className="card">
          <h2>Hamilton (P{ham?.pos})</h2>
          <p>Compound: {ham?.compound} | Age: {ham?.tireAge} | Pits: {ham?.pits}</p>
          <p>Gap to leader: ~{(ham?.pos - 1) * 2.5}s</p>
          <select value={hamAction} onChange={e => setHamAction(e.target.value)}>
            <option value="push">Push</option>
            <option value="manage">Manage</option>
            <option value="conserve">Conserve</option>
          </select>
          <button onClick={() => pit('HAM')}>Pit Hamilton</button>
        </div>
      </div>

      <div className="card" style={{marginTop: 20}}>
        <h2>Full Field</h2>
        <table>
          <thead>
            <tr><th>Pos</th><th>Driver</th><th>Compound</th><th>Tire Age</th><th>Pits</th><th>Team</th></tr>
          </thead>
          <tbody>
            {field.map(car => (
              <tr key={car.id} style={{background: car.team === 'Ferrari' ? '#331111' : 'transparent'}}>
                <td>{car.pos}</td>
                <td>{car.name}</td>
                <td>{car.compound}</td>
                <td>{car.tireAge}</td>
                <td>{car.pits}</td>
                <td>{car.team}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{marginTop: 20}}>
        <select value={pitCompound} onChange={e => setPitCompound(e.target.value)}>
          <option>Soft</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <button onClick={() => advance(1)}>Advance 1 Lap</button>
        <button onClick={() => advance(5)}>Advance 5 Laps</button>
      </div>

      <div className="card" style={{marginTop: 20}}>
        <h3>Strategy Log</h3>
        {log.slice(-8).map((entry, i) => <p key={i}>{entry}</p>)}
      </div>
    </div>
  );
}