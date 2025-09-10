import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RecipeProvider } from './context/RecipeContext.jsx';
import Home from './pages/Home.jsx';
import FoodOverview from './pages/FoodOverview.jsx';
import FoodInformation from './pages/FoodInformation.jsx';
import './App.css';

function App() {
  return (
    <RecipeProvider>
      <Router basename={process.env.PUBLIC_URL}>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/food-overview" element={<FoodOverview />} />
            <Route path="/food-information" element={<FoodInformation />} />
          </Routes>
        </div>
      </Router>
    </RecipeProvider>
  );
}

export default App;
