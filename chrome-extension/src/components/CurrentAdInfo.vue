<template>
  <div class="space-y-4">
    <!-- Ad Information -->
    <div v-if="currentAd" class="bg-white rounded-lg shadow p-4">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {{ currentAd.title || 'OLX Page' }}
          </h3>
          <div class="text-sm text-gray-600 space-y-1">
            <p v-if="currentAd.price">Price: {{ currentAd.price }}</p>
            <p v-if="currentAd.category">Category: {{ currentAd.category }}</p>
            <p v-if="currentAd.phone">Phone: {{ currentAd.phone }}</p>
            <p v-if="currentAd.seller">Seller: {{ currentAd.seller.name }}</p>
            <p v-if="currentAd.sellerId">Seller ID: {{ currentAd.sellerId }}</p>
            <p v-if="currentAd.pageType === 'seller'">Page Type: Seller Profile</p>
            <p v-else-if="currentAd.pageType === 'ad'">{{ currentAd.title || 'Ad Listing' }}</p>
          </div>
        </div>
        <button 
          @click="refreshAd"
          class="p-2 text-gray-400 hover:text-gray-600"
          :class="{ 'animate-spin': loading }"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- No Ad Detected -->
    <div v-else class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex">
        <svg class="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">No OLX Ad Detected</h3>
          <p class="text-sm text-yellow-700 mt-1">
            Please navigate to an OLX ad page to see reviews and ratings.
          </p>
        </div>
      </div>
    </div>

    <!-- Reviews Summary -->
    <div v-if="currentAd && totalReviews > 0" class="bg-white rounded-lg shadow p-4">
      <h4 class="text-lg font-semibold text-gray-900 mb-3">Reviews Summary</h4>
      
      <!-- Average Rating -->
      <div class="flex items-center mb-4">
        <div class="flex items-center">
          <div class="flex text-yellow-400">
            <svg v-for="i in 5" :key="i" class="w-5 h-5" :class="i <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
            </svg>
          </div>
          <span class="ml-2 text-lg font-semibold text-gray-900">{{ averageRating }}</span>
        </div>
        <span class="ml-2 text-sm text-gray-600">({{ totalReviews }} reviews)</span>
      </div>

      <!-- Rating Distribution -->
      <div class="space-y-2">
        <div v-for="rating in 5" :key="rating" class="flex items-center">
          <span class="text-sm text-gray-600 w-8">{{ rating }}</span>
          <div class="flex-1 mx-2 bg-gray-200 rounded-full h-2">
            <div 
              class="bg-yellow-400 h-2 rounded-full"
              :style="{ width: `${getRatingPercentage(rating)}%` }"
            ></div>
          </div>
          <span class="text-sm text-gray-600 w-8">{{ ratingDistribution[rating] }}</span>
        </div>
      </div>
    </div>

    <!-- No Reviews Yet -->
    <div v-else-if="currentAd && totalReviews === 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex">
        <svg class="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-blue-800">No Reviews Yet</h3>
          <p class="text-sm text-blue-700 mt-1">
            Be the first to review this ad!
          </p>
        </div>
      </div>
    </div>

    <!-- Add Review Form -->
    <div v-if="currentAd" class="bg-white rounded-lg shadow p-4">
      <h4 class="text-lg font-semibold text-gray-900 mb-3">Add Your Review</h4>
      
      <form @submit.prevent="submitReview" class="space-y-4">
        <!-- Star Rating -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
          <div class="flex space-x-1">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              @click="newReview.rating = star"
              class="text-2xl transition-colors"
              :class="star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'"
            >
              ★
            </button>
          </div>
        </div>

        <!-- Comment -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Comment</label>
          <textarea
            v-model="newReview.comment"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Share your experience with this ad..."
          ></textarea>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="!isValidReview || loading"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="loading">Submitting...</span>
          <span v-else>Submit Review</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useReviewStore } from '../stores/reviewStore'

const reviewStore = useReviewStore()

const newReview = ref({
  rating: 0,
  comment: ''
})

const currentAd = computed(() => reviewStore.currentAd)
const reviews = computed(() => reviewStore.reviews)
const loading = computed(() => reviewStore.loading)
const averageRating = computed(() => reviewStore.averageRating)
const totalReviews = computed(() => reviewStore.totalReviews)
const ratingDistribution = computed(() => reviewStore.ratingDistribution)

const isValidReview = computed(() => {
  return newReview.value.rating > 0 && newReview.value.comment.trim().length > 0
})

const getRatingPercentage = (rating) => {
  if (totalReviews.value === 0) return 0
  return Math.round((ratingDistribution.value[rating] / totalReviews.value) * 100)
}

const submitReview = async () => {
  try {
    await reviewStore.addReview(newReview.value)
    // Reset form
    newReview.value = { rating: 0, comment: '' }
  } catch (error) {
    console.error('Failed to submit review:', error)
  }
}

const refreshAd = async () => {
  await reviewStore.fetchCurrentAd()
}
</script> 