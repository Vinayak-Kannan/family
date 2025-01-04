import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import FamilyTree from "./Family.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FamilyTree />
  </StrictMode>,
)
