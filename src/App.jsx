import React, { use, useEffect, useState } from 'react';
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
import AboutMe from './pages/AboutMe/AboutMe';
import Designers from './pages/Designers/Designers';
import Cart from './pages/Cart/Cart';
import ShowDesigner from './pages/ShowDesigner/ShowDesigner';
import QnA from './pages/QnA/QnA';


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
    } else {
      const handleWheel = (e) => {
        const scrollTop = window.scrollY;
        const screenHeight = window.innerHeight;

        if (e.deltaY > 0 && scrollTop > 0 && scrollTop < screenHeight) {
          e.preventDefault();
          window.scrollTo({
            top: screenHeight,
            behavior: 'smooth',
          });
        }
      };

      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => window.removeEventListener('wheel', handleWheel);
    }
  }, [location.pathname]);

  const [navHeight, setNavHeight] = useState(0);

  console.log(navHeight);

  return (
    <>
      {!location.pathname.includes('show') && !location.pathname.includes('about') && (
        <div className='main'>
          <button
            className='startButton'
            onClick={() => window.scrollTo({
              top: window.innerHeight,
              behavior: 'smooth',
            })}
          >
            Нажмите, чтобы войти
          </button>
        </div>
      )}
      <Header />
      <Navbar setNavHeight={setNavHeight} />
      <ActionPanel navHeight={navHeight} />
      <div style={{marginTop: -(navHeight * 0.00001) + 'px'}}>
      {!location.pathname.includes('show') && !location.pathname.includes('about') && <HeroCarousel />}
      <div className='container'>
        <Routes>
          <Route path="/" element={<NewItems title={"Новинки"} />} />
          <Route path="/men" element={<NewItems title={"Мужское"} />} />
          <Route path="/women" element={<NewItems title={"Женское"} />} />
          <Route path="/discounts" element={<NewItems title={"Скидки"} />} />
          <Route path="/designer" element={<ShowDesigner title={""}/>} />
          <Route path="/questions" element={<QnA title={"Вопросы"}/>} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/designers" element={<Designers />} />
          <Route path="/show" element={<ShowItem />} />
          <Route path="/about" element={<AboutMe />} />
        </Routes>
      </div>
      <Footer />
      </div>
    </>
  );
}