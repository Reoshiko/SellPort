import { useState } from 'react'
import { Heart, Image as ImageIcon, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { getProductImageUrl } from '../api/client'
import type { Product } from '../types/catalog'

type ProductCardProps = {
  product: Product
  categoryName?: string
  isFavorite: boolean
  onFavorite: () => void
  onAdd: () => void
  canManage: boolean
  onDetails: () => void
  onEdit: () => void
  onDelete: () => void
}

const rubles = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export function ProductCard({
  product,
  categoryName,
  isFavorite,
  onFavorite,
  onAdd,
  canManage,
  onDetails,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = product.image_object_name
    ? getProductImageUrl(product.id)
    : undefined

  return (
    <article className="product-card">
      <div className="product-visual">
        {imageUrl && !imageFailed ? (
          <img
            className="product-image"
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="product-image-placeholder">
            <ImageIcon size={27} strokeWidth={1.5} />
            <span>Фото скоро появится</span>
          </div>
        )}
        <button
          className={`favorite-button${isFavorite ? ' is-favorite' : ''}`}
          type="button"
          aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          onClick={onFavorite}
        >
          <Heart size={19} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        {product.stock === 0 && <span className="out-of-stock">Нет в наличии</span>}
      </div>
      <div className="product-info">
        {categoryName && <span className="product-category">{categoryName}</span>}
        <button className="product-name-button" type="button" title={product.name} onClick={onDetails}>{product.name}</button>
        <p className="product-description">{product.description || 'Описание пока не добавлено'}</p>
        <div className="product-meta">
          <strong>{rubles.format(Number(product.price))}</strong>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="stock-note">Осталось {product.stock}</span>
          )}
        </div>
        <button
          className="add-to-cart"
          type="button"
          disabled={product.stock === 0}
          onClick={onAdd}
        >
          {product.stock === 0 ? <ShoppingBag size={17} /> : <Plus size={18} />}
          {product.stock === 0 ? 'Нет в наличии' : 'В корзину'}
        </button>
        {canManage && <div className="product-manage-actions"><button type="button" onClick={onEdit}><Pencil size={15} /> Изменить</button><button type="button" onClick={onDelete}><Trash2 size={15} /> Удалить</button></div>}
      </div>
    </article>
  )
}
