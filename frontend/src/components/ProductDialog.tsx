import { useState } from 'react'
import axios from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { createProduct, createCategory, deleteProductImage, updateProduct, uploadProductImage } from '../api/catalog'
import type { Category, Product } from '../types/catalog'

type ProductDialogProps = {
  categories: Category[]
  product?: Product | null
  onClose: () => void
}

export function ProductDialog({ categories, product: initialProduct = null, onClose }: ProductDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(initialProduct?.name ?? '')
  const [description, setDescription] = useState(initialProduct?.description ?? '')
  const [price, setPrice] = useState(initialProduct?.price.toString() ?? '')
  const [stock, setStock] = useState(initialProduct?.stock.toString() ?? '0')
  const [categoryId, setCategoryId] = useState(initialProduct?.category_id.toString() ?? categories[0]?.id.toString() ?? '')
  const [newCategory, setNewCategory] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imageError, setImageError] = useState('')
  const [createdCategoryId, setCreatedCategoryId] = useState<number | null>(null)
  const [savedProduct, setSavedProduct] = useState<Product | null>(null)
  const [hasImage, setHasImage] = useState(Boolean(initialProduct?.image_object_name))

  const createMutation = useMutation({
    mutationFn: async () => {
      let product = savedProduct
      let selectedCategoryId = createdCategoryId ?? Number(categoryId)
      if (!selectedCategoryId && newCategory.trim()) {
        const category = await createCategory(newCategory.trim())
        selectedCategoryId = category.id
        setCreatedCategoryId(category.id)
      }
      if (!product) {
        const payload = {
          name: name.trim(),
          description: description.trim() || null,
          price: Number(price),
          stock: Number(stock),
          category_id: selectedCategoryId,
        }
        product = initialProduct ? await updateProduct(initialProduct.id, payload) : await createProduct(payload)
        setSavedProduct(product)
      }
      if (image) {
        await uploadProductImage(product.id, image)
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
      ])
      onClose()
    },
  })
  const deleteImageMutation = useMutation({
    mutationFn: () => deleteProductImage(initialProduct!.id),
    onSuccess: async () => {
      setHasImage(false)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const mutationError = createMutation.error ?? deleteImageMutation.error
  const errorMessage = imageError || (axios.isAxiosError(mutationError)
    ? mutationError.response?.status === 413
      ? 'Фото слишком большое. Максимальный размер — 5 МБ.'
      : savedProduct
        ? `${initialProduct ? 'Товар сохранён' : 'Товар создан'}, но фото не загрузилось. Попробуйте отправить фото ещё раз.`
        : typeof mutationError.response?.data?.detail === 'string'
          ? mutationError.response.data.detail
          : 'Не удалось создать товар'
    : mutationError ? 'Не удалось выполнить запрос' : null
  )

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-title-row">
          <h2 id="product-dialog-title">{initialProduct ? 'Изменить товар' : 'Новый товар'}</h2>
          <button className="dialog-close" type="button" aria-label="Закрыть" onClick={onClose}><X size={20} /></button>
        </div>
        <form className="product-form" onSubmit={(event) => { event.preventDefault(); createMutation.mutate() }}>
          <label>Название<input required maxLength={256} disabled={Boolean(savedProduct)} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Описание<input disabled={Boolean(savedProduct)} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <div className="form-row">
            <label>Цена, ₽<input required type="number" min="0.01" step="0.01" disabled={Boolean(savedProduct)} value={price} onChange={(event) => setPrice(event.target.value)} /></label>
            <label>Количество<input required type="number" min="0" step="1" disabled={Boolean(savedProduct)} value={stock} onChange={(event) => setStock(event.target.value)} /></label>
          </div>
          {categories.length > 0 ? (
            <label>Категория<select required disabled={Boolean(savedProduct)} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="" disabled>Выберите категорию</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
          ) : (
            <label>Новая категория<input required maxLength={128} disabled={Boolean(savedProduct)} value={newCategory} onChange={(event) => setNewCategory(event.target.value)} /></label>
          )}
          {hasImage && initialProduct && <button className="text-button" type="button" disabled={deleteImageMutation.isPending} onClick={() => deleteImageMutation.mutate()}>{deleteImageMutation.isPending ? 'Удаляем фото…' : 'Удалить фото'}</button>}
          <label>Фото<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            if (file && file.size > 5 * 1024 * 1024) {
              setImage(null)
              setImageError('Фото слишком большое. Максимальный размер — 5 МБ.')
            } else {
              setImage(file)
              setImageError('')
              if (file) setHasImage(true)
            }
          }} /></label>
          {errorMessage && <p className="form-error">{errorMessage}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={createMutation.isPending || Boolean(imageError) || Boolean(savedProduct && !image)}>{createMutation.isPending ? 'Сохраняем…' : savedProduct ? 'Повторить сохранение фото' : initialProduct ? 'Сохранить изменения' : 'Создать товар'}</button>
        </form>
      </section>
    </div>
  )
}
