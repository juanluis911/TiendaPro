// src/utils/generarDatosPrueba.ts
import { Timestamp } from 'firebase/firestore';
import { compraService, pagoService, proveedorService } from '../services/firebase';

// Datos de prueba
const nombresProveedores = [
  "Frutas del Valle S.A.",
  "Mercado Central Ltda.",
  "Distribuidora Norte",
  "Agroexport Internacional",
  "Frutas Premium",
  "Verduras Frescas Corp.",
  "Mercado Orgánico",
  "Distribuidora Sur",
  "Frutas y Verduras El Campo",
  "Comercializadora Agropecuaria",
  "Frutas Tropicales S.A.",
  "Verduras del Huerto",
  "Mercado Natural",
  "Distribuidora Central",
  "Frutas de Temporada",
  "Verduras Selectas",
  "Mercado Campesino",
  "Distribuidora Regional",
  "Frutas Exóticas",
  "Verduras Gourmet"
];

const productos = [
  { nombre: "Manzanas", unidad: "kg", precioMin: 30, precioMax: 45 },
  { nombre: "Bananas", unidad: "kg", precioMin: 20, precioMax: 30 },
  { nombre: "Naranjas", unidad: "kg", precioMin: 25, precioMax: 35 },
  { nombre: "Peras", unidad: "kg", precioMin: 35, precioMax: 50 },
  { nombre: "Uvas", unidad: "kg", precioMin: 60, precioMax: 80 },
  { nombre: "Limones", unidad: "kg", precioMin: 15, precioMax: 25 },
  { nombre: "Tomates", unidad: "kg", precioMin: 20, precioMax: 30 },
  { nombre: "Cebollas", unidad: "kg", precioMin: 12, precioMax: 18 },
  { nombre: "Papas", unidad: "kg", precioMin: 15, precioMax: 22 },
  { nombre: "Zanahorias", unidad: "kg", precioMin: 18, precioMax: 25 },
  { nombre: "Lechugas", unidad: "pz", precioMin: 8, precioMax: 15 },
  { nombre: "Aguacates", unidad: "kg", precioMin: 80, precioMax: 120 }
];

const metodospago = ['efectivo', 'transferencia', 'cheque', 'tarjeta'];

// Funciones utilitarias
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePhoneNumber(): string {
  return `55${randomInt(1000, 9999)}${randomInt(1000, 9999)}`;
}

function generateEmail(nombre: string): string {
  const domain = randomChoice(['gmail.com', 'hotmail.com', 'yahoo.com', 'empresa.com']);
  return `${nombre.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')}@${domain}`;
}

export async function generarDatosPrueba(
  organizationId: string,
  storeId: string,
  userId: string,
  onProgress?: (mensaje: string) => void
) {
  const log = (mensaje: string) => {
    console.log(mensaje);
    if (onProgress) onProgress(mensaje);
  };

  log('🚀 Iniciando generación de datos de prueba...');

  try {
    // 1. Generar proveedores
    log('🏪 Generando 20 proveedores...');
    const proveedoresIds: string[] = [];
    
    for (let i = 0; i < nombresProveedores.length; i++) {
      const nombre = nombresProveedores[i];
      
      const proveedor = {
        organizationId,
        storeIds: [storeId],
        nombre,
        telefono: generatePhoneNumber(),
        email: generateEmail(nombre),
        direccion: `Av. Comercial ${randomInt(100, 9999)}, Col. Centro`,
        contacto: `${randomChoice(['Sr.', 'Sra.', 'Ing.'])} ${randomChoice(['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen'])} ${randomChoice(['García', 'López', 'Martínez', 'Rodríguez', 'Hernández'])}`,
        tipoProductos: [
          randomChoice(['frutas', 'verduras', 'mixto']),
          randomChoice(['orgánico', 'convencional'])
        ],
        activo: true,
        esGlobal: Math.random() < 0.3,
        createdAt: Timestamp.now(),
        createdBy: userId,
        updatedAt: Timestamp.now()
      };

      try {
        const proveedorId = await proveedorService.create(proveedor);
        proveedoresIds.push(proveedorId);
        log(`✅ Proveedor creado: ${nombre}`);
      } catch (error) {
        log(`❌ Error creando proveedor ${nombre}: ${error}`);
      }
    }

    log(`✅ Proveedores creados: ${proveedoresIds.length}`);

    // 2. Generar compras
    log('🛒 Generando 50 compras...');
    const comprasIds: string[] = [];
    
    const hoy = new Date();
    const hace3Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
    
    for (let i = 0; i < 50; i++) {
      const fechaCompra = randomDate(hace3Meses, hoy);
      const fechaVencimiento = new Date(fechaCompra.getTime() + randomInt(15, 60) * 24 * 60 * 60 * 1000);
      
      // Generar productos para esta compra
      const cantidadProductos = randomInt(1, 5);
      const productosCompra = [];
      let totalCompra = 0;
      
      for (let j = 0; j < cantidadProductos; j++) {
        const producto = randomChoice(productos);
        const cantidad = randomInt(5, 50);
        const precioUnitario = randomFloat(producto.precioMin, producto.precioMax);
        const subtotal = cantidad * precioUnitario;
        
        productosCompra.push({
          nombre: producto.nombre,
          cantidad: cantidad,
          unidad: producto.unidad,
          precioUnitario: Math.round(precioUnitario * 100) / 100,
          subtotal: Math.round(subtotal * 100) / 100
        });
        
        totalCompra += subtotal;
      }
      
      totalCompra = Math.round(totalCompra * 100) / 100;
      
      // Determinar estado
      let estado: 'pendiente' | 'pagado' | 'vencido';
      const random = Math.random();
      if (random < 0.15) {
        estado = 'pagado';
      } else if (random < 0.20) {
        estado = 'vencido';
      } else {
        estado = 'pendiente';
      }
      
      if (fechaVencimiento < hoy && estado === 'pendiente') {
        estado = 'vencido';
      }
      
      const compra = {
        organizationId,
        storeId,
        proveedorId: randomChoice(proveedoresIds),
        numeroFactura: `FAC-${String(i + 1).padStart(4, '0')}-${fechaCompra.getFullYear()}`,
        productos: productosCompra,
        total: totalCompra,
        fechaCompra: Timestamp.fromDate(fechaCompra),
        fechaVencimiento: Timestamp.fromDate(fechaVencimiento),
        estado,
        notas: randomChoice([
          '', 
          'Entrega en horario matutino',
          'Verificar calidad del producto',
          'Producto de temporada',
          'Proveedor preferente'
        ]),
        createdBy: userId,
        createdAt: Timestamp.fromDate(fechaCompra),
        updatedAt: Timestamp.now()
      };

      try {
        const compraId = await compraService.create(compra);
        comprasIds.push(compraId);
        log(`✅ Compra creada: ${compra.numeroFactura} - ${estado.toUpperCase()} - $${totalCompra}`);
      } catch (error) {
        log(`❌ Error creando compra ${compra.numeroFactura}: ${error}`);
      }
    }

    log(`✅ Compras creadas: ${comprasIds.length}`);

    // 3. Generar pagos
    log('💰 Generando 40 pagos...');
    
    for (let i = 0; i < 40; i++) {
      const fechaPago = randomDate(hace3Meses, hoy);
      const compraId = randomChoice(comprasIds);
      const proveedorId = randomChoice(proveedoresIds);
      
      const monto = Math.round(randomFloat(500, 10000) * 100) / 100;
      
      const pago = {
        organizationId,
        storeId,
        compraId,
        proveedorId,
        monto,
        fechaPago: Timestamp.fromDate(fechaPago),
        metodoPago: randomChoice(metodospago) as 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta',
        referencia: `REF-${String(i + 1).padStart(4, '0')}-${fechaPago.getFullYear()}`,
        notas: randomChoice([
          '',
          'Pago parcial',
          'Liquidación total',
          'Pago adelantado',
          'Descuento por pronto pago'
        ]),
        registradoPor: userId,
        createdAt: Timestamp.fromDate(fechaPago)
      };

      try {
        await pagoService.create(pago);
        log(`✅ Pago creado: ${pago.referencia} - ${pago.metodoPago.toUpperCase()} - $${monto}`);
      } catch (error) {
        log(`❌ Error creando pago ${pago.referencia}: ${error}`);
      }
    }

    log('🎉 ¡Datos de prueba generados exitosamente!');
    log('📊 Resumen:');
    log(`   • ${proveedoresIds.length} proveedores`);
    log(`   • ${comprasIds.length} compras`);
    log(`   • 40 pagos`);
    log(`   • Período: Últimos 3 meses`);
    
    return {
      success: true,
      proveedores: proveedoresIds.length,
      compras: comprasIds.length,
      pagos: 40
    };

  } catch (error) {
    log(`❌ Error general: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}