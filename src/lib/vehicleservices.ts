
import type { Vehicle, MaintenanceRecord } from '../types/vehicles'

const API_URL = 'http://localhost:5000/api'

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Something went wrong.')
  }

  return result
}

export async function createVehicle(
  input: Partial<Vehicle>
): Promise<ActionResult> {
  try {
    return await request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unable to add vehicle.',
    }
  }
}

export async function updateVehicle(
  id: string,
  input: Partial<Vehicle>
): Promise<ActionResult> {
  try {
    return await request(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unable to update vehicle.',
    }
  }
}

export async function updateVehicleStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  try {
    return await request(`/vehicles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unable to update status.',
    }
  }
}

export async function createMaintenanceRecord(
  vehicleId: string,
  input: Partial<MaintenanceRecord>
): Promise<ActionResult> {
  try {
    return await request(`/vehicles/${vehicleId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unable to add maintenance record.',
    }
  }
}
