# TiendaPro - Sistema de Gestión Multi-Tienda

Sistema web profesional para la gestión integral de fruterías y abarrotes, con arquitectura multi-tienda y diseño SaaS escalable.

## 🚀 Características Principales

- **Módulo de Proveedores**: Gestión completa de proveedores con soporte multi-tienda
- **Gestión de Compras**: Control de compras con seguimiento de pagos y vencimientos
- **Control de Pagos**: Registro y seguimiento de pagos a proveedores
- **Multi-Tienda**: Soporte para múltiples tiendas con permisos granulares
- **Sistema de Usuarios**: Roles y permisos personalizables
- **Dashboard Analítico**: Métricas y estadísticas en tiempo real
- **Arquitectura SaaS**: Preparado para múltiples clientes

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI (MUI)
- **Backend**: Firebase (Firestore + Authentication)
- **Hosting**: Firebase Hosting
- **Validación**: React Hook Form + Yup
- **Build Tool**: Vite
- **Notificaciones**: Notistack

## 📋 Prerrequisitos

- Node.js 18+ y npm/yarn
- Cuenta de Firebase
- Git

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd tienda-pro
```

### 2. Instalar dependencias

```bash
npm install
# o
yarn install
```

### 3. Configurar Firebase

#### 3.1 Crear proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Firestore Database
4. Habilita Authentication con Email/Password
5. Opcional: Habilita Hosting para deploy

#### 3.2 Obtener credenciales
1. Ve a Configuración del proyecto > General
2. En "Tus aplicaciones" > "Web app" > Configuración
3. Copia las credenciales de Firebase

#### 3.3 Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
REACT_APP_FIREBASE_API_KEY=tu-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tu-proyecto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 4. Configurar reglas de Firestore

1. Copia el contenido de `firestore.rules` 
2. Ve a Firebase Console > Firestore > Reglas
3. Pega las reglas y publica

### 5. Inicializar datos de prueba

Crea manualmente en Firestore:

#### Organización de ejemplo:
```json
// Colección: organizations
{
  "name": "Mi Empresa",
  "plan": "basic",
  "maxStores": 5,
  "maxUsers": 10,
  "features": {
    "proveedores": true,
    "inventario": false,
    "ventas": false,
    "reportes": true,
    "multitienda": true
  },
  "owner": "tu-uid-de-firebase-auth",
  "active": true,
  "createdAt": "timestamp-actual",
  "subscription": {
    "status": "active",
    "currentPeriodEnd": "timestamp-futuro",
    "plan": "basic"
  }
}
```

#### Usuario administrador:
```json
// Colección: users, Documento ID: tu-uid-de-firebase-auth
{
  "email": "admin@tuempresa.com",
  "displayName": "Administrador",
  "organizationId": "id-de-tu-organizacion",
  "role": "owner",
  "storeAccess": ["store1", "store2"],
  "permissions": {
    "proveedores": true,
    "inventario": true,
    "ventas": true,
    "reportes": true,
    "configuracion": true,
    "multitienda": true
  },
  "active": true,
  "createdAt": "timestamp-actual",
  "createdBy": "system"
}
```

#### Tienda de ejemplo:
```json
// Colección: stores
{
  "organizationId": "id-de-tu-organizacion",
  "name": "Tienda Principal",
  "address": "Calle Principal 123",
  "phone": "555-0123",
  "email": "tienda@tuempresa.com",
  "manager": "tu-uid-de-firebase-auth",
  "active": true,
  "config": {
    "currency": "MXN",
    "timezone": "America/Mexico_City",
    "businessHours": {
      "open": "08:00",
      "close": "20:00",
      "days": ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
    }
  },
  "createdAt": "timestamp-actual",
  "createdBy": "tu-uid-de-firebase-auth"
}
```

### 6. Ejecutar el proyecto

```bash
npm run dev
# o
yarn dev
```

El proyecto estará disponible en `http://localhost:3000`

## 🔐 Autenticación

### Primer acceso:
1. Registra un usuario en Firebase Authentication
2. Crea el documento de usuario en Firestore con los permisos correspondientes
3. Asegúrate de que el `organizationId` coincida

### Credenciales de prueba:
- Email: admin@tuempresa.com
- Password: (define una en Firebase Auth)

## 📁 Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── auth/            # Componentes de autenticación
│   └── layout/          # Componentes de layout
├── contexts/            # Contextos de React
├── pages/               # Páginas principales
├── services/            # Servicios de Firebase
├── types/               # Definiciones de TypeScript
├── config/              # Configuración
└── utils/               # Utilidades
```

## 🎯 Funcionalidades Implementadas

### ✅ Módulo de Proveedores
- CRUD completo de proveedores
- Soporte multi-tienda
- Búsqueda y filtros

### ✅ Módulo de Compras
- Registro de compras con múltiples productos
- Cálculo automático de totales
- Estados de pago (pendiente, pagado, vencido)
- Filtros avanzados por fecha, proveedor, estado
- Vista detallada de compras

### ✅ Dashboard
- Estadísticas en tiempo real
- Métricas de compras y pagos
- Alertas de vencimientos próximos
- Vista consolidada multi-tienda

### ✅ Sistema de Autenticación
- Login seguro con Firebase Auth
- Gestión de permisos granulares
- Soporte multi-rol (owner, admin, manager, empleado)

### 🚧 En Desarrollo
- Módulo de Pagos (UI básica lista)
- Gestión de Usuarios
- Módulo de Inventario
- Módulo de Ventas
- Reportes avanzados

## 🚀 Deploy a Producción

### Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login a Firebase
firebase login

# Inicializar proyecto
firebase init hosting

# Build del proyecto
npm run build

# Deploy
firebase deploy
```

### Variables de Entorno para Producción

Asegúrate de configurar las variables de entorno en tu servidor de producción.

## 🔒 Seguridad

- Reglas de Firestore configuradas para acceso seguro
- Validación de permisos en frontend y backend
- Soft delete para preservar datos
- Auditoría de cambios con timestamps

## 🐛 Resolución de Problemas

### Error de permisos en Firestore
- Verifica que las reglas estén correctamente configuradas
- Asegúrate de que el usuario tenga un documento en la colección `users`

### Error al cargar datos
- Verifica la conexión a Firebase
- Revisa la consola del navegador para errores específicos

### Error de autenticación
- Verifica las credenciales en `.env`
- Asegúrate de que Authentication esté habilitado en Firebase

## 📧 Soporte

Para soporte técnico o dudas sobre el proyecto, contacta al equipo de desarrollo.

## 📄 Licencia

Este proyecto es privado y confidencial.

---

**Desarrollado con ❤️ para la gestión eficiente de tu negocio**