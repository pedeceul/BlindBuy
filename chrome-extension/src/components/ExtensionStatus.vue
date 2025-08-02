<template>
  <div class="olx-reviews-widget">
    <!-- Header -->
    <div class="olx-reviews-widget-header">
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">BlindBuy</span>
        <span v-if="currentAd" style="font-size: 12px; font-weight: 500; opacity: 0.95; line-height: 1.2;">
          {{ currentAd.title }} - {{ averageRating }}★ ({{ reviews.length }} reviews)
        </span>
        <span v-else style="font-size: 12px; font-weight: 500; opacity: 0.95; line-height: 1.2;">
          Loading...
        </span>
      </div>
      <button class="olx-reviews-widget-close" @click="closeWidget">X</button>
    </div>

    <!-- Content -->
    <div class="olx-reviews-widget-content">
      <!-- Loading State -->
      <div v-if="loading" style="text-align: center; padding: 20px;">
        <div style="color: #6b7280;">Loading ad information...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" style="padding: 12px; background: #fef2f2; border-radius: 6px; border-left: 4px solid #dc2626; margin-bottom: 12px;">
        <h5 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #991b1b;">Error</h5>
        <p style="margin: 0; font-size: 12px; color: #7f1d1d;">{{ error }}</p>
      </div>

      <!-- Category Page -->
      <div v-else-if="pageType === 'category'" style="margin-bottom: 12px; padding: 12px; background: #f3f4f6; border-radius: 6px; text-align: center;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #374151;">📋 Category Page</h4>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; line-height: 1.4;">
          This is a category listing page with multiple ads.
        </p>
        <p style="margin: 0; font-size: 11px; color: #9ca3af;">
          Please navigate to an individual ad or seller profile to use BlindBuy reviews.
        </p>
      </div>

      <!-- Ad/Seller Page -->
      <div v-else-if="currentAd">
        <!-- Ad Info -->
        <div style="margin-bottom: 12px;">
          <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600;">{{ currentAd.title }}</h4>
          <p v-if="currentAd.price" style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;">Price: {{ currentAd.price }}</p>
          <p v-if="currentAd.category" style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">Category: {{ currentAd.category }}</p>
        </div>

        <!-- User's Previous Review -->
        <div v-if="userReview && !canReview" style="margin-bottom: 12px; padding: 10px; background: #f3f4f6; border-radius: 6px;">
          <h5 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #374151;">Your Review</h5>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <div class="olx-reviews-stars">
              <span v-for="i in 5" :key="i" class="olx-reviews-star" :class="{ empty: i > userReview.rating }">★</span>
            </div>
            <span style="font-size: 11px; color: #6b7280;">You</span>
          </div>
          <p style="margin: 0; font-size: 12px; color: #374151;">{{ userReview.comment }}</p>
          <p style="margin: 6px 0 0 0; font-size: 10px; color: #9ca3af;">Submitted {{ formatTimeAgo(userReview.submittedAt) }}</p>
        </div>

        <!-- Review Form -->
        <div v-else style="margin-bottom: 12px;">
          <h5 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600;">Add Your Review</h5>
          
          <!-- Rating -->
          <div style="margin-bottom: 6px;">
            <label style="display: block; margin-bottom: 3px; font-size: 11px; color: #6b7280;">Rating *</label>
            <div class="olx-reviews-stars">
              <span 
                v-for="i in 5" 
                :key="i" 
                class="olx-reviews-star" 
                :class="{ empty: i > selectedRating }"
                @click="selectedRating = i"
                @mouseenter="hoverRating = i"
                @mouseleave="hoverRating = 0"
              >
                ★
              </span>
            </div>
            <div v-if="ratingError" style="color: #dc2626; font-size: 11px; margin-top: 3px;">{{ ratingError }}</div>
          </div>

          <!-- Comment -->
          <div style="margin-bottom: 6px;">
            <label style="display: block; margin-bottom: 3px; font-size: 11px; color: #6b7280;">Comment *</label>
            <textarea 
              v-model="reviewComment"
              class="olx-reviews-textarea" 
              rows="2" 
              placeholder="Share your experience..."
            ></textarea>
            <div v-if="commentError" style="color: #dc2626; font-size: 11px; margin-top: 3px;">{{ commentError }}</div>
          </div>

          <!-- Submit Button -->
          <div style="margin-top: 6px;">
            <button 
              class="olx-reviews-button" 
              :disabled="submittingReview || !isFormValid"
              @click="submitReview"
              :style="{ opacity: isFormValid ? 1 : 0.5, cursor: isFormValid ? 'pointer' : 'not-allowed' }"
            >
              <span v-if="submittingReview">Submitting...</span>
              <span v-else>Submit Review</span>
            </button>
            <div v-if="submitMessage" style="margin-top: 6px; font-size: 12px; color: #059669;">{{ submitMessage }}</div>
          </div>
        </div>

        <!-- Existing Reviews -->
        <div v-if="reviews.length > 0" style="margin-top: 12px;">
          <h5 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">Recent Reviews</h5>
          <div style="max-height: 120px; overflow-y: auto;">
            <div 
              v-for="review in reviews.slice(0, 2)" 
              :key="review.id"
              style="padding: 8px; border-bottom: 1px solid #f3f4f6; margin-bottom: 6px;"
            >
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                <div class="olx-reviews-stars">
                  <span v-for="i in 5" :key="i" class="olx-reviews-star" :class="{ empty: i > review.rating }">★</span>
                </div>
                <span style="font-size: 10px; color: #6b7280;">{{ review.user?.name || 'Anonymous' }}</span>
                <span style="font-size: 10px; color: #9ca3af;">{{ formatTimeAgo(review.createdAt) }}</span>
              </div>
              <p style="margin: 0; font-size: 11px; color: #374151;">{{ review.comment }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- No Ad Found -->
      <div v-else style="text-align: center; padding: 20px;">
        <div style="color: #6b7280;">No OLX ad found on this page.</div>
        <div style="margin-top: 6px; font-size: 11px; color: #9ca3af;">Navigate to an OLX ad or seller page to use BlindBuy.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useReviewStore } from '../stores/reviewStore'
import { apiClient } from '../utils/apiClient'

const reviewStore = useReviewStore()

// State
const currentAd = ref(null)
const reviews = ref([])
const loading = ref(true)
const error = ref(null)
const pageType = ref(null)
const selectedRating = ref(0)
const hoverRating = ref(0)
const reviewComment = ref('')
const submittingReview = ref(false)
const submitMessage = ref('')
const ratingError = ref('')
const commentError = ref('')
const userReview = ref(null)
const canReview = ref(true)

// Computed
const averageRating = computed(() => {
  if (reviews.value.length === 0) return '0.0'
  const total = reviews.value.reduce((sum, review) => sum + review.rating, 0)
  return (total / reviews.value.length).toFixed(1)
})

const isFormValid = computed(() => {
  return selectedRating.value > 0 && reviewComment.value.trim().length > 0
})

// Methods
const closeWidget = () => {
  // Send message to close the popup window
  chrome.runtime.sendMessage({ type: 'CLOSE_POPUP' })
}

const formatTimeAgo = (timestamp) => {
  const now = Date.now()
  const diff = now - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const extractAdData = async () => {
  try {
    // Get the current active tab (not the popup window)
    const tabs = await chrome.tabs.query({ active: true, currentWindow: false })
    const currentTab = tabs.find(tab => !tab.url?.includes('chrome-extension://'))
    
    if (!currentTab) {
      error.value = 'No active tab found. Please navigate to an OLX page.'
      loading.value = false
      return
    }

    // Use chrome.scripting.executeScript to extract ad data from the current tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      function: () => {
        // Extract ad data from the page
        const url = window.location.href
        const title = document.querySelector('h1')?.textContent?.trim() || 
                     document.querySelector('[data-cy="ad_title"]')?.textContent?.trim() ||
                     document.title
        
        const priceElement = document.querySelector('[data-cy="ad_price"]') || 
                           document.querySelector('.css-1wimjbb-Text') ||
                           document.querySelector('.price')
        const price = priceElement?.textContent?.trim()
        
        const categoryElement = document.querySelector('[data-cy="breadcrumb"]') ||
                              document.querySelector('.css-1wimjbb-Text')
        const category = categoryElement?.textContent?.trim()
        
        // Detect page type
        let pageType = 'ad'
        if (url.includes('/d/')) pageType = 'ad'
        else if (url.includes('/user/')) pageType = 'seller'
        else if (url.includes('/c/')) pageType = 'category'
        
        return { url, title, price, category, pageType }
      }
    })

    if (results && results[0] && results[0].result) {
      currentAd.value = results[0].result
      pageType.value = results[0].result.pageType
      
      if (results[0].result.pageType !== 'category') {
        await fetchReviews()
        await checkUserReview()
      }
    } else {
      error.value = 'Failed to extract ad data from the current page.'
    }
  } catch (err) {
    error.value = 'Failed to extract ad data: ' + err.message
  } finally {
    loading.value = false
  }
}

const fetchReviews = async () => {
  if (!currentAd.value) return
  
  try {
    const response = await fetch('http://localhost:4000/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetAdReviews($url: String!) {
            ad(url: $url) {
              reviews {
                id
                rating
                comment
                createdAt
                user {
                  id
                  name
                }
              }
            }
          }
        `,
        variables: { url: currentAd.value.url }
      })
    })

    const data = await response.json()
    reviews.value = data.data?.ad?.reviews || []
  } catch (err) {
    console.error('Failed to fetch reviews:', err)
    reviews.value = []
  }
}

const checkUserReview = async () => {
  try {
    const result = await chrome.storage.local.get(['userReviews'])
    const userReviews = result.userReviews || {}
    const adUrl = currentAd.value.url
    
    if (userReviews[adUrl]) {
      userReview.value = userReviews[adUrl]
      canReview.value = false
    }
  } catch (err) {
    console.error('Failed to check user review:', err)
  }
}

const submitReview = async () => {
  // Clear errors
  ratingError.value = ''
  commentError.value = ''
  
  // Validate
  if (selectedRating.value === 0) {
    ratingError.value = 'Please select a rating'
    return
  }
  
  if (!reviewComment.value.trim()) {
    commentError.value = 'Please enter a comment'
    return
  }
  
  submittingReview.value = true
  
  try {
    const reviewData = {
      rating: selectedRating.value,
      comment: reviewComment.value.trim()
    }
    
    // Store user review locally
    const result = await chrome.storage.local.get(['userReviews'])
    const userReviews = result.userReviews || {}
    userReviews[currentAd.value.url] = {
      ...reviewData,
      submittedAt: Date.now()
    }
    await chrome.storage.local.set({ userReviews })
    
    // Submit to backend
    const mutation = currentAd.value.pageType === 'seller' ? `
      mutation CreateSellerReview($input: CreateSellerReviewInput!) {
        createSellerReview(input: $input) {
          id
          rating
          comment
          createdAt
        }
      }
    ` : `
      mutation CreateAdReview($input: CreateAdReviewInput!) {
        createAdReview(input: $input) {
          id
          rating
          comment
          createdAt
        }
      }
    `
    
    const variables = currentAd.value.pageType === 'seller' ? {
      input: {
        sellerId: currentAd.value.sellerId || 'unknown',
        sellerName: currentAd.value.title || 'OLX Seller',
        rating: reviewData.rating,
        comment: reviewData.comment
      }
    } : {
      input: {
        adUrl: currentAd.value.url,
        adTitle: currentAd.value.title,
        adPrice: currentAd.value.price,
        adCategory: currentAd.value.category,
        rating: reviewData.rating,
        comment: reviewData.comment
      }
    }
    
    const response = await fetch('http://localhost:4000/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: mutation, variables })
    })
    
    const data = await response.json()
    
    if (data.errors) {
      throw new Error(data.errors[0].message)
    }
    
    // Update UI
    userReview.value = { ...reviewData, submittedAt: Date.now() }
    canReview.value = false
    submitMessage.value = 'Review submitted successfully!'
    
    // Refresh reviews
    await fetchReviews()
    
    // Clear form
    selectedRating.value = 0
    reviewComment.value = ''
    
  } catch (err) {
    error.value = 'Failed to submit review: ' + err.message
  } finally {
    submittingReview.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await extractAdData()
})
</script>

<style scoped>
/* Hide Chrome window controls */
:deep(body) {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

:deep(html) {
  background: transparent;
}

/* Hide window title bar and controls */
:deep(*) {
  -webkit-app-region: no-drag;
}

.olx-reviews-widget {
  position: relative; /* Remove fixed positioning since popup window handles positioning */
  width: 100%;
  height: 100%;
  background: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
  border: none; /* Remove border to blend in */
  box-shadow: none; /* Remove shadow to blend in */
  z-index: 999999; /* Ensure it appears on top */
}

.olx-reviews-widget-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); /* Blue gradient like injected widget */
  color: white;
  padding: 12px 16px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.olx-reviews-widget-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 20px;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: bold;
}

.olx-reviews-widget-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.olx-reviews-widget-content {
  padding: 16px;
  height: calc(100vh - 60px);
  overflow: hidden; /* No scroll */
  background: white;
}

.olx-reviews-stars {
  display: flex;
  gap: 2px;
}

.olx-reviews-star {
  color: #fbbf24; /* Golden yellow like injected widget */
  cursor: pointer;
  transition: color 0.2s;
  font-size: 16px;
}

.olx-reviews-star:hover {
  color: #f59e0b; /* Darker yellow on hover */
}

.olx-reviews-star.empty {
  color: #d1d5db; /* Light gray for empty stars */
}

.olx-reviews-button {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); /* Blue gradient like header */
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.olx-reviews-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.olx-reviews-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.olx-reviews-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  background: white;
  transition: border-color 0.2s;
}

.olx-reviews-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Injected widget style elements */
.olx-reviews-widget-content label {
  color: #374151;
  font-weight: 500;
}

.olx-reviews-widget-content h4,
.olx-reviews-widget-content h5 {
  color: #111827;
  font-weight: 600;
}

.olx-reviews-widget-content p {
  color: #6b7280;
}

/* Success message styling */
.olx-reviews-widget-content div[style*="color: #059669"] {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 8px;
}

/* Error message styling */
.olx-reviews-widget-content div[style*="color: #dc2626"] {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 4px;
}

/* Remove any obvious popup indicators */
.olx-reviews-widget::before,
.olx-reviews-widget::after {
  display: none;
}
</style> 