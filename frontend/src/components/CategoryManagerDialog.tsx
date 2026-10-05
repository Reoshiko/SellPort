import { useState } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, X } from 'lucide-react'
import { createCategory, deleteCategory, getCategory, updateCategory } from '../api/catalog'
import type { Category } from '../types/catalog'

type CategoryManagerDialogProps = {
  categories: Category[]
  onClose: () => void
}

export function CategoryManagerDialog({ categories, onClose }: CategoryManagerDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const detailQuery = useQuery({
    queryKey: ['categories', editingId],
    queryFn: () => getCategory(editingId!),
    enabled: editingId !== null,
  })
  const createMutation = useMutation({
    mutationFn: () => createCategory(name.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      setName('')
    },
  })
  const saveMutation = useMutation({
    mutationFn: () => updateCategory(editingId!, name.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingId(null)
      setName('')
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
  const error = [createMutation.error, saveMutation.error, deleteMutation.error].find(Boolean)
  const errorMessage = axios.isAxiosError<{ detail?: string }>(error)
    ? error.response?.data.detail ?? 'Не удалось выполнить запрос'
    : error ? 'Не удалось выполнить запрос' : null

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section className="auth-dialog category-dialog" role="dialog" aria-modal="true" aria-labelledby="category-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-title-row"><h2 id="category-dialog-title">Категории</h2><button className="dialog-close" type="button" aria-label="Закрыть" onClick={onClose}><X size={20} /></button></div>
        <form className="category-create-form" onSubmit={(event) => { event.preventDefault(); createMutation.mutate() }}>
          <label>Новая категория<input required maxLength={128} value={editingId === null ? name : ''} disabled={editingId !== null} onChange={(event) => setName(event.target.value)} /></label>
          <button className="primary-button" type="submit" disabled={editingId !== null || createMutation.isPending}>Добавить</button>
        </form>
        {editingId !== null && (
          <form className="category-create-form" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate() }}>
            <label>Изменить «{detailQuery.data?.name ?? 'категорию'}»<input required maxLength={128} value={name} disabled={detailQuery.isLoading} onChange={(event) => setName(event.target.value)} /></label>
            <button className="primary-button" type="submit" disabled={saveMutation.isPending || detailQuery.isLoading}>Сохранить</button>
            <button className="text-button" type="button" onClick={() => { setEditingId(null); setName('') }}>Отмена</button>
          </form>
        )}
        {errorMessage && <p className="form-error">{errorMessage}</p>}
        <div className="category-manager-list">
          {categories.map((category) => (
            <div className="category-manager-row" key={category.id}>
              <span>{category.name}</span>
              <button type="button" aria-label={`Изменить ${category.name}`} onClick={() => { setEditingId(category.id); setName(category.name); saveMutation.reset(); deleteMutation.reset() }}><Pencil size={17} /></button>
              <button type="button" aria-label={`Удалить ${category.name}`} disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Удалить категорию «${category.name}»?`)) deleteMutation.mutate(category.id) }}><Trash2 size={17} /></button>
            </div>
          ))}
          {categories.length === 0 && <p className="category-manager-empty">Категорий пока нет</p>}
        </div>
      </section>
    </div>
  )
}
