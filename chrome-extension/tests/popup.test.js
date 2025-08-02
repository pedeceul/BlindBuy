/**
 * @jest-environment jsdom
 */

// Mock chrome API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    },
    onUpdateAvailable: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn(),
    reload: jest.fn()
  },
  action: {
    onClicked: {
      addListener: jest.fn()
    }
  },
  tabs: {
    onUpdated: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn(),
    create: jest.fn(),
    query: jest.fn()
  },
  scripting: {
    executeScript: jest.fn(() => Promise.resolve())
  },
  notifications: {
    create: jest.fn()
  },
  storage: {
    sync: {
      set: jest.fn(),
      get: jest.fn()
    }
  }
};

// Mock fetch
global.fetch = jest.fn();

// Import background script functions
const fs = require('fs');
const path = require('path');

// Read and execute the background script
const backgroundScriptPath = path.join(__dirname, '../src/background.js');
const backgroundScriptCode = fs.readFileSync(backgroundScriptPath, 'utf8');

// Execute background script in a controlled environment
const executeBackgroundScript = () => {
  // Create a function that will contain the background script code
  const backgroundScriptFunction = new Function(
    'chrome', 'console',
    backgroundScriptCode
  );
  
  // Execute with our mocks
  backgroundScriptFunction(global.chrome, console);
};

describe('Background Script', () => {
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

  describe('Extension Installation', () => {
    test('should set default settings on install', () => {
      // Execute background script
      executeBackgroundScript();

      // Get the onInstalled listener
      const onInstalledListeners = chrome.runtime.onInstalled.addListener.mock.calls;
      expect(onInstalledListeners.length).toBeGreaterThan(0);
      
      const listener = onInstalledListeners[0][0];

      // Simulate install event
      const installDetails = { reason: 'install' };
      listener(installDetails);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        settings: {
          apiUrl: 'http://localhost:4000',
          autoInject: true,
          showNotifications: true
        }
      });

      // Check notification was created (ignore emoji encoding)
      expect(chrome.notifications.create).toHaveBeenCalledWith({
        type: 'basic',
        iconUrl: 'icons/icon16.png',
        title: expect.stringContaining('BlindBuy Installed'),
        message: 'Visit any OLX ad page to see the review widget!'
      });
    });
  });

  describe('Extension Icon Click', () => {
    test('should inject widget when clicked on OLX page', async () => {
      // Execute background script
      executeBackgroundScript();

      // Get the onClicked listener
      const onClickedListeners = chrome.action.onClicked.addListener.mock.calls;
      expect(onClickedListeners.length).toBeGreaterThan(0);
      
      const listener = onClickedListeners[0][0];

      // Mock tab
      const tab = {
        id: 123,
        url: 'https://www.olx.ro/d/oferta/test-ad-ID123.html'
      };

      // Simulate click
      await listener(tab);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        { type: 'INJECT_WIDGET' }
      );
    });

    test('should open OLX homepage when clicked on non-OLX page', async () => {
      // Execute background script
      executeBackgroundScript();

      // Get the onClicked listener
      const onClickedListeners = chrome.action.onClicked.addListener.mock.calls;
      const listener = onClickedListeners[0][0];

      // Mock tab
      const tab = {
        id: 123,
        url: 'https://www.google.com'
      };

      // Simulate click
      await listener(tab);

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://www.olx.ro'
      });
    });
  });

  describe('Tab Updates', () => {
    test('should inject content script on OLX page load', () => {
      // Execute background script
      executeBackgroundScript();

      // Get the onUpdated listener
      const onUpdatedListeners = chrome.tabs.onUpdated.addListener.mock.calls;
      expect(onUpdatedListeners.length).toBeGreaterThan(0);
      
      const listener = onUpdatedListeners[0][0];

      // Mock tab update
      const tabId = 123;
      const changeInfo = { status: 'complete' };
      const tab = {
        id: tabId,
        url: 'https://www.olx.ro/d/oferta/test-ad-ID123.html'
      };

      // Simulate tab update
      listener(tabId, changeInfo, tab);

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['content.js']
      });
    });

    test('should not inject content script on non-OLX page', () => {
      // Execute background script
      executeBackgroundScript();

      // Get the onUpdated listener
      const onUpdatedListeners = chrome.tabs.onUpdated.addListener.mock.calls;
      const listener = onUpdatedListeners[0][0];

      // Mock tab update
      const tabId = 123;
      const changeInfo = { status: 'complete' };
      const tab = {
        id: tabId,
        url: 'https://www.google.com'
      };

      // Simulate tab update
      listener(tabId, changeInfo, tab);

      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    test('should not inject content script on incomplete page load', () => {
      // Execute background script
      executeBackgroundScript();

      // Get the onUpdated listener
      const onUpdatedListeners = chrome.tabs.onUpdated.addListener.mock.calls;
      const listener = onUpdatedListeners[0][0];

      // Mock tab update
      const tabId = 123;
      const changeInfo = { status: 'loading' };
      const tab = {
        id: tabId,
        url: 'https://www.olx.ro/d/oferta/test-ad-ID123.html'
      };

      // Simulate tab update
      listener(tabId, changeInfo, tab);

      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    test('should handle SHOW_NOTIFICATION message', () => {
      // Execute background script
      executeBackgroundScript();

      // Get the onMessage listener
      const onMessageListeners = chrome.runtime.onMessage.addListener.mock.calls;
      expect(onMessageListeners.length).toBeGreaterThan(0);
      
      const listener = onMessageListeners[0][0];

      // Mock message
      const message = {
        type: 'SHOW_NOTIFICATION',
        title: 'Test Title',
        message: 'Test Message'
      };

      // Simulate message
      listener(message, {}, jest.fn());

      expect(chrome.notifications.create).toHaveBeenCalledWith({
        type: 'basic',
        iconUrl: 'icons/icon16.png',
        title: 'Test Title',
        message: 'Test Message'
      });
    });
  });

  describe('Extension Lifecycle', () => {
    test('should handle extension startup', () => {
      // Execute background script
      executeBackgroundScript();

      // Get the onStartup listener
      const onStartupListeners = chrome.runtime.onStartup.addListener.mock.calls;
      expect(onStartupListeners.length).toBeGreaterThan(0);
      
      const listener = onStartupListeners[0][0];

      // Simulate startup
      listener();

      expect(console.log).toHaveBeenCalledWith('OLX Reviews extension started');
    });

    test('should handle extension updates', () => {
      // Execute background script
      executeBackgroundScript();

      // Get the onUpdateAvailable listener
      const onUpdateAvailableListeners = chrome.runtime.onUpdateAvailable.addListener.mock.calls;
      expect(onUpdateAvailableListeners.length).toBeGreaterThan(0);
      
      const listener = onUpdateAvailableListeners[0][0];

      // Simulate update available
      listener();

      expect(chrome.runtime.reload).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle content script injection errors', async () => {
      // Mock chrome.scripting.executeScript to throw error
      chrome.scripting.executeScript = jest.fn().mockRejectedValue(
        new Error('Injection failed')
      );

      // Execute background script
      executeBackgroundScript();

      // Get the onUpdated listener
      const onUpdatedListeners = chrome.tabs.onUpdated.addListener.mock.calls;
      const listener = onUpdatedListeners[0][0];

      // Mock tab update
      const tabId = 123;
      const changeInfo = { status: 'complete' };
      const tab = {
        id: tabId,
        url: 'https://www.olx.ro/d/oferta/test-ad-ID123.html'
      };

      // Simulate tab update
      await listener(tabId, changeInfo, tab);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to inject content script:',
        expect.any(Error)
      );
    });

    test('should handle widget injection errors', async () => {
      // Mock chrome.tabs.sendMessage to throw error
      chrome.tabs.sendMessage = jest.fn().mockRejectedValue(
        new Error('Message failed')
      );

      // Execute background script
      executeBackgroundScript();

      // Get the onClicked listener
      const onClickedListeners = chrome.action.onClicked.addListener.mock.calls;
      const listener = onClickedListeners[0][0];

      // Mock tab
      const tab = {
        id: 123,
        url: 'https://www.olx.ro/d/oferta/test-ad-ID123.html'
      };

      // Simulate click
      await listener(tab);

      expect(console.error).toHaveBeenCalledWith(
        'Error injecting widget:',
        expect.any(Error)
      );
    });
  });
}); 