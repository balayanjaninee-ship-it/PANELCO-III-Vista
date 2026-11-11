import type { CollectionConfig } from 'payload'

const isAdmin = ({ req }: { req: { user?: { collection?: string } | null } }) =>
  req.user?.collection === 'admins'

export const MaintenanceRecords: CollectionConfig = {
  slug: 'maintenance-records',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  admin: {
    group: 'Fleet Operations',
    useAsTitle: 'maintenanceType',
    defaultColumns: ['vehicle', 'maintenanceDate', 'maintenanceType', 'serviceProvider', 'cost'],
  },
  fields: [
    {
      name: 'vehicle',
      type: 'relationship',
      relationTo: 'vehicles',
      required: true,
      index: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'maintenanceDate', type: 'date', required: true, index: true },
        {
          name: 'maintenanceType',
          type: 'select',
          required: true,
          options: [
            'Preventive Maintenance',
            'Oil Change',
            'Tire Service',
            'Brake Service',
            'Engine Repair',
            'Electrical Repair',
            'Body Repair',
            'Inspection',
            'Other',
          ],
        },
        { name: 'nextMaintenanceSchedule', type: 'date' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'serviceProvider', type: 'text', required: true },
        { name: 'cost', type: 'number', required: true, min: 0 },
      ],
    },
    { name: 'remarks', type: 'textarea' },
  ],
}
