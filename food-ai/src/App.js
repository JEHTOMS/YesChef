import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RecipeProvider } from './context/RecipeContext.jsx';
import { SavedRecipesProvider } from './context/SavedRecipesContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import Home from './pages/Home.jsx';
import FoodOverview from './pages/FoodOverview.jsx';
import FoodInformation from './pages/FoodInformation.jsx';
import Home2 from './NewUI/Home2.jsx';
import Menu from './NewUI/Menu.jsx';
import Profile from './NewUI/Profile.jsx';
import Plans from './NewUI/Plans.jsx';
import UnsaveConfirmModal from './NewUI/UnsaveConfirmModal.jsx';
import './App.css';

function App() {
  return (
    <UserProvider>
      <RecipeProvider>
        <SavedRecipesProvider>
          <ModalProvider>
            <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<Home2 />} />
                <Route path="/old" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/food-overview" element={<FoodOverview />} />
                <Route path="/food-information" element={<FoodInformation />} />
                <Route path="/recipe" element={<FoodOverview />} />
              </Routes>
              {/* Global modals */}
              <UnsaveConfirmModal />
            </div>
          </Router>
        </ModalProvider>
      </SavedRecipesProvider>
    </RecipeProvider>
    </UserProvider>
  );
}

export default App;
