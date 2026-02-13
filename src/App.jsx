import React from 'react';
import { Button } from '@gravity-ui/uikit';
import Header from './components/header/Header';
import { Outlet, Route } from 'react-router-dom';
import { BrowserRouter, Routes } from 'react-router-dom';
import HeroCarousel from './components/HeroCarousel/HeroCarousel';
import NewItems from './pages/NewItems/NewItems';
import Footer from './components/footer/Footer';
import Navbar from './components/header/Navbar';
import ActionPanel from './components/header/ActionPanel';

export default function App() {
  return (
    <BrowserRouter>
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
      <Header />
      <Navbar />
      <ActionPanel />
      <HeroCarousel />
      <div className='container'>
        <Routes>
          <Route path="/" element={<NewItems />} />
          <Route path="/test" element={<div>Test</div>} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  );
}