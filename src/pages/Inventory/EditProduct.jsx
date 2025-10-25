import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { ArrowLeft, Plus, Trash2, Save, X, Package } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import useInventoryStore from '../../store/inventoryStore'
import toast from 'react-hot-toast'

const EditProduct = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const inventoryStore = useInventoryStore()
  
  // Extraer las funciones del store
  const { getProductById, updateProduct, isReferenceUnique, isLoading } = inventoryStore
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    reset
  } = useForm()

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'sizes'
  })

  // Watch para cálculos
  const costPrice = watch('costPrice')
  const salePrice = watch('salePrice')
  const sizes = watch('sizes') || []

  // Opciones de datos
  const categories = ['Formal', 'Casual', 'Deportivo', 'Botas', 'Sandalias']
  const materials = ['Cuero Genuino', 'Cuero Sintético', 'Lona', 'Sintético', 'Gamuza']
  const colors = ['Negro', 'Marrón', 'Blanco', 'Beige', 'Gris', 'Azul', 'Rojo', 'Otro']
  const shoesSizes = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    setLoading(true)
    try {
      const foundProduct = await getProductById(id)
      
      if (foundProduct) {
        setProduct(foundProduct)
        
        // Transformar los datos del backend al formato del frontend
        const frontendData = {
          reference: foundProduct.code,
          name: foundProduct.name,
          category: foundProduct.category,
          material: foundProduct.material,
          color: foundProduct.color,
          supplier: foundProduct.brand,
          description: foundProduct.description || '',
          costPrice: foundProduct.purchasePrice,
          salePrice: foundProduct.salePrice,
          minStock: foundProduct.minStock,
          sizes: foundProduct.stocks.map(stock => ({
            size: stock.size,
            stock: stock.quantity,
            price: foundProduct.salePrice // Usar el precio de venta base del producto
          }))
        }
        
        // Cargar datos en el formulario
        reset(frontendData)
        replace(frontendData.sizes)
        setLoading(false)
      } else {
        toast.error('Producto no encontrado')
        navigate('/inventory')
      }
    } catch (error) {
      console.error('Error loading product:', error)
      toast.error('Error al cargar el producto')
      navigate('/inventory')
    }
  }

  // Calcular margen de ganancia
  const calculateMargin = () => {
    if (costPrice && salePrice) {
      const margin = ((salePrice - costPrice) / costPrice * 100)
      return margin.toFixed(1)
    }
    return '0'
  }

  // Calcular stock total
  const calculateTotalStock = () => {
    return sizes.reduce((total, size) => {
      return total + (parseInt(size.stock) || 0)
    }, 0)
  }

  // Aplicar precio base a todas las tallas
  const applyBasePriceToAll = () => {
    const basePrice = salePrice
    if (basePrice) {
      const updatedSizes = sizes.map(size => ({
        ...size,
        price: basePrice
      }))
      setValue('sizes', updatedSizes)
      toast.success('Precio aplicado a todas las tallas')
    } else {
      toast.error('Ingresa el precio de venta base primero')
    }
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    
    try {
      // Validaciones adicionales
      if (data.sizes.length === 0) {
        throw new Error('Debe tener al menos una talla')
      }

      const hasValidSizes = data.sizes.some(size => size.size && size.stock !== '' && size.price)
      if (!hasValidSizes) {
        throw new Error('Debe completar al menos una talla con stock y precio')
      }

      // Validar referencia única (excluyendo el producto actual)
      if (!isReferenceUnique(data.reference, parseInt(id))) {
        throw new Error('Esta referencia ya existe')
      }

      // Filtrar tallas válidas
      const validSizes = data.sizes.filter(size => size.size && size.stock !== '' && size.price)
      
      // Preparar datos para envío
      const productData = {
        reference: data.reference,
        name: data.name,
        category: data.category,
        material: data.material,
        color: data.color,
        supplier: data.supplier,
        description: data.description,
        costPrice: parseFloat(data.costPrice),
        salePrice: parseFloat(data.salePrice),
        minStock: parseInt(data.minStock),
        sizes: validSizes.map(size => ({
          ...size,
          stock: parseInt(size.stock),
          price: parseFloat(size.price)
        }))
      }

      console.log('Datos a enviar:', productData)

      // Enviar al store
      const result = await updateProduct(id, productData)
      
      console.log('Resultado de la actualización:', result)
      
      if (result.success) {
        toast.success('Producto actualizado exitosamente')
        navigate('/inventory')
      } else {
        throw new Error(result.error || 'Error al actualizar el producto')
      }
      
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error(error.message || 'Error al actualizar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="spinner h-8 w-8 mr-3"></div>
        <span className="text-gray-600">Cargando producto...</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Producto no encontrado</h3>
        <p className="text-gray-500 mb-4">El producto que buscas no existe o ha sido eliminado.</p>
        <Link to="/inventory" className="btn btn-primary">
          Volver al Inventario
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/inventory" 
            className="btn btn-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Producto
            </h1>
            <p className="text-sm text-gray-500">
              {product.code} - {product.name}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Referencia */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia del Producto *
                </label>
                <input
                  {...register('reference', {
                    required: 'La referencia es requerida',
                    pattern: {
                      value: /^[A-Z0-9]+$/,
                      message: 'Solo letras mayúsculas y números'
                    },
                    validate: value => {
                      if (!isReferenceUnique(value, parseInt(id))) {
                        return 'Esta referencia ya existe'
                      }
                    }
                  })}
                  type="text"
                  className={`input ${errors.reference ? 'input-error' : ''}`}
                  placeholder="Ej: CAL001"
                />
                {errors.reference && (
                  <p className="mt-1 text-sm text-danger-600">{errors.reference.message}</p>
                )}
              </div>

              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  {...register('name', {
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 3,
                      message: 'Mínimo 3 caracteres'
                    }
                  })}
                  type="text"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="Ej: Zapato Formal Negro"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
                )}
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  {...register('category', {
                    required: 'Selecciona una categoría'
                  })}
                  className={`select ${errors.category ? 'input-error' : ''}`}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-danger-600">{errors.category.message}</p>
                )}
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material *
                </label>
                <select
                  {...register('material', {
                    required: 'Selecciona un material'
                  })}
                  className={`select ${errors.material ? 'input-error' : ''}`}
                >
                  <option value="">Seleccionar material</option>
                  {materials.map(material => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
                {errors.material && (
                  <p className="mt-1 text-sm text-danger-600">{errors.material.message}</p>
                )}
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <select
                  {...register('color', {
                    required: 'Selecciona un color'
                  })}
                  className={`select ${errors.color ? 'input-error' : ''}`}
                >
                  <option value="">Seleccionar color</option>
                  {colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
                {errors.color && (
                  <p className="mt-1 text-sm text-danger-600">{errors.color.message}</p>
                )}
              </div>

              {/* Proveedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor
                </label>
                <input
                  {...register('supplier')}
                  type="text"
                  className="input"
                  placeholder="Ej: Calzados Premium"
                />
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  {...register('description')}
                  className="textarea"
                  rows={3}
                  placeholder="Descripción detallada del producto..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Precios y Stock */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Precios y Stock</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Precio Costo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Costo *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    {...register('costPrice', {
                      required: 'El precio de costo es requerido',
                      min: {
                        value: 1000,
                        message: 'Precio mínimo $1,000'
                      }
                    })}
                    type="number"
                    className={`input pl-8 ${errors.costPrice ? 'input-error' : ''}`}
                    placeholder="80000"
                  />
                </div>
                {errors.costPrice && (
                  <p className="mt-1 text-sm text-danger-600">{errors.costPrice.message}</p>
                )}
              </div>

              {/* Precio Venta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Venta Base *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    {...register('salePrice', {
                      required: 'El precio de venta es requerido',
                      min: {
                        value: 1000,
                        message: 'Precio mínimo $1,000'
                      },
                      validate: value => {
                        const cost = parseFloat(costPrice) || 0
                        const sale = parseFloat(value) || 0
                        if (sale <= cost) {
                          return 'El precio de venta debe ser mayor al costo'
                        }
                      }
                    })}
                    type="number"
                    className={`input pl-8 ${errors.salePrice ? 'input-error' : ''}`}
                    placeholder="120000"
                  />
                </div>
                {errors.salePrice && (
                  <p className="mt-1 text-sm text-danger-600">{errors.salePrice.message}</p>
                )}
                {costPrice && salePrice && (
                  <p className="mt-1 text-sm text-green-600">
                    Margen: {calculateMargin()}%
                  </p>
                )}
              </div>

              {/* Stock Mínimo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Mínimo *
                </label>
                <input
                  {...register('minStock', {
                    required: 'El stock mínimo es requerido',
                    min: {
                      value: 1,
                      message: 'Mínimo 1 unidad'
                    }
                  })}
                  type="number"
                  className={`input ${errors.minStock ? 'input-error' : ''}`}
                  placeholder="20"
                />
                {errors.minStock && (
                  <p className="mt-1 text-sm text-danger-600">{errors.minStock.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tallas y Stock */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tallas y Stock</h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={applyBasePriceToAll}
                className="btn btn-sm btn-secondary"
                disabled={!salePrice}
              >
                Aplicar precio base
              </button>
              <button
                type="button"
                onClick={() => append({ size: '', stock: '', price: '' })}
                className="btn btn-sm btn-primary"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Talla
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Talla
                    </label>
                    <select
                      {...register(`sizes.${index}.size`)}
                      className="select"
                    >
                      <option value="">Seleccionar</option>
                      {shoesSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      {...register(`sizes.${index}.stock`)}
                      type="number"
                      className="input"
                      placeholder="10"
                      min="0"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                      <input
                        {...register(`sizes.${index}.price`)}
                        type="number"
                        className="input pl-8"
                        placeholder="120000"
                        min="1000"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="btn btn-sm btn-danger"
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Resumen de Stock */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{calculateTotalStock()}</p>
                  <p className="text-sm font-medium text-blue-800">Stock Total</p>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {fields.filter((_, index) => {
                      const sizeData = sizes[index]
                      return sizeData?.size && sizeData?.stock !== '' && sizeData?.price
                    }).length}
                  </p>
                  <p className="text-sm font-medium text-green-800">Tallas Configuradas</p>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {sizes.filter(size => parseInt(size.stock) === 0).length}
                  </p>
                  <p className="text-sm font-medium text-yellow-800">Tallas Sin Stock</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de Cambios (Simulado) */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Información Adicional</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Creado:</span>
                <p className="text-gray-900">
                  {new Date(product.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Última actualización:</span>
                <p className="text-gray-900">
                  {product.updatedAt 
                    ? new Date(product.updatedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Sin modificaciones'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            to="/inventory"
            className="btn btn-secondary"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="spinner h-4 w-4 mr-2"></div>
                Guardando...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditProduct