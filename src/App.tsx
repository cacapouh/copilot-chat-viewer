import { Routes, Route, Navigate } from 'react-router-dom';
import { UploadPage } from './pages/UploadPage';
import { ViewPage } from './pages/ViewPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/view" element={<ViewPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
