import {
  Heart,
  Search,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from 'lucide-react'

type StoreHeaderProps = {
  search: string
  onSearchChange: (value: string) => void
  cartCount: number
  favoriteCount: number
  isAuthenticated: boolean
  onCartClick: () => void
  onFavoritesClick: () => void
  onAccountClick: () => void
}

export function StoreHeader({
  search,
  onSearchChange,
  cartCount,
  favoriteCount,
  isAuthenticated,
  onCartClick,
  onFavoritesClick,
  onAccountClick,
}: StoreHeaderProps) {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="SellPort — на главную">
          <span className="brand-mark"><ShoppingBag size={21} strokeWidth={2.3} /></span>
          <span>sell<span>port</span></span>
        </a>
        <form className="search-form" onSubmit={(event) => event.preventDefault()}>
          <Search size={20} />
          <input
            aria-label="Поиск товаров"
            placeholder="Найти товары и бренды"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => onSearchChange('')}>
              Очистить
            </button>
          )}
        </form>
        <nav className="header-actions" aria-label="Основная навигация">
          <button className="header-action" type="button" onClick={onAccountClick}>
            <span className="action-icon"><UserRound size={21} /></span>
            <span>{isAuthenticated ? 'Профиль' : 'Войти'}</span>
          </button>
          <button className="header-action" type="button" onClick={onFavoritesClick}>
            <span className="action-icon"><Heart size={21} />{favoriteCount > 0 && <i>{favoriteCount}</i>}</span>
            <span>Избранное</span>
          </button>
          <button className="header-action cart-action" type="button" onClick={onCartClick}>
            <span className="action-icon"><ShoppingCart size={21} />{cartCount > 0 && <i>{cartCount}</i>}</span>
            <span>Корзина</span>
          </button>
        </nav>
      </header>
    </>
  )
}
