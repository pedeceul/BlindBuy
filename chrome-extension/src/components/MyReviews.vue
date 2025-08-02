<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">My Reviews</h3>
      <button 
        @click="refreshReviews"
        class="p-2 text-gray-400 hover:text-gray-600"
        :class="{ 'animate-spin': loading }"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-lg shadow p-8 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-sm text-gray-600">Loading your reviews...</p>
    </div>

    <!-- No Reviews -->
    <div v-else-if="userReviews.length === 0" class="bg-gray-50 rounded-lg p-8 text-center">
      <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
      <p class="text-sm text-gray-600">
        You haven't written any reviews yet. Start by reviewing an OLX ad!
      </p>
    </div>

    <!-- Reviews List -->
    <div v-else class="space-y-3">
      <div v-for="review in userReviews" :key="review.id" class="bg-white rounded-lg shadow p-4">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <!-- Ad Title -->
            <h4 class="font-medium text-gray-900 mb-2">
              {{ review.ad?.title || 'OLX Ad' }}
            </h4>
            
            <!-- Rating -->
            <div class="flex items-center mb-2">
              <div class="flex text-yellow-400">
                <svg v-for="i in 5" :key="i" class="w-4 h-4" :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <span class="ml-2 text-sm text-gray-600">{{ review.rating }}/5</span>
            </div>
            
            <!-- Comment -->
            <p class="text-sm text-gray-800 mb-2">{{ review.comment }}</p>
            
            <!-- Date -->
            <p class="text-xs text-gray-500">{{ formatDate(review.createdAt) }}</p>
          </div>
          
          <!-- Actions -->
          <div class="flex space-x-2 ml-4">
            <button 
              @click="editReview(review)"
              class="p-1 text-gray-400 hover:text-blue-600"
              title="Edit review"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button 
              @click="deleteReview(review.id)"
              class="p-1 text-gray-400 hover:text-red-600"
              title="Delete review"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Review Modal -->
    <div v-if="editingReview" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Edit Review</h3>
        
        <form @submit.prevent="updateReview" class="space-y-4">
          <!-- Star Rating -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div class="flex space-x-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="editingReview.rating = star"
                class="text-2xl transition-colors"
                :class="star <= editingReview.rating ? 'text-yellow-400' : 'text-gray-300'"
              >
                ★
              </button>
            </div>
          </div>

          <!-- Comment -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Comment</label>
            <textarea
              v-model="editingReview.comment"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Share your experience with this ad..."
            ></textarea>
          </div>

          <!-- Buttons -->
          <div class="flex space-x-3">
            <button
              type="button"
              @click="cancelEdit"
              class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!isValidEditReview || loading"
              class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="loading">Updating...</span>
              <span v-else>Update Review</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReviewStore } from '../stores/reviewStore'

const reviewStore = useReviewStore()

const editingReview = ref(null)

const userReviews = computed(() => reviewStore.userReviews)
const loading = computed(() => reviewStore.loading)

const isValidEditReview = computed(() => {
  if (!editingReview.value) return false
  return editingReview.value.rating > 0 && editingReview.value.comment.trim().length > 0
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const refreshReviews = async () => {
  await reviewStore.fetchUserReviews()
}

const editReview = (review) => {
  editingReview.value = {
    id: review.id,
    rating: review.rating,
    comment: review.comment
  }
}

const cancelEdit = () => {
  editingReview.value = null
}

const updateReview = async () => {
  try {
    await reviewStore.updateReview(editingReview.value.id, {
      rating: editingReview.value.rating,
      comment: editingReview.value.comment
    })
    editingReview.value = null
    await refreshReviews()
  } catch (error) {
    console.error('Failed to update review:', error)
  }
}

const deleteReview = async (reviewId) => {
  if (!confirm('Are you sure you want to delete this review?')) return
  
  try {
    await reviewStore.deleteReview(reviewId)
    await refreshReviews()
  } catch (error) {
    console.error('Failed to delete review:', error)
  }
}

onMounted(async () => {
  await refreshReviews()
})
</script> 