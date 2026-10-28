import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login, Signup } from "./pages/Auth";
import ProtectedRoute from './pages/protectedRoute';
import Dashboard from './pages/dashboard';


function App() {
  

  return (
    <>
      <Routes>
        <Route path="/login" element = {<Login />} />
        <Route path="/" element = {<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path='/dashboard' element={<Dashboard />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
