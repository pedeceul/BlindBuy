<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">Settings</h3>

    <!-- API Configuration -->
    <div class="bg-white rounded-lg shadow p-4">
      <h4 class="text-md font-medium text-gray-900 mb-3">Backend Configuration</h4>
      
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">API URL</label>
          <input
            v-model="settings.apiUrl"
            type="url"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="http://localhost:4000"
          />
          <p class="text-xs text-gray-500 mt-1">BlindBuy backend API endpoint</p>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700">Connection Status</label>
            <p class="text-xs text-gray-500">Check if backend is reachable</p>
          </div>
          <button
            @click="testConnection"
            :disabled="testingConnection"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <span v-if="testingConnection">Testing...</span>
            <span v-else>Test Connection</span>
          </button>
        </div>

        <div v-if="connectionStatus" class="flex items-center">
          <div class="w-2 h-2 rounded-full mr-2" :class="connectionStatus.success ? 'bg-green-500' : 'bg-red-500'"></div>
          <span class="text-sm" :class="connectionStatus.success ? 'text-green-600' : 'text-red-600'">
            {{ connectionStatus.message }}
          </span>
        </div>
      </div>
    </div>

    <!-- Extension Behavior -->
    <div class="bg-white rounded-lg shadow p-4">
      <h4 class="text-md font-medium text-gray-900 mb-3">Extension Behavior</h4>
      
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700">Auto-inject Reviews</label>
            <p class="text-xs text-gray-500">Automatically show review widget on OLX pages</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="settings.autoInject"
              type="checkbox"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700">Show Notifications</label>
            <p class="text-xs text-gray-500">Display notifications for review actions</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="settings.showNotifications"
              type="checkbox"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>

    <!-- Data Management -->
    <div class="bg-white rounded-lg shadow p-4">
      <h4 class="text-md font-medium text-gray-900 mb-3">Data Management</h4>
      
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700">Clear Local Data</label>
            <p class="text-xs text-gray-500">Remove all stored settings and cache</p>
          </div>
          <button
            @click="clearLocalData"
            class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear
          </button>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700">Export Data</label>
            <p class="text-xs text-gray-500">Download your reviews and settings</p>
          </div>
          <button
            @click="exportData"
            class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export
          </button>
        </div>
      </div>
    </div>

    <!-- About -->
    <div class="bg-white rounded-lg shadow p-4">
      <h4 class="text-md font-medium text-gray-900 mb-3">About</h4>
      
      <div class="space-y-2 text-sm text-gray-600">
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Backend:</strong> Go/GraphQL</p>
        <p><strong>Frontend:</strong> Vue.js 3</p>
        <p><strong>Database:</strong> PostgreSQL</p>
      </div>

      <div class="mt-4 pt-4 border-t border-gray-200">
        <a
          href="https://github.com/GoLabra/labra"
          target="_blank"
          class="text-blue-600 hover:text-blue-800 text-sm"
        >
          View LabraGo Documentation →
        </a>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <button
        @click="saveSettings"
        :disabled="saving"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        <span v-if="saving">Saving...</span>
        <span v-else>Save Settings</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReviewStore } from '../stores/reviewStore'
import { apiClient } from '../utils/apiClient'

const reviewStore = useReviewStore()

const settings = ref({
  apiUrl: 'http://localhost:4000',
  autoInject: true,
  showNotifications: true
})

const saving = ref(false)
const testingConnection = ref(false)
const connectionStatus = ref(null)

const saveSettings = async () => {
  saving.value = true
  try {
    // Update API client URL
    apiClient.setBaseUrl(settings.value.apiUrl)
    
    // Save to store and chrome storage
    await reviewStore.updateSettings(settings.value)
    
    // Show success notification
    if (settings.value.showNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Settings Saved',
        message: 'Your settings have been saved successfully.'
      })
    }
  } catch (error) {
    console.error('Failed to save settings:', error)
  } finally {
    saving.value = false
  }
}

const testConnection = async () => {
  testingConnection.value = true
  connectionStatus.value = null
  
  try {
    const isHealthy = await apiClient.healthCheck()
    connectionStatus.value = {
      success: isHealthy,
      message: isHealthy ? 'Connected successfully' : 'Connection failed'
    }
  } catch (error) {
    connectionStatus.value = {
      success: false,
      message: 'Connection failed: ' + error.message
    }
  } finally {
    testingConnection.value = false
  }
}

const clearLocalData = async () => {
  if (!confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
    return
  }
  
  try {
    await chrome.storage.sync.clear()
    await chrome.storage.local.clear()
    
    // Reset settings to defaults
    settings.value = {
      apiUrl: 'http://localhost:4000',
      autoInject: true,
      showNotifications: true
    }
    
    if (settings.value.showNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Data Cleared',
        message: 'All local data has been cleared.'
      })
    }
  } catch (error) {
    console.error('Failed to clear data:', error)
  }
}

const exportData = async () => {
  try {
    // Get all stored data
    const syncData = await chrome.storage.sync.get()
    const localData = await chrome.storage.local.get()
    
    const exportData = {
      settings: syncData,
      cache: localData,
      timestamp: new Date().toISOString()
    }
    
    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `olx-reviews-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    if (settings.value.showNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Data Exported',
        message: 'Your data has been exported successfully.'
      })
    }
  } catch (error) {
    console.error('Failed to export data:', error)
  }
}

onMounted(async () => {
  // Load current settings
  await reviewStore.loadSettings()
  settings.value = { ...reviewStore.settings }
})
</script> 