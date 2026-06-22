import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SavedProjects } from './pages/SavedProjects';
import { SetupReport } from './pages/SetupReport';
import { ImportWizard } from './pages/ImportWizard';
import { ReviewData } from './pages/ReviewData';
import { ReportA4 } from './pages/ReportA4';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SavedProjects />} />
          <Route path="/setup" element={<SetupReport />} />
          <Route path="/project/:id/import" element={<ImportWizard />} />
          <Route path="/project/:id/review" element={<ReviewData />} />
          <Route path="/project/:id/report" element={<ReportA4 />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
