import { BrowserRouter, Routes, Route } from 'react-router';
import { ComingSoonPage } from './components/ComingSoonPage';
import { WebinarPage } from './components/WebinarPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ComingSoonPage />} />
        <Route path="/webinar" element={<WebinarPage />} />
      </Routes>
    </BrowserRouter>
  );
}
