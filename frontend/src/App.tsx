import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  X,
} from 'lucide-react'
import { getCategories, getProducts } from './api/catalog'
import { deleteProduct } from './api/catalog'
import { getProductImageUrl } from './api/client'
import { AuthDialog } from './components/AuthDialog'
import { CategoryManagerDialog } from './components/CategoryManagerDialog'
import { OrdersDialog } from './components/OrdersDialog'
import { ProductCard } from './components/ProductCard'
import { ProductDetailsDialog } from './components/ProductDetailsDialog'
import { ProductDialog } from './components/ProductDialog'
import { StoreHeader } from './components/StoreHeader'
import type { CartLine, Product, TokenPair } from './types/catalog'

type SortOrder = 'newest' | 'price-asc' | 'price-desc'
const emptyProducts: Product[] = []

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

function readStoredCart(): CartLine[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('sellport_cart') ?? '[]')
    if (!Array.isArray(value)) return []
    return value.filter(
      (line): line is CartLine =>
        typeof line?.product_id === 'number' &&
        typeof line?.quantity === 'number' &&
        line.quantity > 0,
    )
  } catch {
    return []
  }
}

function readStoredIds(key: string): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number') : []
  } catch {
    return []
  }
}

function sortProducts(products: Product[], sortOrder: SortOrder) {
  return [...products].sort((left, right) => {
    if (sortOrder === 'price-asc') return Number(left.price) - Number(right.price)
    if (sortOrder === 'price-desc') return Number(right.price) - Number(left.price)
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  })
}

export default function App() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [cart, setCart] = useState<CartLine[]>(readStoredCart)
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() =>
    readStoredIds('sellport_favorites'),
  )
  const [cartOpen, setCartOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [productOpen, setProductOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [detailsProductId, setDetailsProductId] = useState<number | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem('sellport_access_token')),
  )
  const [notice, setNotice] = useState('')
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 60_000,
  })
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    staleTime: 30_000,
  })

  useEffect(() => {
    localStorage.setItem('sellport_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('sellport_favorites', JSON.stringify(favoriteIds))
  }, [favoriteIds])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 2400)
    return () => window.clearTimeout(timeout)
  }, [notice])

  useEffect(() => {
    const handleLogout = () => setIsAuthenticated(false)
    window.addEventListener('sellport:logout', handleLogout)
    return () => window.removeEventListener('sellport:logout', handleLogout)
  }, [])

  const categories = categoriesQuery.data ?? []
  const products = productsQuery.data ?? emptyProducts
  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('ru-RU')
    const filtered = products.filter((product) => {
      const matchesCategory = selectedCategory === null || product.category_id === selectedCategory
      const matchesStock = !inStockOnly || product.stock > 0
      const matchesFavorite = !favoritesOnly || favoriteIds.includes(product.id)
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${product.description ?? ''}`
          .toLocaleLowerCase('ru-RU')
          .includes(normalizedSearch)
      return matchesCategory && matchesStock && matchesFavorite && matchesSearch
    })
    return sortProducts(filtered, sortOrder)
  }, [favoriteIds, favoritesOnly, inStockOnly, products, search, selectedCategory, sortOrder])

  const cartCount = cart.reduce((count, line) => count + line.quantity, 0)
  const cartProducts = useMemo(
    () =>
      cart
        .map((line) => ({
          line,
          product: products.find((item) => item.id === line.product_id),
        }))
        .filter((item): item is { line: CartLine; product: Product } => Boolean(item.product)),
    [cart, products],
  )
  const cartTotal = cartProducts.reduce(
    (sum, item) => sum + Number(item.product.price) * item.line.quantity,
    0,
  )

  function addToCart(product: Product) {
    if (product.stock < 1) return
    setCart((current) => {
      const existing = current.find((line) => line.product_id === product.id)
      if (existing) {
        return current.map((line) =>
          line.product_id === product.id
            ? { ...line, quantity: Math.min(line.quantity + 1, product.stock) }
            : line,
        )
      }
      return [...current, { product_id: product.id, quantity: 1 }]
    })
    setNotice('Товар добавлен в корзину')
  }

  function toggleFavorite(productId: number) {
    setFavoriteIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    )
  }

  function updateCartQuantity(productId: number, quantity: number) {
    setCart((current) =>
      quantity < 1
        ? current.filter((line) => line.product_id !== productId)
        : current.map((line) =>
            line.product_id === productId ? { ...line, quantity } : line,
          ),
    )
  }

  function handleAuthenticated(tokens: TokenPair) {
    localStorage.setItem('sellport_access_token', tokens.access_token)
    localStorage.setItem('sellport_refresh_token', tokens.refresh_token)
    setIsAuthenticated(true)
    setAuthOpen(false)
    setNotice('Вы вошли в аккаунт')
  }

  function logout() {
    localStorage.removeItem('sellport_access_token')
    localStorage.removeItem('sellport_refresh_token')
    setIsAuthenticated(false)
    setAuthOpen(false)
  }

  return (
    <div className="app-shell" id="top">
      <StoreHeader
        search={search}
        onSearchChange={setSearch}
        cartCount={cartCount}
        favoriteCount={favoriteIds.length}
        isAuthenticated={isAuthenticated}
        onCartClick={() => setCartOpen(true)}
        onFavoritesClick={() => {
          setFavoritesOnly((value) => !value)
          document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
        }}
        onAccountClick={() => setAuthOpen(true)}
      />

      <main>
        <section className="hero page-width">
          <div className="hero-copy">
            <h1>SellPort</h1>
            <p>Маркетплейс нужных вещей.</p>
          </div>
        </section>

        <section className="catalog-section page-width" id="catalog">
          <div className="section-heading">
            <div>
              <h2>{favoritesOnly ? 'Избранное' : 'Каталог'}</h2>
            </div>
            <div className="heading-actions">
            {isAuthenticated && <>
              <button className="secondary-button" type="button" onClick={() => setCategoryOpen(true)}>Категории</button>
              <button className="primary-button create-product-button" type="button" onClick={() => setProductOpen(true)}>Добавить товар</button>
            </>}
            {favoritesOnly && (
              <button className="text-button" type="button" onClick={() => setFavoritesOnly(false)}>
                Все товары <X size={15} />
              </button>
            )}
            </div>
          </div>

          <div className="category-strip" aria-label="Категории">
            <button
              className={`category-chip${selectedCategory === null ? ' active' : ''}`}
              type="button"
              onClick={() => setSelectedCategory(null)}
            >
              Все товары <span>{products.length}</span>
            </button>
            {categories.map((category) => (
              <button
                className={`category-chip${selectedCategory === category.id ? ' active' : ''}`}
                type="button"
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
            {categories.length === 0 && categoriesQuery.isLoading && (
              <span className="category-loading">Загружаем категории…</span>
            )}
          </div>

          <div className="catalog-toolbar">
            <div className="result-count">
              {productsQuery.isLoading ? 'Загружаем каталог…' : `${visibleProducts.length} товаров`}
            </div>
            <div className="toolbar-options">
              <label className="stock-filter">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                />
                <span className="checkmark" />
                В наличии
              </label>
              <label className="sort-select">
                <ArrowUpDown size={16} />
                <select
                  aria-label="Сортировка"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                >
                  <option value="newest">Сначала новинки</option>
                  <option value="price-asc">Сначала дешевле</option>
                  <option value="price-desc">Сначала дороже</option>
                </select>
                <ChevronDown size={14} />
              </label>
            </div>
          </div>

          {productsQuery.isPending && (
            <div className="product-grid" aria-label="Загрузка товаров">
              {Array.from({ length: 8 }, (_, index) => <div className="product-skeleton" key={index} />)}
            </div>
          )}

          {productsQuery.isError && (
            <div className="catalog-message error-message">
              <div className="message-mark">!</div>
              <h3>Каталог пока недоступен</h3>
              <p>Не получилось загрузить товары. Проверьте, что backend запущен.</p>
              <button className="secondary-button" type="button" onClick={() => productsQuery.refetch()}>
                Попробовать еще раз
              </button>
            </div>
          )}

          {productsQuery.isSuccess && visibleProducts.length > 0 && (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryName={categories.find((category) => category.id === product.category_id)?.name}
                  isFavorite={favoriteIds.includes(product.id)}
                  onFavorite={() => toggleFavorite(product.id)}
                  onAdd={() => addToCart(product)}
                  canManage={isAuthenticated}
                  onDetails={() => setDetailsProductId(product.id)}
                  onEdit={() => setEditingProduct(product)}
                  onDelete={async () => {
                    if (!window.confirm(`Удалить товар «${product.name}»?`)) return
                    try {
                      await deleteProduct(product.id)
                      await productsQuery.refetch()
                      setNotice('Товар удалён')
                    } catch {
                      setNotice('Не удалось удалить товар')
                    }
                  }}
                />
              ))}
            </div>
          )}

          {productsQuery.isSuccess && visibleProducts.length === 0 && (
            <div className="catalog-message empty-message">
              <div className="empty-bag"><ShoppingBagIcon /></div>
              <span className="section-eyebrow">ПОКА НИЧЕГО</span>
              <h3>{products.length === 0 ? 'Каталог только готовится' : 'Ничего не нашлось'}</h3>
              <p>
                {products.length === 0
                  ? 'Как только появятся товары, они будут здесь.'
                  : 'Попробуйте изменить запрос или выбрать другую категорию.'}
              </p>
              {(search || selectedCategory !== null || favoritesOnly) && (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setSelectedCategory(null)
                    setFavoritesOnly(false)
                  }}
                >
                  Сбросить фильтры <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width footer-inner">
          <a className="brand footer-brand" href="#top">
            <span className="brand-mark"><ShoppingBagIcon /></span>
            <span>sell<span>port</span></span>
          </a>
          <a href="#top">Наверх ↑</a>
        </div>
      </footer>

      {cartOpen && (
        <div className="drawer-backdrop" onMouseDown={() => setCartOpen(false)}>
          <aside
            className="cart-drawer"
            aria-label="Корзина"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="drawer-heading">
              <div><span className="section-eyebrow">ВАШ ВЫБОР</span><h2>Корзина <span>{cartCount}</span></h2></div>
              <button className="dialog-close" type="button" aria-label="Закрыть корзину" onClick={() => setCartOpen(false)}><X size={20} /></button>
            </div>
            {cartCount === 0 ? (
              <div className="cart-empty">
                <div className="empty-bag"><ShoppingBagIcon /></div>
                <h3>Корзина пока пуста</h3>
                <p>Добавьте сюда товары, которые вам понравились.</p>
                <button className="primary-button" type="button" onClick={() => setCartOpen(false)}>Перейти к покупкам</button>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {cartProducts.map(({ line, product }) => (
                    <div className="cart-line" key={product.id}>
                      <div className="cart-line-image">
                        {product.image_object_name ? (
                          <img src={getProductImageUrl(product.id)} alt="" />
                        ) : <ShoppingBagIcon />}
                      </div>
                      <div className="cart-line-copy">
                        <strong>{product.name}</strong>
                        <span>{currency.format(Number(product.price))}</span>
                        <div className="quantity-control">
                          <button type="button" aria-label="Уменьшить количество" onClick={() => updateCartQuantity(product.id, line.quantity - 1)}>−</button>
                          <span>{line.quantity}</span>
                          <button type="button" aria-label="Увеличить количество" disabled={line.quantity >= product.stock} onClick={() => updateCartQuantity(product.id, line.quantity + 1)}>+</button>
                        </div>
                      </div>
                      <button className="line-remove" type="button" aria-label="Удалить товар" onClick={() => updateCartQuantity(product.id, 0)}><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div><span>Итого</span><strong>{currency.format(cartTotal)}</strong></div>
                  <p>Оформление заказа скоро появится</p>
                  <button className="primary-button" type="button" disabled>Перейти к оформлению</button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {authOpen && (
        <AuthDialog
          isAuthenticated={isAuthenticated}
          onClose={() => setAuthOpen(false)}
          onAuthenticated={handleAuthenticated}
          onLogout={logout}
          onOrders={() => { setAuthOpen(false); setOrdersOpen(true) }}
        />
      )}
      {productOpen && <ProductDialog categories={categories} onClose={() => setProductOpen(false)} />}
      {editingProduct && <ProductDialog key={editingProduct.id} categories={categories} product={editingProduct} onClose={() => setEditingProduct(null)} />}
      {categoryOpen && <CategoryManagerDialog categories={categories} onClose={() => setCategoryOpen(false)} />}
      {ordersOpen && <OrdersDialog onClose={() => setOrdersOpen(false)} />}
      {detailsProductId !== null && <ProductDetailsDialog
        productId={detailsProductId}
        categoryName={categories.find((category) => category.id === products.find((product) => product.id === detailsProductId)?.category_id)?.name}
        canManage={isAuthenticated}
        onClose={() => setDetailsProductId(null)}
        onEdit={(product) => { setDetailsProductId(null); setEditingProduct(product) }}
      />}
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

function ShoppingBagIcon() {
  return <span className="bag-outline"><span /></span>
}
