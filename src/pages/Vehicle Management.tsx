'use client'

import {
  createMaintenanceRecord,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
} from '../lib/vehicleservices'
import Layout from '../components/Layout'
import '../styles/typography.css'
import type {
  Vehicle,
  MaintenanceRecord,
} from '../types/vehicles'
import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode
} from 'react'

type ClientVehicle = Omit<Vehicle, 'supportingDocuments'> & {
  supportingDocuments: string[]
}

type ClientMaintenance = Omit<MaintenanceRecord, 'vehicle'> & {
  vehicle: string
} 
type IconName =
  | 'bell'
  | 'calendar'
  | 'car'
  | 'chevron'
  | 'clock'
  | 'dashboard'
  | 'document'
  | 'edit'
  | 'eye'
  | 'filter'
  | 'fuel'
  | 'location'
  | 'maintenance'
  | 'menu'
  | 'plus'
  | 'search'
  | 'settings'
  | 'shield'
  | 'truck'
  | 'users'
  | 'x'

const vehicleTypes = [
  'SUV / AUV',
  'Pickup Truck',
  'Passenger Van',
  'Light-Duty Truck',
  'Commercial Utility Vehicle',
  'Special-Purpose Vehicle',
]
const departments = [
  'Administration',
  'Engineering',
  'Operations',
  'Sales',
  'Logistics',
  'Safety & Compliance',
]
const statuses = ['Available', 'In Use', 'Under Maintenance', 'In Transit']
const conditions = ['Good', 'Needs Inspection', 'Needs Repair']
const maintenanceTypes = [
  'Preventive Maintenance',
  'Oil Change',
  'Tire Service',
  'Brake Service',
  'Engine Repair',
  'Electrical Repair',
  'Body Repair',
  'Inspection',
  'Other',
]

function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  }
  const paths: Record<IconName, ReactNode> = {
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    car: (
      <>
        <path d="m5 17-1-4 2-5h12l2 5-1 4" />
        <path d="M3 13h18M7 17v2M17 17v2M7 13h.01M17 13h.01" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    document: (
      <>
        <path d="M6 2h9l4 4v16H6z" />
        <path d="M14 2v5h5M9 12h6M9 16h6" />
      </>
    ),
    edit: (
      <>
        <path d="m4 20 4-1 11-11-3-3L5 16z" />
        <path d="m14 7 3 3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
    fuel: (
      <>
        <path d="M4 22V3h11v19M2 22h15M7 7h5" />
        <path d="M15 8h3l2 3v7a2 2 0 0 0 2 2V9" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    maintenance: (
      <>
        <path d="m14 7 3-3 3 3-3 3M16 8 8 16" />
        <path d="m5 13-2 2 6 6 2-2M14 18l4-4 3 3-4 4z" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1l2-1-2-4-2 1a8 8 0 0 0-2-1l-.3-2h-5l-.3 2a8 8 0 0 0-2 1l-2-1-2 4 2 1a7 7 0 0 0 0 2l-2 1 2 4 2-1a8 8 0 0 0 2 1l.3 2h5l.3-2a8 8 0 0 0 2-1l2 1 2-4-2-1a7 7 0 0 0 .1-1" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    truck: (
      <>
        <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2" />
      </>
    ),
    x: <path d="M6 6l12 12M18 6 6 18" />,
  }
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" {...common}>
      {paths[name]}
    </svg>
  )
}

function dateLabel(value?: string | null) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en-PH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function money(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value)
}

function StatusPill({ value }: { value: string }) {
  const styles: Record<string, string> = {
    Available: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    'In Use': 'bg-blue-50 text-blue-700 ring-blue-200',
    'Under Maintenance': 'bg-amber-50 text-amber-800 ring-amber-200',
    'In Transit': 'bg-violet-50 text-violet-700 ring-violet-200',
    Good: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    'Needs Inspection': 'bg-amber-50 text-amber-800 ring-amber-200',
    'Needs Repair': 'bg-red-50 text-red-700 ring-red-200',
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 typo-label-sm font-semibold ring-1 ring-inset ${styles[value] ?? 'bg-zinc-50 text-zinc-600 ring-zinc-200'}`}
    >
      {value}
    </span>
  )
}



function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block typo-label-sm text-[#465248]">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'h-10 w-full rounded-lg border border-[#dfe3dc] bg-white px-3 typo-label-sm text-[#202923] outline-none transition placeholder:text-[#9da69f] focus:border-[#176B3A] focus:ring-2 focus:ring-[#176B3A]/10'

function Modal({
  title,
  subtitle,
  close,
  children,
  wide = false,
}: {
  title: string
  subtitle?: string
  close: () => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b2417]/45 p-3 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <section
        role="dialog"
        aria-modal="true"
        className={`max-h-[94vh] w-full overflow-hidden rounded-2xl bg-white shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-xl'}`}
      >
        <header className="flex items-start justify-between border-b border-[#e8ebe6] px-6 py-5">
          <div>
            <h2 className="typo-headline-sm text-[#202923]">{title}</h2>
            {subtitle && <p className="mt-1 typo-label-sm text-[#778078]">{subtitle}</p>}
          </div>
          <button
            aria-label="Close"
            onClick={close}
            className="grid size-9 place-items-center rounded-lg text-[#687168] hover:bg-[#f1f3ef]"
          >
            <Icon name="x" className="size-5" />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

function VehicleForm({
  vehicle,
  close
}: {
  vehicle?: ClientVehicle
  close: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string>()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const values = Object.fromEntries(
      new FormData(event.currentTarget).entries()
    )

    startTransition(async () => {
      try {
        const result = vehicle
          ? await updateVehicle(vehicle.id, values)
          : await createVehicle(values)

        if (!result.ok) {
          setMessage(result.message)
          return
        }

        close()
      } catch {
        setMessage('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={submit}>
      <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vehicle Make">
            <input
              className={inputClass}
              name="make"
              defaultValue={vehicle?.make}
              placeholder="e.g. Toyota"
              required
            />
          </Field>
          <Field label="Vehicle Model">
            <input
              className={inputClass}
              name="model"
              defaultValue={vehicle?.model}
              placeholder="e.g. Innova Revo"
              required
            />
          </Field>
          <Field label="Plate Number">
            <input
              className={inputClass}
              name="plateNumber"
              defaultValue={vehicle?.plateNumber}
              placeholder="NCP 2841"
              required
            />
          </Field>
          <Field label="Vehicle Type">
            <select
              className={inputClass}
              name="vehicleType"
              defaultValue={vehicle?.vehicleType ?? ''}
              required
            >
              <option value="" disabled>
                Select vehicle type
              </option>
              {vehicleTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Assigned Department">
            <select
              className={inputClass}
              name="department"
              defaultValue={vehicle?.department ?? ''}
              required
            >
              <option value="" disabled>
                Select department
              </option>
              {departments.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Year Model">
            <input
              className={inputClass}
              name="yearModel"
              type="number"
              min="1990"
              max="2100"
              defaultValue={vehicle?.yearModel}
              placeholder="2024"
              required
            />
          </Field>
          <Field label="Color">
            <input
              className={inputClass}
              name="color"
              defaultValue={vehicle?.color}
              placeholder="Super White"
              required
            />
          </Field>
          <Field label="Fuel Type">
            <select
              className={inputClass}
              name="fuelType"
              defaultValue={vehicle?.fuelType ?? ''}
              required
            >
              <option value="" disabled>
                Select fuel type
              </option>
              {['Diesel', 'Gasoline', 'Electric', 'Hybrid'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Seating Capacity">
            <input
              className={inputClass}
              name="seatingCapacity"
              type="number"
              min="1"
              max="100"
              defaultValue={vehicle?.seatingCapacity}
              placeholder="5"
              required
            />
          </Field>
          <Field label="Vehicle Identification Number (VIN)">
            <input
              className={inputClass}
              name="vin"
              defaultValue={vehicle?.vin ?? ''}
              placeholder="If available"
            />
          </Field>
          <Field label="Assigned Custodian">
            <input
              className={inputClass}
              name="assignedCustodian"
              defaultValue={vehicle?.assignedCustodian ?? ''}
              placeholder="Full name"
            />
          </Field>
          <Field label="Current Status">
            <select
              className={inputClass}
              name="status"
              defaultValue={vehicle?.status ?? 'Available'}
            >
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Registration Expiration Date">
            <input
              className={inputClass}
              name="registrationExpiration"
              type="date"
              defaultValue={vehicle?.registrationExpiration?.slice(0, 10)}
              required
            />
          </Field>
          <Field label="Insurance Expiration Date">
            <input
              className={inputClass}
              name="insuranceExpiration"
              type="date"
              defaultValue={vehicle?.insuranceExpiration?.slice(0, 10)}
              required
            />
          </Field>
          <Field label="Initial Vehicle Condition">
            <select
              className={inputClass}
              name="condition"
              defaultValue={vehicle?.condition ?? 'Good'}
            >
              {conditions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Remarks" className="sm:col-span-2">
            <textarea
              className={`${inputClass} h-20 resize-none py-2.5`}
              name="remarks"
              defaultValue={vehicle?.remarks ?? ''}
              placeholder="Add relevant notes about this vehicle"
            />
          </Field>
        </div>
        {message && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 typo-label-sm text-red-700">{message}</p>
        )}
      </div>
      <footer className="flex justify-end gap-3 border-t border-[#e8ebe6] bg-[#fafbf9] px-6 py-4">
        <button
          type="button"
          onClick={close}
          className="rounded-lg border border-[#d9ddd7] bg-white px-4 py-2.5 typo-label-sm text-[#4f5951] hover:bg-[#f4f6f2]"
        >
          Cancel
        </button>
        <button
          disabled={pending}
          className="rounded-lg bg-[#176B3A] px-5 py-2.5 typo-label-sm text-white shadow-sm hover:bg-[#12582f] disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save Vehicle'}
        </button>
      </footer>
    </form>
  )
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="typo-label-sm font-semibold uppercase tracking-[.08em] text-[#929a93]">{label}</p>
      <div className="mt-1 typo-body-sm font-medium text-[#263029]">{value || '—'}</div>
    </div>
  )
}

function VehicleDetails({
  vehicle,
  records,
  close,
  edit,
}: {
  vehicle: ClientVehicle
  records: ClientMaintenance[]
  close: () => void
  edit: () => void
}) {
  const [showStatus, setShowStatus] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string>()

  const statusSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const status = String(new FormData(event.currentTarget).get('status'))
    startTransition(async () => {
      const result = await updateVehicleStatus(vehicle.id, status)
      setMessage(result.message)
      if (result.ok) {
        setShowStatus(false)
      }
    })
  }
  const maintenanceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    startTransition(async () => {
      const result = await createMaintenanceRecord(vehicle.id, values)
      setMessage(result.message)
      if (result.ok) {
        setShowMaintenance(false)
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-[#0b2417]/35 backdrop-blur-[1px]"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <aside className="h-full w-full max-w-[760px] overflow-y-auto bg-[#f7f8f5] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-[#e1e5df] bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-xl bg-[#e8f2eb] text-[#176B3A]">
                <Icon
                  name={vehicle.vehicleType.includes('Truck') ? 'truck' : 'car'}
                  className="size-7"
                />
              </div>
              <div>
                <p className="typo-label-sm text-[#176B3A]">{vehicle.plateNumber}</p>
                <h2 className="typo-headline-sm text-[#202923]">
                  {vehicle.make} {vehicle.model}
                </h2>
              </div>
            </div>
            <button
              aria-label="Close details"
              onClick={close}
              className="grid size-9 place-items-center rounded-lg text-[#69736a] hover:bg-[#f0f2ee]"
            >
              <Icon name="x" className="size-5" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={edit}
              className="inline-flex items-center gap-2 rounded-lg bg-[#176B3A] px-4 py-2 typo-label-sm text-white hover:bg-[#12582f]"
            >
              <Icon name="edit" className="size-4" /> Edit Vehicle
            </button>
            <button
              onClick={() => setShowStatus(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#dbe0da] bg-white px-4 py-2 typo-label-sm text-[#3f4a42] hover:bg-[#f4f6f2]"
            >
              <Icon name="clock" className="size-4" /> Update Status
            </button>
            <button
              onClick={() => setShowMaintenance(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#dbe0da] bg-white px-4 py-2 typo-label-sm text-[#3f4a42] hover:bg-[#f4f6f2]"
            >
              <Icon name="plus" className="size-4" /> Add Maintenance
            </button>
          </div>
          {message && (
            <p className="mt-3 rounded-lg bg-[#eef5f0] px-3 py-2 typo-label-sm text-[#176B3A]">
              {message}
            </p>
          )}
        </div>
        <div className="space-y-4 p-5">
          <section className="rounded-xl border border-[#e2e6df] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,25,.03)]">
            <h3 className="mb-4 flex items-center gap-2 typo-label-md text-[#202923]">
              <Icon name="car" className="size-4 text-[#176B3A]" /> Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
              <DetailItem label="Make and Model" value={`${vehicle.make} ${vehicle.model}`} />
              <DetailItem label="Plate Number" value={vehicle.plateNumber} />
              <DetailItem label="Vehicle Type" value={vehicle.vehicleType} />
              <DetailItem label="Year Model" value={vehicle.yearModel} />
              <DetailItem label="Color" value={vehicle.color} />
              <DetailItem label="Fuel Type" value={vehicle.fuelType} />
              <DetailItem label="Seating Capacity" value={`${vehicle.seatingCapacity} persons`} />
            </div>
          </section>
          <section className="rounded-xl border border-[#e2e6df] bg-white p-5">
            <h3 className="mb-4 flex items-center gap-2 typo-label-md text-[#202923]">
              <Icon name="users" className="size-4 text-[#176B3A]" /> Assignment Information
            </h3>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              <DetailItem label="Assigned Department" value={vehicle.department} />
              <DetailItem label="Assigned Custodian" value={vehicle.assignedCustodian} />
              <DetailItem label="Current Status" value={<StatusPill value={vehicle.status} />} />
            </div>
          </section>
          <section className="rounded-xl border border-[#e2e6df] bg-white p-5">
            <h3 className="mb-4 flex items-center gap-2 typo-label-md text-[#202923]">
              <Icon name="document" className="size-4 text-[#176B3A]" /> Registration & Documents
            </h3>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              <DetailItem
                label="Registration Expiration"
                value={dateLabel(vehicle.registrationExpiration)}
              />
              <DetailItem
                label="Insurance Expiration"
                value={dateLabel(vehicle.insuranceExpiration)}
              />
              <DetailItem
                label="Supporting Documents"
                value={
                  vehicle.supportingDocuments.length
                    ? `${vehicle.supportingDocuments.length} uploaded`
                    : 'No documents uploaded'
                }
              />
            </div>
          </section>
          <section className="rounded-xl border border-[#e2e6df] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 typo-label-md text-[#202923]">
                <Icon name="maintenance" className="size-4 text-[#176B3A]" /> Maintenance
                Information
              </h3>
              <button
                onClick={() => setShowMaintenance(true)}
                className="typo-label-sm text-[#176B3A] hover:underline"
              >
                + Add record
              </button>
            </div>
            <div className="mb-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
              <DetailItem label="Last Maintenance" value={dateLabel(vehicle.lastMaintenanceDate)} />
              <DetailItem label="Next Scheduled" value={dateLabel(vehicle.nextMaintenanceDate)} />
              <DetailItem label="Maintenance Status" value={vehicle.maintenanceStatus} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left typo-label-sm">
                <thead>
                  <tr className="border-y border-[#edf0eb] bg-[#fafbf9] text-[#7b847d]">
                    <th className="px-3 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 font-semibold">Service</th>
                    <th className="px-3 py-2.5 font-semibold">Provider</th>
                    <th className="px-3 py-2.5 font-semibold">Cost</th>
                    <th className="px-3 py-2.5 font-semibold">Next Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length ? (
                    records.map((record) => (
                      <tr key={record.id} className="border-b border-[#edf0eb]">
                        <td className="px-3 py-3 font-medium">
                          {dateLabel(record.maintenanceDate)}
                        </td>
                        <td className="px-3 py-3">{record.maintenanceType}</td>
                        <td className="px-3 py-3">{record.serviceProvider}</td>
                        <td className="px-3 py-3 font-semibold">{money(record.cost)}</td>
                        <td className="px-3 py-3">{dateLabel(record.nextMaintenanceSchedule)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-[#879089]">
                        No maintenance history recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          {vehicle.remarks && (
            <section className="rounded-xl border border-[#e2e6df] bg-white p-5">
              <h3 className="mb-2 typo-label-md">Remarks</h3>
              <p className="typo-body-sm leading-6 text-[#647067]">{vehicle.remarks}</p>
            </section>
          )}
        </div>
      </aside>
      {showStatus && (
        <Modal
          title="Update Vehicle Status"
          subtitle={vehicle.plateNumber}
          close={() => setShowStatus(false)}
        >
          <form onSubmit={statusSubmit}>
            <div className="px-6 py-5">
              <Field label="Current Vehicle Status">
                <select className={inputClass} name="status" defaultValue={vehicle.status}>
                  {statuses.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>
            <footer className="flex justify-end gap-3 border-t bg-[#fafbf9] px-6 py-4">
              <button
                type="button"
                onClick={() => setShowStatus(false)}
                className="rounded-lg border px-4 py-2 typo-label-sm"
              >
                Cancel
              </button>
              <button
                disabled={pending}
                className="rounded-lg bg-[#176B3A] px-4 py-2 typo-label-sm text-white"
              >
                {pending ? 'Updating…' : 'Update Status'}
              </button>
            </footer>
          </form>
        </Modal>
      )}
      {showMaintenance && (
        <Modal
          title="Add Maintenance Record"
          subtitle={`${vehicle.make} ${vehicle.model} · ${vehicle.plateNumber}`}
          close={() => setShowMaintenance(false)}
        >
          <form onSubmit={maintenanceSubmit}>
            <div className="grid max-h-[65vh] gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
              <Field label="Maintenance Date">
                <input className={inputClass} name="maintenanceDate" type="date" required />
              </Field>
              <Field label="Maintenance Type">
                <select className={inputClass} name="maintenanceType" defaultValue="" required>
                  <option value="" disabled>
                    Select service
                  </option>
                  {maintenanceTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Service Provider / Repair Shop">
                <input
                  className={inputClass}
                  name="serviceProvider"
                  placeholder="Provider name"
                  required
                />
              </Field>
              <Field label="Maintenance Cost (PHP)">
                <input
                  className={inputClass}
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </Field>
              <Field label="Next Maintenance Schedule">
                <input className={inputClass} name="nextMaintenanceSchedule" type="date" />
              </Field>
              <Field label="Remarks" className="sm:col-span-2">
                <textarea
                  className={`${inputClass} h-20 resize-none py-2.5`}
                  name="remarks"
                  placeholder="Service details and findings"
                />
              </Field>
            </div>
            <footer className="flex justify-end gap-3 border-t bg-[#fafbf9] px-6 py-4">
              <button
                type="button"
                onClick={() => setShowMaintenance(false)}
                className="rounded-lg border px-4 py-2 typo-label-sm"
              >
                Cancel
              </button>
              <button
                disabled={pending}
                className="rounded-lg bg-[#176B3A] px-4 py-2 typo-label-sm text-white"
              >
                {pending ? 'Saving…' : 'Save Record'}
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default function VehicleManagement({
  initialVehicles,
  initialMaintenance,
}: {
  initialVehicles: ClientVehicle[]
  initialMaintenance: ClientMaintenance[]
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All')
  const [department, setDepartment] = useState('All')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)
  const [formVehicle, setFormVehicle] = useState<ClientVehicle | 'new' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const pageSize = 6
  const selectedVehicle = initialVehicles.find((item) => item.id === selectedId)
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return initialVehicles.filter(
      (vehicle) =>
        (!query ||
          `${vehicle.make} ${vehicle.model} ${vehicle.plateNumber}`
            .toLowerCase()
            .includes(query)) &&
        (type === 'All' || vehicle.vehicleType === type) &&
        (department === 'All' || vehicle.department === department) &&
        (status === 'All' || vehicle.status === status),
    )
  }, [initialVehicles, search, type, department, status])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const resetPage = (setter: (value: string) => void, value: string) => {
    setter(value)
    setPage(1)
  }

  return (
    <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <button
        className="mobile-menu fixed left-3 top-3 z-40 lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Icon name="menu" className="size-5" />
      </button>
      <div className="min-h-screen bg-[#F5F6F3] text-[#202923]">
        <main className="mx-auto max-w-[1540px] px-4 pt-14 pb-6 sm:px-7 lg:px-9 lg:py-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <h1 className="typo-headline-sm leading-1.2 tracking-[-.035em] text-slate-900">
                Vehicle Management
              </h1>
              <p className="mt-[6px] max-w-2xl typo-label-sm text-[#718096]">
                Manage your fleet vehicles, add new units, and track maintenance schedules.
              </p>
            </div>
            <button
              onClick={() => setFormVehicle('new')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#176B3A] px-5 py-3 typo-label-sm text-white shadow-[0_6px_18px_rgba(23,107,58,.18)] transition hover:-translate-y-0.5 hover:bg-[#12582f]"
            >
              <Icon name="plus" className="size-5" /> Add Vehicle
            </button>
          </div>
          <section className="mt-6 overflow-hidden rounded-2xl border border-[#e0e4dd] bg-white shadow-[0_3px_14px_rgba(29,50,35,.04)]">
            <div className="border-b border-[#e8ebe6] px-4 py-5 sm:px-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="typo-title-md">Vehicle Inventory</h2>
                  <p className="mt-1 typo-label-sm text-[#8b938c]">
                    {filtered.length} vehicle{filtered.length === 1 ? '' : 's'} found
                  </p>
                </div>
                <button
                  aria-label="Filter inventory"
                  className="grid size-9 place-items-center rounded-lg border border-[#e1e5df] text-[#667068] sm:hidden"
                >
                  <Icon name="filter" className="size-4" />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr]">
                <div className="relative">
                  <Icon
                    name="search"
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#99a19a]"
                  />
                  <input
                    value={search}
                    onChange={(e) => resetPage(setSearch, e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="Search vehicle or plate number…"
                  />
                </div>
                <select
                  value={type}
                  onChange={(e) => resetPage(setType, e.target.value)}
                  className={inputClass}
                >
                  <option>All</option>
                  {vehicleTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={department}
                  onChange={(e) => resetPage(setDepartment, e.target.value)}
                  className={inputClass}
                >
                  <option>All</option>
                  {departments.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={status}
                  onChange={(e) => resetPage(setStatus, e.target.value)}
                  className={inputClass}
                >
                  <option>All</option>
                  {statuses.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="border-b border-[#e8ebe6] bg-[#fafbf9] typo-label-sm uppercase tracking-[.06em] text-[#7e8780]">
                    <th className="px-5 py-3.5 font-medium">Vehicle / Model</th>
                    <th className="px-4 py-3.5 font-medium">Plate Number</th>
                    <th className="px-4 py-3.5 font-medium">Vehicle Type</th>
                    <th className="px-4 py-3.5 font-medium">Assigned Department</th>
                    <th className="px-4 py-3.5 font-medium">Condition</th>
                    <th className="px-4 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length ? (
                    visible.map((vehicle) => (
                      <tr
                        key={vehicle.id}
                        onClick={() => setSelectedId(vehicle.id)}
                        className="cursor-pointer border-b border-[#edf0eb] transition last:border-0 hover:bg-[#f8faf7]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 place-items-center rounded-lg bg-[#edf4ef] text-[#176B3A]">
                              <Icon
                                name={vehicle.vehicleType.includes('Truck') ? 'truck' : 'car'}
                                className="size-[18px]"
                              />
                            </div>
                            <div>
                              <p className="typo-title-sm text-[#253029]">
                                {vehicle.make} {vehicle.model}
                              </p>
                              <p className="mt-0.5 typo-label-sm text-[#969e97]">
                                {vehicle.yearModel} · {vehicle.color}
                              </p>
                            </div>
                          </div>
                        </td>
                          <td className="px-4 py-4 font-mono typo-label-sm tracking-wide text-[#3c4840]">
                            {vehicle.plateNumber}
                          </td>
                          <td className="px-4 py-4 typo-label-sm text-[#58635b]">{vehicle.vehicleType}</td>
                          <td className="px-4 py-4 typo-label-sm text-[#58635b]">{vehicle.department}</td>
                        <td className="px-4 py-4">
                          <StatusPill value={vehicle.condition} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusPill value={vehicle.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              aria-label={`View ${vehicle.plateNumber}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedId(vehicle.id)
                              }}
                              className="grid size-8 place-items-center rounded-lg text-[#687269] hover:bg-[#e8f2eb] hover:text-[#176B3A]"
                            >
                              <Icon name="eye" className="size-4" />
                            </button>
                            <button
                              aria-label={`Edit ${vehicle.plateNumber}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormVehicle(vehicle)
                              }}
                              className="grid size-8 place-items-center rounded-lg text-[#687269] hover:bg-[#e8f2eb] hover:text-[#176B3A]"
                            >
                              <Icon name="edit" className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#f0f3ee] text-[#8c958d]">
                          <Icon name="search" className="size-5" />
                        </div>
                        <p className="mt-3 typo-label-md">No vehicles match your filters</p>
                        <p className="mt-1 typo-label-sm text-[#8a938b]">
                          Try clearing one or more search filters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="flex flex-col gap-3 border-t border-[#e8ebe6] px-5 py-4 typo-label-sm text-[#778078] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–
                {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} vehicles
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-[#dfe3dc] px-3 py-2 font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => setPage(number)}
                    className={`size-8 rounded-lg font-semibold ${number === currentPage ? 'bg-[#176B3A] text-white' : 'hover:bg-[#eef1ec]'}`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  disabled={currentPage === pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="rounded-lg border border-[#dfe3dc] px-3 py-2 font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </footer>
          </section>
        </main>
      </div>
      {formVehicle && (
        <Modal
          wide
          title={formVehicle === 'new' ? 'Add New Vehicle' : 'Edit Vehicle'}
          subtitle={
            formVehicle === 'new'
              ? 'Create a complete company fleet record.'
              : `Update ${formVehicle.plateNumber}`
          }
          close={() => setFormVehicle(null)}
        >
          <VehicleForm
            vehicle={formVehicle === 'new' ? undefined : formVehicle}
            close={() => setFormVehicle(null)}
          />
        </Modal>
      )}
      {selectedVehicle && (
        <VehicleDetails
          vehicle={selectedVehicle}
          records={initialMaintenance.filter((record) => record.vehicle === selectedVehicle.id)}
          close={() => setSelectedId(null)}
          edit={() => setFormVehicle(selectedVehicle)}
        />
      )}
    </Layout>
  )
}
