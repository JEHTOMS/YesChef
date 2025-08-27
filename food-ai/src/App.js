import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FoodOverview from './pages/FoodOverview';
import FoodInformation from './pages/FoodInformation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/food-overview" element={<FoodOverview />} />
          <Route path="/food-information" element={<FoodInformation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
