export enum ItemCategory {
  RAW_MATERIAL = 'RAW_MATERIAL',
  PRODUCT = 'PRODUCT'
}

export enum Unit {
  KG = 'kg',
  UNIT = 'units',
  LITER = 'L'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: Unit;
  minStock: number;
  costPerUnit: number; // Cost for raw, Price for product
  image?: string;
}

export interface Recipe {
  productId: string;
  processTimeMinutes: number; // Added for workflow visualization
  ingredients: {
    rawMaterialId: string;
    quantity: number;
  }[];
}

export interface Transaction {
  id: string;
  timestamp: number;
  type: 'RESTOCK' | 'PRODUCTION_START' | 'PRODUCTION_FINISH' | 'ADJUSTMENT';
  details: string;
  amount?: number;
  batchId?: string;
  cost?: number;
}

export type BatchStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED';

export interface Batch {
  id: string;
  productId: string;
  quantity: number;
  startTime: number;
  estimatedCost: number;
  status: BatchStatus;
}

export interface Alert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}