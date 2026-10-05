import { useState } from 'react'
import axios from 'axios'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { api } from '../api/client'
import { getCurrentUser } from '../api/catalog'
import type { TokenPair } from '../types/catalog'

type AuthDialogProps = {
  isAuthenticated: boolean
  onClose: () => void
  onAuthenticated: (tokens: TokenPair) => void
  onLogout: () => void
  onOrders: () => void
}

export function AuthDialog({
  isAuthenticated,
  onClose,
  onAuthenticated,
  onLogout,
  onOrders,
}: AuthDialogProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [login, setLogin] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const authMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'register') {
        await api.post('/auth/register', { username, email, password })
      }
      const body = new URLSearchParams({
        username: mode === 'register' ? username : login,
        password,
      })
      const { data } = await api.post<TokenPair>('/auth/login', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      return data
    },
    onSuccess: onAuthenticated,
  })
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getCurrentUser,
    enabled: isAuthenticated,
  })
  const errorMessage = axios.isAxiosError<{ detail?: string }>(authMutation.error)
    ? authMutation.error.response?.data.detail ?? 'Не удалось выполнить запрос'
    : authMutation.error
      ? 'Не удалось выполнить запрос'
      : null

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dialog-close" type="button" aria-label="Закрыть" onClick={onClose}>
          <X size={20} />
        </button>
        {isAuthenticated ? (
          <div className="auth-success">
            <span className="dialog-eyebrow">ПРОФИЛЬ</span>
            <h2 id="auth-title">{profileQuery.data?.username ?? (profileQuery.isPending ? 'Загрузка…' : 'Мой аккаунт')}</h2>
            {profileQuery.data && <p>{profileQuery.data.email}</p>}
            {profileQuery.isError && <p className="form-error">Не удалось загрузить профиль</p>}
            <button className="secondary-button profile-orders" type="button" onClick={onOrders}>Мои заказы</button>
            <button className="secondary-button" type="button" onClick={onLogout}>
              Выйти из аккаунта
            </button>
          </div>
        ) : (
          <>
            <span className="dialog-eyebrow">АККАУНТ SELLPORT</span>
            <h2 id="auth-title">{mode === 'login' ? 'С возвращением' : 'Создать аккаунт'}</h2>
            <p className="dialog-copy">
              {mode === 'login'
                ? 'Войдите, чтобы продолжить покупки.'
                : 'Зарегистрируйтесь, чтобы сохранить избранное и корзину.'}
            </p>
            <form
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault()
                authMutation.mutate()
              }}
            >
              {mode === 'register' && (
                <>
                  <label>
                    Имя пользователя
                    <input
                      autoComplete="username"
                      minLength={3}
                      required
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                    />
                  </label>
                  <label>
                    Электронная почта
                    <input
                      autoComplete="email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                </>
              )}
              {mode === 'login' && (
                <label>
                  Имя пользователя или email
                  <input
                    autoComplete="username"
                    required
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                  />
                </label>
              )}
              <label>
                Пароль
                <input
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={mode === 'register' ? 8 : 1}
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {errorMessage && <p className="form-error">{errorMessage}</p>}
              <button className="primary-button auth-submit" disabled={authMutation.isPending}>
                {authMutation.isPending
                  ? 'Подождите…'
                  : mode === 'login'
                    ? 'Войти'
                    : 'Зарегистрироваться'}
              </button>
            </form>
            <p className="auth-switch">
              {mode === 'login' ? 'Еще нет аккаунта?' : 'Уже зарегистрированы?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  authMutation.reset()
                }}
              >
                {mode === 'login' ? 'Создать' : 'Войти'}
              </button>
            </p>
          </>
        )}
      </section>
    </div>
  )
}
