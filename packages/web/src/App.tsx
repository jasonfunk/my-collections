import { Routes, Route } from 'react-router-dom';

/**
 * App is the root component and routing entry point.
 * Pages will be added here as they are built.
 *
 * React Router v6 note: <Routes> replaces the old <Switch> from v5.
 * Each <Route> renders its element when the path matches.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<div>My Collections — coming soon</div>} />
    </Routes>
  );
}

export default App;
