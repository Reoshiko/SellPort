export type Category = {
  id: number
  name: string
  created_at: string
}

export type Product = {
  id: number
  name: string
  description: string | null
  price: number | string
  stock: number
  category_id: number
  image_object_name: string | null
  created_at: string
  updated_at: string
}

export type TokenPair = {
  access_token: string
  refresh_token: string
  token_type: string
}

export type CartLine = {
  product_id: number
  quantity: number
}
