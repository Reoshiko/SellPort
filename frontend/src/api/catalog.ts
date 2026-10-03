import { api } from './client'
import type { Category, Product } from '../types/catalog'

export async function getCategories() {
  const { data } = await api.get<Category[]>('/categories')
  return data
}

export async function getProducts() {
  const { data } = await api.get<Product[]>('/products', {
    params: { limit: 100 },
  })
  return data
}
