import { apiClient } from './client';
import { BackendOrder } from './types';

export interface OrderCreateParams {
  external_order_id: string;
  customer_name: string;
  customer_phone: string;
  pickup_lat?: number;
  pickup_lng?: number;
  pickup_address?: string;
  delivery_lat: number;
  delivery_lng: number;
  delivery_address: string;
  weight_kg: number;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  window_start?: string;
  window_end?: string;
  service_duration_minutes?: number;
}

export const orderApi = {
  async listOrders(params?: {
    status?: string;
    priority?: string;
    vehicle_id?: string;
    search?: string;
    limit?: number;
  }): Promise<BackendOrder[]> {
    return apiClient.get<BackendOrder[]>('/orders', params);
  },

  async getOrder(orderId: string): Promise<BackendOrder> {
    return apiClient.get<BackendOrder>(`/orders/${orderId}`);
  },

  async createOrder(data: OrderCreateParams): Promise<BackendOrder> {
    return apiClient.post<BackendOrder>('/orders', {
      pickup_lat: 26.9124,
      pickup_lng: 75.7873,
      pickup_address: 'Jaipur Central Logistic Hub (Transport Nagar)',
      priority: 'NORMAL',
      window_start: '09:00',
      window_end: '18:00',
      service_duration_minutes: 15,
      ...data,
    });
  },

  async updateOrder(orderId: string, data: Partial<BackendOrder>): Promise<BackendOrder> {
    return apiClient.patch<BackendOrder>(`/orders/${orderId}`, data);
  },

  async deleteOrder(orderId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/orders/${orderId}`);
  },
};
