import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.js';
import reportWebVitals from './reportWebVitals.js';
import { RecipeProvider } from './context/RecipeContext.jsx';

// Import all components that might be previewed
import SavedRecipes from './components/SavedRecipes.jsx';
import Button from './components/Button.jsx';
import Directions from './components/Directions.jsx';
import ErrorOverlay from './components/ErrorOverlay.jsx';
import FoodDetails from './components/FoodDetails.jsx';
import FoodHero from './components/FoodHero.jsx';
import Footer from './components/Footer.jsx';
import Ingredients from './components/Ingredients.jsx';
import Input from './components/Input.jsx';
import Input2 from './NewUI/Input2.jsx';
import Home2 from './NewUI/Home2.jsx';
import Menu from './NewUI/Menu.jsx';
import Profile from './NewUI/Profile.jsx';
import Plans from './NewUI/Plans.jsx';
import Modal from './NewUI/Modal.jsx';
import NewNavbar from './NewUI/NewNavbar.jsx';
import LoadingOverlay from './components/LoadingOverlay.jsx';
import Navbar from './components/Navbar.jsx';
import Steps from './components/Steps.jsx';
import Stores from './components/Stores.jsx';
import ToNote from './components/ToNote.jsx';
import EmptyState from './NewUI/EmptyStates.jsx';

// ============================================
// COMPONENT ISOLATION MODE
// Toggle to preview individual components
// ============================================
const COMPONENT_PREVIEW_MODE = process.env.REACT_APP_PREVIEW_MODE === 'true';
const PREVIEW_COMPONENT = process.env.REACT_APP_PREVIEW_COMPONENT;

console.log('Preview Mode Debug:', {
  REACT_APP_PREVIEW_MODE: process.env.REACT_APP_PREVIEW_MODE,
  REACT_APP_PREVIEW_COMPONENT: process.env.REACT_APP_PREVIEW_COMPONENT,
  COMPONENT_PREVIEW_MODE,
  PREVIEW_COMPONENT
});

// Map of available components for preview
const COMPONENT_MAP = {
  SavedRecipes,
  Button,
  Directions,
  ErrorOverlay,
  FoodDetails,
  FoodHero,
  Footer,
  Ingredients,
  Input,
  Input2,
  Home2,
  Menu,
  Profile,
  Plans,
  Modal,
  NewNavbar,
  LoadingOverlay,
  Navbar,
  Steps,
  Stores,
  ToNote,
  EmptyState
};

const root = ReactDOM.createRoot(document.getElementById('root'));

if (COMPONENT_PREVIEW_MODE && PREVIEW_COMPONENT) {
  const PreviewComponent = COMPONENT_MAP[PREVIEW_COMPONENT];
  
  if (PreviewComponent) {
    console.log('Successfully loaded component:', PREVIEW_COMPONENT);
    
    // Full page components (like Home2, Menu, Profile) should render without wrapper
    const isPageComponent = PREVIEW_COMPONENT.toLowerCase().includes('home') || 
                           PREVIEW_COMPONENT.toLowerCase().includes('page') ||
                           PREVIEW_COMPONENT.toLowerCase().includes('menu') ||
                           PREVIEW_COMPONENT.toLowerCase().includes('profile') ||
                           PREVIEW_COMPONENT.toLowerCase().includes('plans');
    
    if (isPageComponent) {
      // Render full page components with Router, RecipeProvider, and Routes for navigation
      root.render(
        <React.StrictMode>
          <BrowserRouter>
            <RecipeProvider>
              <Routes>
                <Route path="/" element={<PreviewComponent />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/home2" element={<Home2 />} />
              </Routes>
            </RecipeProvider>
          </BrowserRouter>
        </React.StrictMode>
      );
    } else {
      // Render component in isolation with mock data wrapper
      root.render(
        <React.StrictMode>
          <div style={{ padding: '20px', minHeight: '100vh' }}>
            <div style={{ 
              backgroundColor: '#f0f0f0', 
              padding: '10px', 
              marginBottom: '20px',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#666'
            }}>
              <strong>Preview Mode:</strong> {PREVIEW_COMPONENT}
            </div>
            <PreviewComponent />
          </div>
        </React.StrictMode>
      );
    }
  } else {
    console.error(`Component not found: ${PREVIEW_COMPONENT}`);
    root.render(
      <React.StrictMode>
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Component Not Found</h1>
          <p>Could not find component: {PREVIEW_COMPONENT}</p>
        </div>
      </React.StrictMode>
    );
  }
} else {
  // Normal app mode
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
