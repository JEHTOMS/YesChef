import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RecipeProvider } from './context/RecipeContext.jsx';
import { SavedRecipesProvider } from './context/SavedRecipesContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { VoiceProvider } from './context/VoiceContext.jsx';
import Home from './pages/Home.jsx';
import FoodOverview from './pages/FoodOverview.jsx';
import FoodInformation from './pages/FoodInformation.jsx';
import Home2 from './NewUI/Home2.jsx';
import Menu from './NewUI/Menu.jsx';
import Profile from './NewUI/Profile.jsx';
import Plans from './NewUI/Plans.jsx';
import Speech from './NewUI/Speech.jsx';
import SavedRecipesPage from './NewUI/SavedRecipesPage.jsx';
import PrivacyPolicy from './NewUI/PrivacyPolicy.jsx';
import TermsOfService from './NewUI/TermsOfService.jsx';
import UnsaveConfirmModal from './NewUI/UnsaveConfirmModal.jsx';
import Snackbar from './components/Snackbar.jsx';
import CookieConsent from './components/CookieConsent.jsx';
import FloatingAudioContainer from './components/FloatingAudioContainer.jsx';
import './App.css';

function App() {
  return (
    <UserProvider>
      <RecipeProvider>
        <SavedRecipesProvider>
          <ModalProvider>
            <VoiceProvider>
              <Router>
              <div className="App">
                <Routes>
                  <Route path="/" element={<Home2 />} />
                  <Route path="/old" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/plans" element={<Plans />} />
                  <Route path="/speech" element={<Speech />} />
                  <Route path="/saved-recipes" element={<SavedRecipesPage />} />
                  <Route path="/food-overview" element={<FoodOverview />} />
                  <Route path="/food-information" element={<FoodInformation />} />
                  <Route path="/recipe" element={<FoodOverview />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                </Routes>
                {/* Global modals */}
                <UnsaveConfirmModal />
                <Snackbar />
                <FloatingAudioContainer />
                <CookieConsent />
              </div>
            </Router>
          </VoiceProvider>
        </ModalProvider>
      </SavedRecipesProvider>
    </RecipeProvider>
    </UserProvider>
  );
}

export default App;
