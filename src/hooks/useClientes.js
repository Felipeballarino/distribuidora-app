import { useState, useCallback, useRef, useEffect } from 'react'

export function useClientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const timeoutRef = useRef(null)

  const cargarTodos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const resultado = await window.api.clientes.buscar('')
      setClientes(resultado)
    } catch (err) {
      setError('Error al cargar clientes')
      console.error(err)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarTodos()
  }, [cargarTodos])

  const buscar = useCallback((termino) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!termino || termino.trim() === '') {
      cargarTodos()
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setCargando(true)
      setError(null)
      try {
        const resultado = await window.api.clientes.buscar(termino)
        setClientes(resultado)
      } catch (err) {
        setError('Error al buscar clientes')
        console.error(err)
      } finally {
        setCargando(false)
      }
    }, 250)
  }, [cargarTodos])

  return { clientes, cargando, error, buscar }
}
