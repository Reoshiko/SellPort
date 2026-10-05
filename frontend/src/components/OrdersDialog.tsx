import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { getOrder, getOrders } from '../api/catalog'
import type { OrderStatus } from '../types/catalog'

const currency = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
const labels: Record<OrderStatus, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

export function OrdersDialog({ onClose }: { onClose: () => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: getOrders })
  const orderQuery = useQuery({
    queryKey: ['orders', selectedId],
    queryFn: () => getOrder(selectedId!),
    enabled: selectedId !== null,
  })

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section className="auth-dialog orders-dialog" role="dialog" aria-modal="true" aria-labelledby="orders-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-title-row"><h2 id="orders-title">Мои заказы</h2><button className="dialog-close" type="button" aria-label="Закрыть" onClick={onClose}><X size={20} /></button></div>
        {ordersQuery.isPending && <p className="dialog-status">Загружаем заказы…</p>}
        {ordersQuery.isError && <p className="form-error">Не удалось загрузить заказы</p>}
        {ordersQuery.isSuccess && ordersQuery.data.length === 0 && <p className="dialog-status">Заказов пока нет</p>}
        <div className="orders-list">
          {ordersQuery.data?.map((order) => (
            <button className={`order-row${selectedId === order.id ? ' selected' : ''}`} type="button" key={order.id} onClick={() => setSelectedId(order.id)}>
              <span><strong>Заказ №{order.id}</strong><small>{new Date(order.created_at).toLocaleDateString('ru-RU')}</small></span>
              <span>{currency.format(Number(order.total_price))}<small>{labels[order.status]}</small></span>
            </button>
          ))}
        </div>
        {selectedId !== null && (
          <div className="order-detail">
            {orderQuery.isPending ? 'Загружаем заказ…' : orderQuery.isError ? 'Не удалось загрузить заказ' : orderQuery.data && (
              <><strong>Заказ №{orderQuery.data.id}</strong><span>Статус: {labels[orderQuery.data.status]}</span><span>Сумма: {currency.format(Number(orderQuery.data.total_price))}</span></>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
