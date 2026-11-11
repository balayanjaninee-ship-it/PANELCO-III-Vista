
export interface Vehicle {
  id: string
  make: string
  model: string
  plateNumber: string
  vehicleType: string
  department: string
  status: string
  yearModel: number
  color: string
  fuelType: string
  seatingCapacity: number
  vin?: string | null
  assignedCustodian?: string | null
  registrationExpiration: string
  insuranceExpiration: string
  condition: string
  lastMaintenanceDate?: string | null
  nextMaintenanceDate?: string | null
  maintenanceStatus?: string
  supportingDocuments: string[]
  remarks?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface MaintenanceRecord {
  id: string
  vehicle: string
  maintenanceDate: string
  maintenanceType: string
  serviceProvider: string
  cost: number
  nextMaintenanceSchedule?: string | null
  remarks?: string | null
}
