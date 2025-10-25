import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Trash2, 
  DollarSign,
  ShoppingCart,
  Calendar,
  Users,
  CreditCard,
  Printer,
  Download
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useSalesStore } from '../../store/salesStore'
import toast from 'react-hot-toast'

const SalesList = () => {
  const { isAdmin, user } = useAuthStore()
  const {
    fetchSales,
    deleteSale,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    clearFilters,
    isLoading,
    sales,
    getSalesStats
  } = useSalesStore()

  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [stats, setStats] = useState({
    todayStats: { count: 0, total: 0, items: 0 },
    weekStats: { count: 0, total: 0, items: 0 },
    monthStats: { count: 0, total: 0, items: 0 },
    paymentMethods: {},
    topProducts: []
  })

  // Cargar datos al montar el componente
  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      await fetchSales()
      const salesStats = getSalesStats()
      setStats(salesStats)
    } catch (error) {
      console.error('Error loading sales:', error)
      toast.error('Error al cargar las ventas')
    }
  }

  // Actualizar estadísticas cuando cambian las ventas
  useEffect(() => {
    if (sales.length > 0) {
      const salesStats = getSalesStats()
      setStats(salesStats)
    }
  }, [sales])

  // Obtener ventas filtradas
  const filteredSales = useSalesStore(state => state.getFilteredSales())

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  // Paginación
  const indexOfLastSale = currentPage * itemsPerPage
  const indexOfFirstSale = indexOfLastSale - itemsPerPage
  const currentSales = filteredSales.slice(indexOfFirstSale, indexOfLastSale)
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeleteSale = async (saleId) => {
    if (window.confirm('¿Estás seguro de eliminar esta venta? Esta acción no se puede deshacer.')) {
      const result = await deleteSale(saleId)
      if (result.success) {
        toast.success('Venta eliminada exitosamente')
        loadSales()
      } else {
        toast.error(result.error || 'Error al eliminar la venta')
      }
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value })
  }

  const clearAllFilters = () => {
    clearFilters()
  }

  const printSale = (sale) => {
    const printContent = generatePrintContent(sale)
    const printWindow = window.open('', '_blank')
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }
  const generatePrintContent = (sale) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket de Venta #${sale.id}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.4;
              max-width: 300px; 
              margin: 0 auto;
              padding: 10px;
            }
            .header { 
              text-align: center; 
              border-bottom: 1px dashed #000; 
              padding-bottom: 10px; 
              margin-bottom: 10px; 
            }
            .title { 
              font-size: 16px; 
              font-weight: bold; 
            }
            .subtitle { 
              font-size: 10px; 
            }
            .section { 
              margin: 10px 0; 
            }
            .item { 
              display: flex; 
              justify-content: space-between; 
              margin: 2px 0; 
            }
            .total-section { 
              border-top: 1px dashed #000; 
              padding-top: 10px; 
              margin-top: 10px; 
            }
            .footer { 
              text-align: center; 
              border-top: 1px dashed #000; 
              padding-top: 10px; 
              margin-top: 10px; 
              font-size: 10px; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SISTEMA ADMINISTRATIVO</div>
            <div class="subtitle">Empresa de Calzado</div>
            <div class="subtitle">Ticket de Venta</div>
          </div>
          
          <div class="section">
            <strong>Venta #${sale.id.toString().padStart(4, '0')}</strong><br>
            Fecha: ${formatDate(sale.createdAt)}<br>
            Empleado: ${sale.userName}
          </div>
          
          <div class="section">
            <strong>CLIENTE:</strong><br>
            ${sale.customerName}<br>
            ${sale.customerPhone ? `Tel: ${sale.customerPhone}` : ''}
          </div>
          
          <div class="section">
            <strong>PRODUCTOS:</strong>
            ${sale.items.map(item => `
              <div class="item">
                <div>
                  ${item.productName} (${item.size})<br>
                  ${item.quantity} x ${formatCurrency(item.unitPrice)}
                </div>
                <div>${formatCurrency(item.subtotal)}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="total-section">
            <div class="item">
              <span>Subtotal:</span>
              <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            ${sale.discount > 0 ? `
              <div class="item">
                <span>Descuento:</span>
                <span>-${formatCurrency(sale.discount)}</span>
              </div>
            ` : ''}
            ${sale.tax > 0 ? `
              <div class="item">
                <span>IVA:</span>
                <span>${formatCurrency(sale.tax)}</span>
              </div>
            ` : ''}
            <div class="item">
              <strong>TOTAL:</strong>
              <strong>${formatCurrency(sale.total)}</strong>
            </div>
          </div>
          
          <div class="section">
            <strong>PAGO:</strong>
            <div class="item">
              <span>${sale.paymentMethod}:</span>
              <span>${formatCurrency(sale.total)}</span>
            </div>
          </div>
          
          ${sale.notes ? `
            <div class="section">
              <strong>NOTAS:</strong><br>
              ${sale.notes}
            </div>
          ` : ''}
          
          <div class="footer">
            ¡Gracias por su compra!<br>
            Sistema de Gestión v1.0.0
          </div>
        </body>
      </html>
    `
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona el historial de ventas y transacciones
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link to="/sales/new" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Venta
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ventas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayStats.count}</p>
                <p className="text-xs text-gray-500">{stats.todayStats.items} productos</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ingresos Hoy</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.todayStats.total)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Esta Semana</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.weekStats.total)}
                </p>
                <p className="text-xs text-gray-500">{stats.weekStats.count} ventas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Este Mes</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.monthStats.total)}
                </p>
                <p className="text-xs text-gray-500">{stats.monthStats.count} ventas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por cliente, producto, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
              {(searchTerm || Object.values(filters).some(f => f && f !== 'COMPLETED' && f !== 'today')) && (
                <button
                  onClick={clearAllFilters}
                  className="btn btn-secondary"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="select"
                  >
                    <option value="today">Hoy</option>
                    <option value="yesterday">Ayer</option>
                    <option value="week">Esta Semana</option>
                    <option value="month">Este Mes</option>
                    <option value="">Todas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={filters.paymentMethod}
                    onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                    className="select"
                  >
                    <option value="">Todos</option>
                    <option value="CASH">Efectivo</option>
                    <option value="CARD">Tarjeta</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="MIXED">Mixto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="select"
                  >
                    <option value="COMPLETED">Completadas</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="CANCELLED">Canceladas</option>
                    <option value="">Todas</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner h-6 w-6 mr-3"></div>
              <span>Cargando ventas...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID Venta</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-mono font-medium text-primary-600">
                        #{sale.id.toString().padStart(4, '0')}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(sale.createdAt).split(',')[0]}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(sale.createdAt).split(',')[1]}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">{sale.customerName}</p>
                          <p className="text-sm text-gray-500">{sale.customerPhone}</p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {sale.items.length} producto{sale.items.length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            {sale.items.reduce((sum, item) => sum + item.quantity, 0)} unidades
                          </p>
                        </div>
                      </td>
                      <td className="font-medium text-gray-900">
                        {formatCurrency(sale.total)}
                      </td>
                      <td>
                        <span className="badge badge-secondary text-xs">
                          {sale.paymentMethod === 'CASH' ? 'Efectivo' :
                           sale.paymentMethod === 'CARD' ? 'Tarjeta' :
                           sale.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Mixto'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          sale.status === 'COMPLETED' ? 'badge-success' :
                          sale.status === 'PENDING' ? 'badge-warning' :
                          'badge-danger'
                        }`}>
                          {sale.status === 'COMPLETED' ? 'Completada' :
                           sale.status === 'PENDING' ? 'Pendiente' : 'Cancelada'}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <Link
                            to={`/sales/${sale.id}`}
                            className="btn btn-sm btn-secondary"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => printSale(sale)} 
                            className="btn btn-sm btn-secondary"
                            title="Imprimir ticket"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {isAdmin() && (
                            <button
                              onClick={() => handleDeleteSale(sale.id)}
                              className="btn btn-sm btn-danger"
                              disabled={isLoading}
                              title="Eliminar venta"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {currentSales.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || Object.values(filters).some(f => f && f !== 'COMPLETED' && f !== 'today') 
              ? 'No se encontraron ventas' 
              : 'No hay ventas registradas'
            }
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || Object.values(filters).some(f => f && f !== 'COMPLETED' && f !== 'today')
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza realizando tu primera venta'
            }
          </p>
          {!searchTerm && !Object.values(filters).some(f => f && f !== 'COMPLETED' && f !== 'today') && (
            <Link to="/sales/new" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {indexOfFirstSale + 1} a {Math.min(indexOfLastSale, filteredSales.length)} de {filteredSales.length} ventas
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-secondary"
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`btn btn-sm ${
                  currentPage === i + 1 ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-sm btn-secondary"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Métodos de Pago</h4>
            <div className="space-y-2">
              {Object.entries(stats.paymentMethods).map(([method, count]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span className="text-gray-600">{method}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Top Productos</h4>
            <div className="space-y-2">
              {stats.topProducts.slice(0, 3).map((product) => (
                <div key={product.reference} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate">{product.name.substring(0, 20)}...</span>
                  <span className="font-medium">{product.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Resumen Rápido</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Promedio por venta:</span>
                <span className="font-medium">
                  {formatCurrency(stats.todayStats.count > 0 ? stats.todayStats.total / stats.todayStats.count : 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Productos vendidos:</span>
                <span className="font-medium">{stats.todayStats.items}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ventas activas:</span>
                <span className="font-medium">{currentSales.filter(s => s.status === 'COMPLETED').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesList