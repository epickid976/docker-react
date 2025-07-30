// App.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';

// Navigation Component - Learn component composition
const Navigation = ({ activeSection, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'testimonials', label: 'Reviews' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (sectionId) => {
    onNavigate(sectionId);
    setIsMenuOpen(false);
  };

  return (
    <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-brand">
          <span className="nav-logo">🐾</span>
          <span className="nav-title">EchoPath</span>
        </div>
        
        <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        <button 
          className="nav-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

// Comprehensive device and browser detection utility
const useDeviceDetection = () => {
  return useMemo(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const platform = navigator.platform || '';
    
    // Enhanced browser detection
    const isChrome = /Chrome/i.test(userAgent) && /Google Inc/i.test(navigator.vendor);
    const isSafari = /Safari/i.test(userAgent) && /Apple Computer/i.test(navigator.vendor) && !/Chrome/i.test(userAgent);
    const isFirefox = /Firefox/i.test(userAgent);
    const isEdge = /Edg/i.test(userAgent);
    const isOpera = /OPR/i.test(userAgent) || /Opera/i.test(userAgent);
    const isSamsung = /SamsungBrowser/i.test(userAgent);
    
    // Enhanced mobile/device detection
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(userAgent);
    const isWindows = /Win/i.test(platform);
    const isMacOS = /Mac/i.test(platform) && !isIOS;
    const isLinux = /Linux/i.test(platform) && !isAndroid;
    
    // Enhanced mobile detection including tablets
    const isMobile = /Mobi|Android/i.test(userAgent) || isIOS || 
                    window.innerWidth <= 768 || 
                    ('ontouchstart' in window) || 
                    (navigator.maxTouchPoints > 0);
    
    const isTablet = isIOS ? /iPad/.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1) :
                     isAndroid ? !/Mobi/i.test(userAgent) && window.innerWidth >= 768 : false;
    
    // Specific mobile browser detection
    const isIOSSafari = isIOS && isSafari;
    const isIOSChrome = isIOS && isChrome;
    const isAndroidChrome = isAndroid && isChrome;
    const isAndroidSamsung = isAndroid && isSamsung;
    
    // Feature detection
    const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)') || 
                                   CSS.supports('-webkit-backdrop-filter', 'blur(10px)');
    const supportsCustomProperties = CSS.supports('color', 'var(--test)');
    const supportsEnvVars = CSS.supports('padding', 'env(safe-area-inset-top)');
    const supportsViewportUnits = CSS.supports('height', '100vh');
    
    return {
      // Browsers
      isChrome, isSafari, isFirefox, isEdge, isOpera, isSamsung,
      // Operating Systems
      isIOS, isAndroid, isWindows, isMacOS, isLinux,
      // Device Types
      isMobile, isTablet,
      // Specific Combinations
      isIOSSafari, isIOSChrome, isAndroidChrome, isAndroidSamsung,
      // Feature Support
      supportsBackdropFilter, supportsCustomProperties, supportsEnvVars, supportsViewportUnits,
      // Viewport info
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }, []);
};

// Scroll detection hook - Learn custom hooks
const useScrollSpy = (sectionIds) => {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionIds]);

  return activeSection;
};

const FloatingElement = ({ children, delay = 0, duration = 3 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
      <div
          className={`floating-element ${isVisible ? 'visible' : ''}`}
          style={{ 
            animationDuration: `${duration}s`, 
            animationDelay: `${delay}s`,
            // Ensure smooth animations on all devices
            transform: 'translateZ(0)', // Force hardware acceleration
            willChange: isVisible ? 'auto' : 'transform, opacity'
          }}
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
  const device = useDeviceDetection();
  
  // Section references for navigation - Fixed to match actual sections
  const sectionIds = ['home', 'about', 'testimonials', 'contact'];
  const activeSection = useScrollSpy(sectionIds);

  // Smooth scroll navigation function
  const handleNavigate = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  // Optimized viewport height handling for all mobile devices
  const handleViewportResize = useCallback(() => {
    // Get the actual viewport height
    const vh = window.innerHeight * 0.01;
    const vw = window.innerWidth * 0.01;
    
    // Set CSS custom properties
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.documentElement.style.setProperty('--vw', `${vw}px`);
    
    // Force a repaint on mobile browsers to handle UI changes
    if (device.isMobile) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--actual-vh', `${window.innerHeight}px`);
        document.documentElement.style.setProperty('--actual-vw', `${window.innerWidth}px`);
      });
    }
  }, [device.isMobile]);

  useEffect(() => {
    // Apply device-specific classes
    const bodyClasses = [];
    
    // Operating system classes
    if (device.isIOS) bodyClasses.push('ios-device');
    if (device.isAndroid) bodyClasses.push('android-device');
    if (device.isWindows) bodyClasses.push('windows-device');
    if (device.isMacOS) bodyClasses.push('macos-device');
    
    // Browser classes
    if (device.isSafari) bodyClasses.push('safari-browser');
    if (device.isChrome) bodyClasses.push('chrome-browser');
    if (device.isFirefox) bodyClasses.push('firefox-browser');
    if (device.isEdge) bodyClasses.push('edge-browser');
    if (device.isSamsung) bodyClasses.push('samsung-browser');
    
    // Device type classes
    if (device.isMobile) bodyClasses.push('mobile-device');
    if (device.isTablet) bodyClasses.push('tablet-device');
    
    // Specific combination classes for targeted fixes
    if (device.isIOSSafari) bodyClasses.push('ios-safari');
    if (device.isIOSChrome) bodyClasses.push('ios-chrome');
    if (device.isAndroidChrome) bodyClasses.push('android-chrome');
    if (device.isAndroidSamsung) bodyClasses.push('android-samsung');
    
    // Feature support classes
    if (!device.supportsBackdropFilter) bodyClasses.push('no-backdrop-filter');
    if (!device.supportsCustomProperties) bodyClasses.push('no-custom-properties');
    if (!device.supportsEnvVars) bodyClasses.push('no-env-vars');
    
    // High DPI displays
    if (device.devicePixelRatio >= 2) bodyClasses.push('high-dpi');
    
    // Apply all classes
    document.body.className = bodyClasses.join(' ');

    // Initial viewport setup
    handleViewportResize();

    // Set up event listeners with passive option for better performance
    const resizeOptions = { passive: true };
    window.addEventListener('resize', handleViewportResize, resizeOptions);
    window.addEventListener('orientationchange', handleViewportResize, resizeOptions);
    
    // Additional mobile-specific event listeners
    if (device.isMobile) {
      // Handle touch events for better mobile experience
      window.addEventListener('touchstart', () => {}, resizeOptions);
      
      // Handle visual viewport changes (keyboard, etc.)
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportResize, resizeOptions);
      }
      
      // Handle iOS Safari specific issues
      if (device.isIOSSafari) {
        // Delay to handle Safari's delayed resize events
        const safariResizeHandler = () => {
          setTimeout(handleViewportResize, 100);
        };
        window.addEventListener('resize', safariResizeHandler, resizeOptions);
      }
    }

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleViewportResize);
      window.removeEventListener('orientationchange', handleViewportResize);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
    };
  }, [device, handleViewportResize]);

  // Optimized click handler with better touch support
  const handleClick = useCallback(() => {
    const button = document.querySelector('.cta-button');
    if (!button) return;
    
    // Provide immediate visual feedback
    button.style.transform = 'scale(1.1)';
    
    // Use requestAnimationFrame for smooth animation
    requestAnimationFrame(() => {
      setTimeout(() => {
        button.style.transform = 'scale(1)';
        
        // Better alert handling for different platforms
        const message = "🚀 Coming soon to Vision Pro, iOS, and Web!";
        
        if (device.isMobile) {
          // On mobile, use a more native-like notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('EchoPath', { body: message, icon: '/logo192.png' });
          } else {
            alert(message);
          }
        } else {
          alert(message);
        }
      }, 150);
    });
  }, [device.isMobile]);

  // Optimized hover handlers for touch devices
  const handleMouseEnter = useCallback(() => {
    if (!device.isMobile) {
      setIsHovered(true);
    }
  }, [device.isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (!device.isMobile) {
      setIsHovered(false);
    }
  }, [device.isMobile]);

  // Touch handlers for mobile devices
  const handleTouchStart = useCallback(() => {
    if (device.isMobile) {
      setIsHovered(true);
    }
  }, [device.isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (device.isMobile) {
      setTimeout(() => setIsHovered(false), 150);
    }
  }, [device.isMobile]);

  return (
      <div className="app-container">
        <Navigation
          activeSection={activeSection} 
          onNavigate={handleNavigate}
        />
        
        <div className="bg-elements">
          <div className="bg-circle bg-circle-1" />
          <div className="bg-circle bg-circle-2" />
          <div className="bg-circle bg-circle-3" />
        </div>

        {/* Home Section */}
                  <section id="home" className="section hero-section">
            <div className="main-content">

              {/*/!* Tailwind Test Component *!/*/}
              {/*<FloatingElement delay={0.2}>*/}
              {/*  <div className="max-w-md mx-auto mb-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">*/}
              {/*    <div className="text-center">*/}
              {/*      <div className="text-3xl mb-2">🚀🚀🚀</div>*/}
              {/*      <p className="text-blue-100 text-sm leading-relaxed">*/}
              {/*        If you see this with blue-purple gradient, Tailwind is properly integrated.*/}
              {/*      </p>*/}
              {/*      <div className="mt-4 flex flex-wrap gap-2 justify-center">*/}
              {/*        <span className="px-3 py-1 bg-green-500/30 rounded-full text-xs text-white border border-green-400/50">*/}
              {/*          ✅ Working*/}
              {/*        </span>*/}
              {/*        <span className="px-3 py-1 bg-blue-500/30 rounded-full text-xs text-white border border-blue-400/50">*/}
              {/*          📱 Responsive*/}
              {/*        </span>*/}
              {/*        <span className="px-3 py-1 bg-purple-500/30 rounded-full text-xs text-white border border-purple-400/50">*/}
              {/*          🎨 Utilities*/}
              {/*        </span>*/}
              {/*      </div>*/}
              {/*    </div>*/}
              {/*  </div>*/}
              {/*</FloatingElement>*/}
     
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
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onClick={handleClick}
                  aria-label="Begin the Journey with EchoPath"
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
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="section content-section">
          <div className="section-content">
            <FloatingElement delay={0.3}>
              <h2>About EchoPath</h2>
            </FloatingElement>
            <FloatingElement delay={0.6}>
              <p>
                EchoPath combines cutting-edge AI technology with evidence-based therapeutic approaches 
                to create personalized learning experiences for children with autism. Our virtual companion 
                adapts to each child's unique communication style and learning pace.
              </p>
            </FloatingElement>
            <FloatingElement delay={0.9}>
              <div className="about-features">
                <div className="about-feature">
                  <div className="about-icon">🧠</div>
                  <h3>AI-Powered</h3>
                  <p>Advanced algorithms adapt to each child's learning style</p>
                </div>
                <div className="about-feature">
                  <div className="about-icon">👩‍⚕️</div>
                  <h3>Therapist Approved</h3>
                  <p>Developed with speech-language pathologists</p>
                </div>
                <div className="about-feature">
                  <div className="about-icon">📱</div>
                  <h3>Cross-Platform</h3>
                  <p>Available on iOS, Vision Pro, and Web</p>
                </div>
              </div>
            </FloatingElement>
            
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="section content-section">
          <div className="section-content">
            <FloatingElement delay={0.3}>
              <h2>What Parents Say</h2>
            </FloatingElement>
            <FloatingElement delay={0.6}>
              <p>
                Thousands of families trust EchoPath to support their child's communication journey.
              </p>
            </FloatingElement>
            <FloatingElement delay={0.9}>
              <div className="testimonials-preview">
                <div className="testimonial">
                  <p>"EchoPath has been a game-changer for our family. My son now looks forward to his daily sessions!"</p>
                  <span>- Sarah, Parent</span>
                </div>
                <div className="testimonial">
                  <p>"The progress tracking helps me understand exactly how my child is developing."</p>
                  <span>- Dr. Martinez, SLP</span>
                </div>
                <div className="testimonial">
                  <p>"Finally, a tool that makes learning fun and engaging for children with autism."</p>
                  <span>- Mike, Father of two</span>
                </div>
              </div>
            </FloatingElement>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="section content-section">
          <div className="section-content">
            <FloatingElement delay={0.3}>
              <h2>Get in Touch</h2>
            </FloatingElement>
            <FloatingElement delay={0.6}>
              <p>
                Ready to start your child's communication journey? We're here to help.
              </p>
            </FloatingElement>
            <FloatingElement delay={0.9}>
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-icon">📧</div>
                  <span>epickid976@gmail.com</span>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">💬</div>
                  <span>Schedule a demo call</span>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📚</div>
                  <span>Access our resource library</span>
                </div>
              </div>
            </FloatingElement>
          </div>
        </section>

        <footer className="footer">
          <FloatingElement delay={0.3}>
            <div className="footer-note">
              <span>Built for therapists, daycares, and families</span>
            </div>
          </FloatingElement>
        </footer>
      </div>
  );
}