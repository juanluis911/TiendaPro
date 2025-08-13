// src/types/tiendas.ts
import { Timestamp } from 'firebase/firestore';

export interface TiendaFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  currency: string;
  timezone: string;
  businessHours: {
    open: string;
    close: string;
    days: string[];
  };
  active: boolean;
}

export interface TiendaFilters {
  status: string;
  manager: string;
  search: string;
}

export const MONEDAS_DISPONIBLES = [
  { value: 'MXN', label: 'Peso Mexicano (MXN)', symbol: '$' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
] as const;

export const ZONAS_HORARIAS_MEXICO = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
  { value: 'America/Tijuana', label: 'Tijuana (UTC-8)' },
  { value: 'America/Hermosillo', label: 'Hermosillo (UTC-7)' },
  { value: 'America/Merida', label: 'Mérida (UTC-6)' },
  { value: 'America/Cancun', label: 'Cancún (UTC-5)' },
] as const;

export const DIAS_SEMANA = [
  { value: 'monday', label: 'Lunes', short: 'L' },
  { value: 'tuesday', label: 'Martes', short: 'M' },
  { value: 'wednesday', label: 'Miércoles', short: 'Mi' },
  { value: 'thursday', label: 'Jueves', short: 'J' },
  { value: 'friday', label: 'Viernes', short: 'V' },
  { value: 'saturday', label: 'Sábado', short: 'S' },
  { value: 'sunday', label: 'Domingo', short: 'D' },
] as const;

export const ESTADOS_TIENDA = [
  { value: 'active', label: 'Activa', color: 'success' },
  { value: 'inactive', label: 'Inactiva', color: 'error' },
] as const;