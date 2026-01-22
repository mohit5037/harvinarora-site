import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Login from './pages/Login.tsx'
import Gallery from './pages/Gallery.tsx'
import Admin from './pages/Admin.tsx'
import Expenses from './pages/Expenses.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/settings" element={<Admin />} />
          <Route path="/expenses" element={<Expenses />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
