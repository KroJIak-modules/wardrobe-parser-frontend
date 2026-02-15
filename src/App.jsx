import React, { use, useEffect } from 'react';
import { Button } from '@gravity-ui/uikit';
import Header from './components/header/Header';
import { Outlet, Route, useLocation } from 'react-router-dom';
import { BrowserRouter, Routes } from 'react-router-dom';
import HeroCarousel from './components/HeroCarousel/HeroCarousel';
import NewItems from './pages/NewItems/NewItems';
import Footer from './components/footer/Footer';
import Navbar from './components/header/Navbar';
import ActionPanel from './components/header/ActionPanel';
import ShowItem from './pages/ShowItem/ShowItem';


export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('show')) {
      console.log('Navigated to /show, scrolling to top');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [location.pathname]);

  return (
    <>
      {!location.pathname.includes('show') && (
        <div className='main'>
          <button
            className='startButton'
            onClick={() => {
              window.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth',
              });
            }}
          >
            Нажмите, чтобы войти
          </button>
        </div>
      )}
      <Header />
      <Navbar />
      <ActionPanel />
      {!location.pathname.includes('show') && <HeroCarousel />}
      <div className='container'>
        <Routes>
          <Route path="/" element={<NewItems />} />
          <Route path="/show" element={<ShowItem />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}