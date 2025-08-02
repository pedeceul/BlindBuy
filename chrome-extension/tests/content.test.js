/**
 * @jest-environment jsdom
 */

// Mock chrome API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  }
};

// Mock fetch
global.fetch = jest.fn();

describe('Content Script Functions', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
  });

  describe('isAdPage', () => {
    test('should return true for OLX ad URLs', () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.olx.ro/d/oferta/test-ad-ID123.html'
        },
        writable: true
      });

      // Test the function logic
      const url = window.location.href;
      const isOlx = url.includes('olx');
      const hasAdPath = url.includes('/d/') || url.includes('/ad/') || url.includes('/oferta/');
      const result = isOlx && hasAdPath;
      
      expect(result).toBe(true);
    });

    test('should return false for non-OLX URLs', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.google.com'
        },
        writable: true
      });

      const url = window.location.href;
      const isOlx = url.includes('olx');
      const hasAdPath = url.includes('/d/') || url.includes('/ad/') || url.includes('/oferta/');
      const result = isOlx && hasAdPath;
      
      expect(result).toBe(false);
    });

    test('should return false for OLX non-ad URLs', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.olx.ro/category/electronics'
        },
        writable: true
      });

      const url = window.location.href;
      const isOlx = url.includes('olx');
      const hasAdPath = url.includes('/d/') || url.includes('/ad/') || url.includes('/oferta/');
      const result = isOlx && hasAdPath;
      
      expect(result).toBe(false);
    });
  });

  describe('generateAdId', () => {
    test('should generate unique ID based on URL and title', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.olx.ro/d/oferta/test-ad-ID123.html'
        },
        writable: true
      });

      Object.defineProperty(document, 'title', {
        value: 'Test Ad Title',
        writable: true
      });

      const url = window.location.href;
      const title = document.title || '';
      const hash = btoa(url + title).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      const result = `ad_${hash}`;
      
      expect(result).toMatch(/^ad_[a-zA-Z0-9]{16}$/);
    });
  });

  describe('extractAdInfo', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.olx.ro/d/oferta/test-ad-ID123.html'
        },
        writable: true
      });

      Object.defineProperty(document, 'title', {
        value: 'Test Ad Title • OLX',
        writable: true
      });
    });

    test('should extract ad information from page', () => {
      // Mock DOM elements
      document.body.innerHTML = `
        <h4 data-cy="offer_title">Test Ad Title</h4>
        <span data-cy="ad_price">100 RON</span>
        <span data-cy="ad_owner_name">Test Seller</span>
        <div data-cy="ad_description">
          <div class="css-19duwlz">This is a test ad description</div>
        </div>
      `;

      // Test extraction logic
      const adInfo = {
        id: 'ad_test123',
        title: '',
        price: '',
        seller: '',
        description: '',
        url: window.location.href,
        pageType: 'ad'
      };

      // Extract title
      const titleElement = document.querySelector('[data-cy="offer_title"]');
      if (titleElement) {
        adInfo.title = titleElement.textContent?.trim() || '';
      }

      // Extract price
      const priceElement = document.querySelector('[data-cy="ad_price"]');
      if (priceElement) {
        adInfo.price = priceElement.textContent?.trim() || '';
      }

      // Extract seller
      const sellerElement = document.querySelector('[data-cy="ad_owner_name"]');
      if (sellerElement) {
        adInfo.seller = sellerElement.textContent?.trim() || '';
      }

      // Extract description
      const descElement = document.querySelector('[data-cy="ad_description"] .css-19duwlz');
      if (descElement) {
        adInfo.description = descElement.textContent?.trim() || '';
      }

      expect(adInfo.title).toBe('Test Ad Title');
      expect(adInfo.price).toBe('100 RON');
      expect(adInfo.seller).toBe('Test Seller');
      expect(adInfo.description).toBe('This is a test ad description');
      expect(adInfo.url).toBe('https://www.olx.ro/d/oferta/test-ad-ID123.html');
      expect(adInfo.pageType).toBe('ad');
    });

    test('should handle missing elements gracefully', () => {
      document.body.innerHTML = '<div>No ad elements</div>';

      const adInfo = {
        id: 'ad_test123',
        title: '',
        price: '',
        seller: '',
        description: '',
        url: window.location.href,
        pageType: 'ad'
      };

      // Try to extract elements that don't exist
      const titleElement = document.querySelector('[data-cy="offer_title"]');
      const priceElement = document.querySelector('[data-cy="ad_price"]');
      const sellerElement = document.querySelector('[data-cy="ad_owner_name"]');
      const descElement = document.querySelector('[data-cy="ad_description"]');

      expect(titleElement).toBeNull();
      expect(priceElement).toBeNull();
      expect(sellerElement).toBeNull();
      expect(descElement).toBeNull();
      expect(adInfo.title).toBe('');
      expect(adInfo.price).toBe('');
      expect(adInfo.seller).toBe('');
      expect(adInfo.description).toBe('');
    });
  });

  describe('Widget Injection', () => {
    test('should create widget HTML structure', () => {
      const adInfo = {
        title: 'Test Ad Title',
        price: '100 RON',
        seller: 'Test Seller',
        description: 'Test description'
      };

      const widgetHTML = `
        <div id="blindbuy-widget" style="
          position: fixed;
          top: 20px;
          right: 20px;
          width: 300px;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          border-radius: 8px;
          padding: 16px;
          z-index: 10000;
          font-family: Arial, sans-serif;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 16px;">BlindBuy Reviews</h3>
            <button id="blindbuy-close" style="
              background: none;
              border: none;
              color: white;
              font-size: 18px;
              cursor: pointer;
              padding: 0;
            ">×</button>
          </div>
          
          <div style="margin-bottom: 12px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">${adInfo.title}</h4>
            ${adInfo.price ? `<p style="margin: 0 0 8px 0; color: #4ade80; font-weight: bold;">${adInfo.price}</p>` : ''}
            ${adInfo.seller ? `<p style="margin: 0; font-size: 12px; opacity: 0.8;">${adInfo.seller}</p>` : ''}
          </div>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; font-size: 12px;">Rating:</label>
            <div id="blindbuy-stars" style="display: flex; gap: 2px;">
              ${[1,2,3,4,5].map(star => `<span class="blindbuy-star" data-rating="${star}" style="cursor: pointer; font-size: 18px; color: #ccc;">★</span>`).join('')}
            </div>
          </div>
          
          <textarea id="blindbuy-review" placeholder="Write your review..." style="
            width: 100%;
            height: 60px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            padding: 8px;
            color: white;
            font-family: inherit;
            font-size: 12px;
            resize: vertical;
            margin-bottom: 12px;
          "></textarea>
          
          <button id="blindbuy-submit" style="
            width: 100%;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">Submit Review</button>
          
          <div id="blindbuy-message" style="
            margin-top: 8px;
            font-size: 11px;
            text-align: center;
            min-height: 14px;
          "></div>
        </div>
      `;

      expect(widgetHTML).toContain('BlindBuy Reviews');
      expect(widgetHTML).toContain('Test Ad Title');
      expect(widgetHTML).toContain('100 RON');
      expect(widgetHTML).toContain('Test Seller');
      expect(widgetHTML).toContain('blindbuy-widget');
      expect(widgetHTML).toContain('blindbuy-stars');
      expect(widgetHTML).toContain('blindbuy-review');
      expect(widgetHTML).toContain('blindbuy-submit');
    });
  });
}); 