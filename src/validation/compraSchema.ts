import * as yup from 'yup';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

// Extender dayjs con el plugin necesario
dayjs.extend(isSameOrBefore);

export const compraSchema = yup.object({
  proveedorId: yup
    .string()
    .required('Proveedor es requerido'),
  
  numeroFactura: yup
    .string()
    .required('Número de factura es requerido')
    .min(1, 'Número de factura debe tener al menos 1 carácter'),
  
  fechaCompra: yup
    .mixed()
    .required('Fecha de compra es requerida')
    .test('is-valid-date', 'Fecha de compra inválida', (value) => {
      return dayjs(value).isValid();
    })
    .test('not-future', 'La fecha de compra no puede ser futura', (value) => {
      return dayjs(value).isSameOrBefore(dayjs(), 'day');
    }),
  
  fechaVencimiento: yup
    .mixed()
    .required('Fecha de vencimiento es requerida')
    .test('is-valid-date', 'Fecha de vencimiento inválida', (value) => {
      return dayjs(value).isValid();
    })
    .test('after-purchase', 'La fecha de vencimiento debe ser posterior a la fecha de compra', function(value) {
      const { fechaCompra } = this.parent;
      if (!fechaCompra || !value) return true;
      return dayjs(value).isAfter(dayjs(fechaCompra), 'day') || dayjs(value).isSame(dayjs(fechaCompra), 'day');
    }),
  
  productos: yup
    .array()
    .of(
      yup.object({
        nombre: yup
          .string()
          .required('Nombre del producto es requerido')
          .min(2, 'Nombre debe tener al menos 2 caracteres'),
        
        cantidad: yup
          .number()
          .transform((value, originalValue) => {
            return originalValue === '' ? undefined : value;
          })
          .required('Cantidad es requerida')
          .min(0.01, 'La cantidad debe ser mayor a 0')
          .max(999999, 'La cantidad es demasiado grande'),
        
        unidad: yup
          .string()
          .required('Unidad es requerida'),
        
        precioUnitario: yup
          .number()
          .transform((value, originalValue) => {
            return originalValue === '' ? undefined : value;
          })
          .required('Precio unitario es requerido')
          .min(0, 'El precio debe ser mayor o igual a 0')
          .max(9999999, 'El precio es demasiado alto'),
        
        subtotal: yup
          .number()
          .min(0, 'El subtotal debe ser mayor o igual a 0'),
      })
    )
    .min(1, 'Debe agregar al menos un producto')
    .max(50, 'No puede agregar más de 50 productos'),
  
  total: yup
    .number()
    .min(0, 'El total debe ser mayor o igual a 0')
    .max(99999999, 'El total es demasiado alto'),
  
  notas: yup
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres'),
});