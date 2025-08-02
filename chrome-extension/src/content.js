// Content script for OLX Reviews extension
console.log('OLX Reviews content script loaded');

// Safe DOM access helper
function safeQuerySelector(selector) {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.warn('Error querying selector:', selector, error);
    return null;
  }
}

// Safe text content extraction
function safeTextContent(element) {
  try {
    if (!element) return '';
    return element.textContent?.trim() || '';
  } catch (error) {
    console.warn('Error extracting text content:', error);
    return '';
  }
}

// Extract ad information from OLX page
function extractAdInfo() {
  try {
    console.log('Extracting ad info from current page...');
    
    // Simple selectors for OLX page
    const selectors = {
      title: [
        '[data-cy="offer_title"] h4',
        '[data-testid="offer_title"] h4',
        'h1',
        'h2',
        'h3',
        'h4'
      ],
      price: [
        '[data-cy="ad_price"]',
        '[data-testid="ad_price"]',
        '[class*="price"]'
      ],
      seller: [
        '[data-cy="ad_owner_name"]',
        '[data-testid="ad_owner_name"]',
        '[class*="owner"]'
      ],
      description: [
        '[data-cy="ad_description"] .css-19duwlz',
        '[data-testid="ad_description"] .css-19duwlz',
        '[data-cy="ad_description"]',
        '[data-testid="ad_description"]'
      ]
    };

    const adInfo = {
      id: generateAdId(),
      title: '',
      price: '',
      seller: '',
      description: '',
      url: window.location.href,
      pageType: 'ad'
    };

    // Extract title
    for (const selector of selectors.title) {
      const element = safeQuerySelector(selector);
      if (element) {
        const text = safeTextContent(element);
        if (text && text.length > 5 && !text.includes('Video Player')) {
          adInfo.title = text;
          console.log('Found title:', text);
          break;
        }
      }
    }

    // Extract price
    for (const selector of selectors.price) {
      const element = safeQuerySelector(selector);
      if (element) {
        const text = safeTextContent(element);
        if (text && (text.includes('RON') || text.includes('€') || /\d/.test(text))) {
          adInfo.price = text;
          console.log('Found price:', text);
          break;
        }
      }
    }

    // Extract seller
    for (const selector of selectors.seller) {
      const element = safeQuerySelector(selector);
      if (element) {
        const text = safeTextContent(element);
        if (text && text.length > 2 && !text.includes('Video Player')) {
          adInfo.seller = text;
          console.log('Found seller:', text);
          break;
        }
      }
    }

    // Extract description
    for (const selector of selectors.description) {
      const element = safeQuerySelector(selector);
      if (element) {
        const text = safeTextContent(element);
        if (text && text.length > 10 && !text.includes('Video Player')) {
          adInfo.description = text;
          console.log('Found description:', text.substring(0, 100) + '...');
          break;
        }
      }
    }

    // Fallback for title
    if (!adInfo.title) {
      try {
        const title = document.title?.split('•')[0]?.trim() || 'Unknown Title';
        adInfo.title = title;
      } catch (error) {
        console.warn('Error getting document title:', error);
        adInfo.title = 'Unknown Title';
      }
    }

    console.log('Extracted ad info:', adInfo);
    return adInfo;
  } catch (error) {
    console.error('Error extracting ad info:', error);
    return null;
  }
}

// Generate a unique ID for the ad
function generateAdId() {
  try {
    const url = window.location.href;
    const title = document.title || '';
    const hash = btoa(url + title).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    return `ad_${hash}`;
  } catch (error) {
    console.warn('Error generating ad ID:', error);
    return `ad_${Date.now()}`;
  }
}

// Check if current page is an OLX ad page
function isAdPage() {
  try {
    const url = window.location.href;
    const isOlx = url.includes('olx');
    const hasAdPath = url.includes('/d/') || url.includes('/ad/') || url.includes('/oferta/');
    return isOlx && hasAdPath;
  } catch (error) {
    console.warn('Error checking if ad page:', error);
    return false;
  }
}

// Create and inject the review widget
function injectReviewWidget() {
  try {
    if (!isAdPage()) return;

    // Remove existing widget if present
    const existingWidget = document.getElementById('blindbuy-widget');
    if (existingWidget) {
      existingWidget.remove();
    }

    const adInfo = extractAdInfo();
    if (!adInfo) return;

    // Create widget HTML
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

    // Inject widget
    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = widgetHTML;
    document.body.appendChild(widgetContainer.firstElementChild);

    // Add event listeners
    setupWidgetEvents(adInfo);
  } catch (error) {
    console.error('Error injecting widget:', error);
  }
}

// Setup widget event listeners
function setupWidgetEvents(adInfo) {
  try {
    const widget = document.getElementById('blindbuy-widget');
    const closeBtn = document.getElementById('blindbuy-close');
    const stars = document.querySelectorAll('.blindbuy-star');
    const reviewInput = document.getElementById('blindbuy-review');
    const submitBtn = document.getElementById('blindbuy-submit');
    const messageDiv = document.getElementById('blindbuy-message');

    if (!widget || !closeBtn || !stars || !reviewInput || !submitBtn || !messageDiv) {
      console.error('Widget elements not found');
      return;
    }

    let selectedRating = 0;

    // Close button
    closeBtn.addEventListener('click', () => {
      widget.remove();
    });

    // Star rating
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.rating);
        selectedRating = rating;
        
        stars.forEach((s, index) => {
          s.style.color = index < rating ? '#ffd700' : '#ccc';
        });
      });
    });

    // Submit review
    submitBtn.addEventListener('click', async () => {
      if (selectedRating === 0) {
        messageDiv.textContent = 'Please select a rating';
        messageDiv.style.color = '#f87171';
        return;
      }

      const reviewText = reviewInput.value.trim();
      if (!reviewText) {
        messageDiv.textContent = 'Please write a review';
        messageDiv.style.color = '#f87171';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      messageDiv.textContent = '';
      messageDiv.style.color = '';

      try {
        // Send review to backend
        const response = await fetch('http://localhost:4000/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation CreateAdReview($input: CreateAdReviewInput!) {
                createAdReview(input: $input) {
                  id
                  rating
                  comment
                  createdAt
                }
              }
            `,
            variables: {
              input: {
                adUrl: adInfo.url,
                adTitle: adInfo.title,
                adPrice: adInfo.price,
                rating: selectedRating,
                comment: reviewText
              }
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.data?.createAdReview) {
          messageDiv.textContent = 'Review submitted successfully!';
          messageDiv.style.color = '#4ade80';
          
          // Reset form
          selectedRating = 0;
          stars.forEach(s => s.style.color = '#ccc');
          reviewInput.value = '';
        } else if (result.errors) {
          throw new Error(result.errors[0]?.message || 'API returned errors');
        } else {
          throw new Error('Failed to submit review - unexpected response');
        }
      } catch (error) {
        console.error('Error submitting review:', error);
        
        // Provide specific error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          messageDiv.textContent = 'Backend server not available. Please try again later.';
        } else if (error.message.includes('HTTP 500')) {
          messageDiv.textContent = 'Server error. Please try again later.';
        } else {
          messageDiv.textContent = 'Failed to submit review. Please try again.';
        }
        messageDiv.style.color = '#f87171';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Review';
      }
    });
  } catch (error) {
    console.error('Error setting up widget events:', error);
  }
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    console.log('Content script received message:', message);

    if (message.type === 'INJECT_WIDGET') {
      injectReviewWidget();
      sendResponse({ success: true });
      return true;
    }

    if (message.type === 'GET_CURRENT_AD') {
      if (isAdPage()) {
        const adInfo = extractAdInfo();
        sendResponse({ ad: adInfo });
      } else {
        sendResponse({ error: 'Not an OLX ad page' });
      }
      return true;
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: 'Internal error' });
    return true;
  }
});

// Auto-inject widget on OLX ad pages
if (isAdPage()) {
  console.log('OLX ad page detected, injecting widget...');
  setTimeout(injectReviewWidget, 1000); // Wait for page to load
}

console.log('OLX Reviews content script ready'); 