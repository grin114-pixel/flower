import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { deleteImages } from '../lib/imageUtils'

export function useFlowers(userId) {
  const [flowers, setFlowers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFlowers = useCallback(
    async ({ showLoading = true } = {}) => {
      if (!userId) {
        setFlowers([])
        setLoading(false)
        return
      }
      if (showLoading) setLoading(true)
      const { data, error } = await supabase
        .from('flowers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (!error) setFlowers(data || [])
      setLoading(false)
    },
    [userId],
  )

  useEffect(() => {
    ;(async () => {
      await Promise.resolve()
      await fetchFlowers()
    })()
  }, [fetchFlowers])

  const addFlower = async (flower) => {
    const payload = userId ? { ...flower, user_id: userId } : flower
    const { data, error } = await supabase.from('flowers').insert([payload]).select()
    if (!error && data) setFlowers((prev) => [data[0], ...prev])
    return { data, error }
  }

  const updateFlower = async (id, updates) => {
    const { data, error } = await supabase.from('flowers').update(updates).eq('id', id).select()
    if (!error && data) setFlowers((prev) => prev.map((f) => (f.id === id ? data[0] : f)))
    return { data, error }
  }

  const deleteFlower = async (id) => {
    const target = flowers.find((f) => f.id === id)
    const { error } = await supabase.from('flowers').delete().eq('id', id)
    if (!error) {
      if (target?.image_urls?.length) await deleteImages(target.image_urls)
      setFlowers((prev) => prev.filter((f) => f.id !== id))
    }
    return { error }
  }

  const shuffleFlowers = () => {
    setFlowers((prev) => {
      const arr = [...prev]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    })
  }

  return {
    flowers,
    loading,
    addFlower,
    updateFlower,
    deleteFlower,
    shuffleFlowers,
    refetch: fetchFlowers,
  }
}
