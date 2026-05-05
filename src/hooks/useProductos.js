import { useState, useCallback, useRef, useEffect } from 'react'

export function useProductos() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')
  const timeoutRef = useRef(null)

  const cargarPorCategoria = useCallback(async (categoria) => {
    setCargando(true)
    setError(null)
    setCategoriaActiva(categoria)
    try {
      const resultado = await window.api.productos.porCategoria(categoria)
      setProductos(resultado)
    } catch (err) {
      setError('Error al cargar productos')
      console.error(err)
    } finally {
      setCargando(false)
    }
  }, [])

  const buscar = useCallback((termino) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!termino || termino.trim() === '') {
      cargarPorCategoria(categoriaActiva)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setCargando(true)
      setError(null)
      try {
        const resultado = await window.api.productos.buscar(termino)
        setProductos(resultado)
      } catch (err) {
        setError('Error al buscar productos')
        console.error(err)
      } finally {
        setCargando(false)
      }
    }, 250)
  }, [categoriaActiva, cargarPorCategoria])

  // Carga inicial
  useEffect(() => {
    cargarPorCategoria('Todos')
  }, [cargarPorCategoria])

  return { productos, cargando, error, categoriaActiva, buscar, cargarPorCategoria }
}
