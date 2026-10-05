import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { getProduct } from '../api/catalog'
import { getProductImageUrl } from '../api/client'
import type { Product } from '../types/catalog'

type ProductDetailsDialogProps = {
  productId: number
  categoryName?: string
  canManage: boolean
  onClose: () => void
  onEdit: (product: Product) => void
}

const currency = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })

export function ProductDetailsDialog({ productId, categoryName, canManage, onClose, onEdit }: ProductDetailsDialogProps) {
  const productQuery = useQuery({ queryKey: ['products', productId], queryFn: () => getProduct(productId) })
  const product = productQuery.data

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section className="auth-dialog product-details-dialog" role="dialog" aria-modal="true" aria-labelledby="product-details-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-title-row"><h2 id="product-details-title">Товар</h2><button className="dialog-close" type="button" aria-label="Закрыть" onClick={onClose}><X size={20} /></button></div>
        {productQuery.isPending && <p className="dialog-status">Загружаем товар…</p>}
        {productQuery.isError && <p className="form-error">Не удалось загрузить товар</p>}
        {product && (
          <>
            {product.image_object_name && <img className="detail-image" src={getProductImageUrl(product.id)} alt={product.name} />}
            {categoryName && <span className="product-category">{categoryName}</span>}
            <h3>{product.name}</h3>
            {product.description && <p>{product.description}</p>}
            <div className="detail-price">{currency.format(Number(product.price))}</div>
            <p>В наличии: {product.stock}</p>
            {canManage && <button className="primary-button" type="button" onClick={() => onEdit(product)}>Изменить товар</button>}
          </>
        )}
      </section>
    </div>
  )
}
