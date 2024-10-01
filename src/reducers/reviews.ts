import { type ProductReview } from '../lib/api'

export function getPostedReviews (reviews: ProductReview[]): ProductReview[] {
  return reviews.filter(orderReview => orderReview.review !== undefined)
}

export function getProductsWithoutReviews (reviews: ProductReview[]): ProductReview[] {
  return reviews.filter(orderReview => orderReview.review === undefined)
}
