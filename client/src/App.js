// App.js
import React, { useState, useEffect } from 'react';
import './App.css';

const FloatingElement = ({ children, delay = 0, duration = 3 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
      <div
          className={`floating-element ${isVisible ? 'visible' : ''}`}
          style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
      >
        {children}
      </div>
  );
};

const PlatformBadge = ({ icon, text, delay }) => (
    <FloatingElement delay={delay}>
      <div className="platform-badge">
        <span className="badge-icon">{icon}</span>
        <span className="badge-text">{text}</span>
      </div>
    </FloatingElement>
);

export default function App() {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
    const isMobile = window.innerWidth <= 768;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS && isMobile) {
      document.body.classList.add('ios-blur');
      
      // Add specific class for iOS Safari to handle tab bar
      if (isSafari) {
        document.body.classList.add('ios-safari');
      }
      
      // Handle viewport height changes due to Safari's dynamic UI
      const handleResize = () => {
        // Force a repaint to handle Safari's viewport changes
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, []);

  const handleClick = () => {
    const button = document.querySelector('.cta-button');
    button.style.transform = 'scale(1.1)';
    setTimeout(() => {
      button.style.transform = 'scale(1)';
      alert("🚀 Coming soon to Vision Pro, iOS, and Web!");
    }, 150);
  };

  return (
      <div className="app-container">
        <div className="bg-elements">
          <div className="bg-circle bg-circle-1" />
          <div className="bg-circle bg-circle-2" />
          <div className="bg-circle bg-circle-3" />
        </div>

        <div className="main-content">
          <FloatingElement delay={0.5}>
            <div className="logo-section">
              <div className="logo">🐾</div>
              <h1 className="title">EchoPath</h1>
            </div>
          </FloatingElement>

          <FloatingElement delay={1}>
            <p className="tagline">
              Learning language through <span className="highlight">play & friendship</span>
            </p>
          </FloatingElement>

          <FloatingElement delay={1.2}>
            <p className="description">
              An immersive learning companion that helps children with autism build communication skills alongside their favorite virtual pet.
            </p>
          </FloatingElement>

          <FloatingElement delay={1.8}>
            <div className="features">
              <div className="feature"><div className="feature-icon">🎯</div><span>Personalized Lessons</span></div>
              <div className="feature"><div className="feature-icon">📊</div><span>Progress Tracking</span></div>
              <div className="feature"><div className="feature-icon">🎮</div><span>Interactive Learning</span></div>
            </div>
          </FloatingElement>

          <FloatingElement delay={2.2}>
            <button
                className={`cta-button ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleClick}
            >
              <span className="button-text">Begin the Journey</span>
              <span className="button-icon">✨</span>
            </button>
          </FloatingElement>

          <FloatingElement delay={2.5}>
            <div className="platform-badges">
              <PlatformBadge icon="🥽" text="Vision Pro" />
              <PlatformBadge icon="📱" text="iOS" />
              <PlatformBadge icon="🌐" text="Web App" />
            </div>
          </FloatingElement>

          <FloatingElement delay={2.8}>
            <div className="footer-note">
              <span>Built for therapists, daycares, and families</span>
            </div>
          </FloatingElement>
        </div>
      </div>
  );
}