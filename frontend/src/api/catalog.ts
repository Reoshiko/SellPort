import { api } from './client'
import type { Category, Order, Product, UserProfile } from '../types/catalog'

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

export async function getProduct(id: number) {
  const { data } = await api.get<Product>(`/products/${id}`)
  return data
}

export async function getCategory(id: number) {
  const { data } = await api.get<Category>(`/categories/${id}`)
  return data
}

export async function getCurrentUser() {
  const { data } = await api.get<UserProfile>('/users/me')
  return data
}

export async function getOrders() {
  const { data } = await api.get<Order[]>('/orders')
  return data
}

export async function getOrder(id: number) {
  const { data } = await api.get<Order>(`/orders/${id}`)
  return data
}

export async function createProduct(payload: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'image_object_name'>) {
  const { data } = await api.post<Product>('/products', payload)
  return data
}

export async function updateProduct(id: number, payload: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'image_object_name'>>) {
  const { data } = await api.patch<Product>(`/products/${id}`, payload)
  return data
}

export async function deleteProduct(id: number) {
  await api.delete(`/products/${id}`)
}

export async function uploadProductImage(id: number, image: File) {
  const payload = new FormData()
  payload.append('image', image)
  const { data } = await api.post<Product>(`/products/${id}/image`, payload)
  return data
}

export async function deleteProductImage(id: number) {
  const { data } = await api.delete<Product>(`/products/${id}/image`)
  return data
}

export async function createCategory(name: string) {
  const { data } = await api.post<Category>('/categories', { name })
  return data
}

export async function updateCategory(id: number, name: string) {
  const { data } = await api.patch<Category>(`/categories/${id}`, { name })
  return data
}

export async function deleteCategory(id: number) {
  await api.delete(`/categories/${id}`)
}
