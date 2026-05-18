import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import WorksheetGenerator from './pages/WorksheetGenerator'
import LessonPlanGenerator from './pages/LessonPlanGenerator'
import TeacherInsights from './pages/TeacherInsights'
import QuestionPaperGenerator from './pages/QuestionPaperGenerator'
import ClassActivityGenerator from './pages/ClassActivityGenerator'

function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', fontFamily: "'Inter', 'Outfit', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/worksheet" element={<WorksheetGenerator />} />
          <Route path="/lesson-plan" element={<LessonPlanGenerator />} />

          <Route path="/class-activity" element={<ClassActivityGenerator />} />
          <Route path="/teacher-insights" element={<TeacherInsights />} />
          <Route path="/question-paper" element={<QuestionPaperGenerator />} />
        </Route>

        <Route path="*" element={<Navigate to="/landing" />} />
      </Routes>
    </BrowserRouter>
  )
}
