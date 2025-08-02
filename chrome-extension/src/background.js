// Background service worker for OLX Reviews extension
console.log('OLX Reviews background script loaded');

// Set default settings on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('OLX Reviews extension installed');
    chrome.storage.sync.set({
      settings: {
        apiUrl: 'http://localhost:4000',
        autoInject: true,
        showNotifications: true
      }
    });
    
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon16.png',
      title: 'BlindBuy Installed! ��',
      message: 'Visit any OLX ad page to see the review widget!'
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked on tab:', tab.url);
  
  if (tab.url && tab.url.includes('olx')) {
    // Inject the review widget
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'INJECT_WIDGET' });
      console.log('Widget injection message sent');
    } catch (error) {
      console.error('Error injecting widget:', error);
    }
  } else {
    // Open OLX homepage if not on OLX
    chrome.tabs.create({ url: 'https://www.olx.ro' });
  }
});

// Inject content script on OLX pages
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('olx')) {
    console.log('OLX page loaded, injecting content script:', tab.url);
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch((error) => {
      console.error('Failed to inject content script:', error);
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.type === 'SHOW_NOTIFICATION') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon16.png',
      title: message.title,
      message: message.message
    });
  }
});

// Extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('OLX Reviews extension started');
});

// Handle extension updates
chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload();
});

console.log('Background script setup complete'); 