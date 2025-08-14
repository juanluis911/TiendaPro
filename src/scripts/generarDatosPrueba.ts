// scripts/generarDatosPrueba.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Configuración de Firebase (reemplaza con tus datos)
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// CONFIGURACIÓN - Cambia estos valores por los de tu proyecto
const ORGANIZATION_ID = "tu-organization-id"; // ID de tu organización
const STORE_ID = "tu-store-id"; // ID de una de tus tiendas
const USER_ID = "tu-user-id"; // Tu ID de usuario

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

// Generar proveedores
async function generarProveedores() {
  console.log('🏪 Generando 20 proveedores...');
  const proveedoresIds: string[] = [];
  
  for (let i = 0; i < nombresProveedores.length; i++) {
    const nombre = nombresProveedores[i];
    
    const proveedor = {
      organizationId: ORGANIZATION_ID,
      storeIds: [STORE_ID], // Asignar a la tienda
      nombre: nombre,
      telefono: generatePhoneNumber(),
      email: generateEmail(nombre),
      direccion: `Av. Comercial ${randomInt(100, 9999)}, Col. Centro`,
      contacto: `${randomChoice(['Sr.', 'Sra.', 'Ing.'])} ${randomChoice(['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen'])} ${randomChoice(['García', 'López', 'Martínez', 'Rodríguez', 'Hernández'])}`,
      tipoProductos: [
        randomChoice(['frutas', 'verduras', 'mixto']),
        randomChoice(['orgánico', 'convencional'])
      ],
      activo: true,
      esGlobal: Math.random() < 0.3, // 30% son globales
      createdAt: Timestamp.now(),
      createdBy: USER_ID,
      updatedAt: Timestamp.now()
    };

    try {
      const docRef = await addDoc(collection(db, 'proveedores'), proveedor);
      proveedoresIds.push(docRef.id);
      console.log(`✅ Proveedor creado: ${nombre} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Error creando proveedor ${nombre}:`, error);
    }
  }
  
  return proveedoresIds;
}

// Generar compras
async function generarCompras(proveedoresIds: string[]) {
  console.log('🛒 Generando 50 compras...');
  const comprasIds: string[] = [];
  
  // Últimos 3 meses
  const hoy = new Date();
  const hace3Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
  
  for (let i = 0; i < 50; i++) {
    const fechaCompra = randomDate(hace3Meses, hoy);
    const fechaVencimiento = new Date(fechaCompra.getTime() + randomInt(15, 60) * 24 * 60 * 60 * 1000);
    
    // Generar productos para esta compra (1-5 productos)
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
    
    // Determinar estado (80% pendiente, 15% pagado, 5% vencido)
    let estado: 'pendiente' | 'pagado' | 'vencido';
    const random = Math.random();
    if (random < 0.15) {
      estado = 'pagado';
    } else if (random < 0.20) {
      estado = 'vencido';
    } else {
      estado = 'pendiente';
    }
    
    // Si la fecha de vencimiento ya pasó, marcar como vencido
    if (fechaVencimiento < hoy && estado === 'pendiente') {
      estado = 'vencido';
    }
    
    const compra = {
      organizationId: ORGANIZATION_ID,
      storeId: STORE_ID,
      proveedorId: randomChoice(proveedoresIds),
      numeroFactura: `FAC-${String(i + 1).padStart(4, '0')}-${fechaCompra.getFullYear()}`,
      productos: productosCompra,
      total: totalCompra,
      fechaCompra: Timestamp.fromDate(fechaCompra),
      fechaVencimiento: Timestamp.fromDate(fechaVencimiento),
      estado: estado,
      notas: randomChoice([
        '', 
        'Entrega en horario matutino',
        'Verificar calidad del producto',
        'Producto de temporada',
        'Proveedor preferente'
      ]),
      createdBy: USER_ID,
      createdAt: Timestamp.fromDate(fechaCompra),
      updatedAt: Timestamp.now()
    };

    try {
      const docRef = await addDoc(collection(db, 'compras'), compra);
      comprasIds.push(docRef.id);
      console.log(`✅ Compra creada: ${compra.numeroFactura} - ${estado.toUpperCase()} - $${totalCompra} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Error creando compra ${compra.numeroFactura}:`, error);
    }
  }
  
  return comprasIds;
}

// Generar pagos
async function generarPagos(comprasIds: string[], proveedoresIds: string[]) {
  console.log('💰 Generando 40 pagos...');
  
  // Últimos 3 meses
  const hoy = new Date();
  const hace3Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
  
  for (let i = 0; i < 40; i++) {
    const fechaPago = randomDate(hace3Meses, hoy);
    const compraId = randomChoice(comprasIds);
    const proveedorId = randomChoice(proveedoresIds);
    
    // Monto del pago (entre 500 y 10000)
    const monto = Math.round(randomFloat(500, 10000) * 100) / 100;
    
    const pago = {
      organizationId: ORGANIZATION_ID,
      storeId: STORE_ID,
      compraId: compraId,
      proveedorId: proveedorId,
      monto: monto,
      fechaPago: Timestamp.fromDate(fechaPago),
      metodoPago: randomChoice(metodospago),
      referencia: `REF-${String(i + 1).padStart(4, '0')}-${fechaPago.getFullYear()}`,
      notas: randomChoice([
        '',
        'Pago parcial',
        'Liquidación total',
        'Pago adelantado',
        'Descuento por pronto pago'
      ]),
      registradoPor: USER_ID,
      createdAt: Timestamp.fromDate(fechaPago)
    };

    try {
      const docRef = await addDoc(collection(db, 'pagos'), pago);
      console.log(`✅ Pago creado: ${pago.referencia} - ${pago.metodoPago.toUpperCase()} - $${monto} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Error creando pago ${pago.referencia}:`, error);
    }
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando generación de datos de prueba...\n');
  
  try {
    // Validar configuración
    if (ORGANIZATION_ID === "tu-organization-id" || STORE_ID === "tu-store-id" || USER_ID === "tu-user-id") {
      console.error('❌ ERROR: Debes configurar ORGANIZATION_ID, STORE_ID y USER_ID en el script');
      return;
    }
    
    console.log(`📋 Configuración:`);
    console.log(`   Organization ID: ${ORGANIZATION_ID}`);
    console.log(`   Store ID: ${STORE_ID}`);
    console.log(`   User ID: ${USER_ID}\n`);
    
    // Generar datos
    const proveedoresIds = await generarProveedores();
    console.log(`\n✅ Proveedores creados: ${proveedoresIds.length}\n`);
    
    const comprasIds = await generarCompras(proveedoresIds);
    console.log(`\n✅ Compras creadas: ${comprasIds.length}\n`);
    
    await generarPagos(comprasIds, proveedoresIds);
    console.log(`\n✅ Pagos creados: 40\n`);
    
    console.log('🎉 ¡Datos de prueba generados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   • ${proveedoresIds.length} proveedores`);
    console.log(`   • ${comprasIds.length} compras`);
    console.log(`   • 40 pagos`);
    console.log(`   • Período: Últimos 3 meses`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar script
main();