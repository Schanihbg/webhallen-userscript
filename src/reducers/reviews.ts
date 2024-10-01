import { type ProductReview } from '../lib/api'

export function getPostedReviews (reviews: ProductReview[]): ProductReview[] {
  return reviews.filter(orderReview => orderReview.review !== undefined)
    .sort((a, b) => {
      if (a.review && b.review) {
        return b.review.createdAt - a.review.createdAt
      }
      return 0
    })
}

export function getProductsWithoutReviews (reviews: ProductReview[]): ProductReview[] {
  return reviews.filter(orderReview => orderReview.review === undefined)
}
