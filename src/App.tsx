import { HashRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './features/home/HomePage';
import { JoinPage } from './features/player/JoinPage';
import { PlayPage } from './features/player/PlayPage';

// Hash routing keeps deep links working on Pages, which has no SPA fallback.
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/host" element={<h1>Game Master</h1>} />
        <Route path="/join/:code?" element={<JoinPage />} />
        <Route path="/play/:code" element={<PlayPage />} />
      </Routes>
    </HashRouter>
  );
}
