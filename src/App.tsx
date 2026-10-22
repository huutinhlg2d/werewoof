import { HashRouter, Route, Routes } from 'react-router-dom';

// Hash routing keeps deep links working on Pages, which has no SPA fallback.
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<h1>Werewoof</h1>} />
        <Route path="/host" element={<h1>Game Master</h1>} />
        <Route path="/join/:code?" element={<h1>Join</h1>} />
      </Routes>
    </HashRouter>
  );
}
