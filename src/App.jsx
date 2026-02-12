import React from 'react';
import { Button } from '@gravity-ui/uikit';
import Header from './components/header/Header';
import { Outlet, Route } from 'react-router-dom';
import { BrowserRouter, Routes } from 'react-router-dom';

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
      <Header/>

      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/test" element={<div>Test</div>} />
      </Routes>
    </BrowserRouter>
  );
}