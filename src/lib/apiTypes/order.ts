/* eslint-disable no-multi-spaces */
/* eslint-disable @typescript-eslint/key-spacing */

export interface OrderResponse {
  currentResultPageCount: number
  orders:                 Array<Order & { error?: true }>
  counts:                 Counts
}

export interface Counts {
  active:    number
  history:   number
  service:   number
  cancelled: number
}

export interface Order {
  id:                        number
  orderDate:                 number
  sentDate:                  number
  totalSum:                  number
  readyDate:                 number | null
  reservedUntil:             null
  paymentMethod:             PaymentMethod
  shippingMethod:            ShippingMethod
  currency:                  Currency
  statusCode:                number
  trackingNumber:            null | string
  trackingUrl:               null | string
  discount:                  number
  discountCodes:             unknown[]
  isPrivateCustomer:         boolean
  deliveries:                Delivery[]
  rows:                      Row[]
  store:                     Store | null
  cjEvent:                   null
  productKeys:               unknown[]
  isExtendable:              boolean
  shippingAddress:           ShippingAddress | null
  userExperiencePointBoosts: UserExperiencePointBoost[]
  isBinding?:                boolean
  entries?:                  Entry[]
}

export type Currency = 'SEK'

export interface Delivery {
  rows:          Row[]
  statusEntries: Entry[]
  sentLater:     boolean
  timestamp:     number
}

export interface Row {
  id:               number
  locked:           boolean
  unitVat:          number
  quantity:         number
  unitPrice:        number
  product:          Product
  insuranceInfo:    null
  sentDate:         number
  hasSubscription:  boolean
  subscriptionData: unknown[]
}

export interface Product {
  id:                   number
  name:                 string
  release:              Release
  thumbnail:            string
  longDeliveryNotice:   null
  customerWorkshopInfo: CustomerWorkshopInfo
  section:              Section
  categoryTree:         string
  manufacturer:         Manufacturer
}

export interface CustomerWorkshopInfo {
  url:  null
  text: null
}

export interface Manufacturer {
  id:          number
  name:        string
  takeoverUrl: null
  websiteUrl:  string
  visible:     boolean
}

export interface Release {
  timestamp: number
  format:    Format
}

export type Format = 'Y-m-d'

export interface Section {
  id:        number
  metaTitle: MetaTitle
  active:    boolean
  icon:      SectionIcon
  name:      SectionName
}

export type SectionIcon = string

export type MetaTitle = string

export type SectionName = string

export interface Entry {
  id:           number
  title:        Title
  message:      string
  date:         string
  deliveryDate: null
  status:       EntryStatus
  products:     unknown[]
  subEntries:   SubEntry[]
}

export interface EntryStatus {
  id:   number
  icon: StatusIcon | null
}

export type StatusIcon = 'check' | ''

export interface SubEntry {
  id:           number
  title:        string
  message:      string
  date:         string
  deliveryDate: Date
  status:       StatusElement
  products:     StatusElement[]
}

export interface StatusElement {
  id: number
}

export type Title = 'Hämtad' | 'Webhallen Malmö Emporia' | 'Webhallen' | 'Webhallen Malmö City' | 'Webhallen Centrallager'

export interface PaymentMethod {
  id:                      number
  isPrepayment:            boolean
  isRefundedAutomatically: boolean
  name:                    PaymentMethodName
}

export type PaymentMethodName = 'Betala i butik' | 'Kort / Internetbank / Faktura / Delbetalning'

export interface ShippingAddress {
  name:    string
  city:    string
  address: string
  zipCode: string
}

export interface ShippingMethod {
  id:    number
  name:  ShippingMethodName
  price: number
  vat:   number
}

export type ShippingMethodName = 'Hämta i butik' | 'Brev / Postpaket'

export interface Store {
  id:            number
  isPickupPoint: boolean
  location:      Location
  zipCode:       string
  address:       string
  name:          string
  city:          string
}

export interface Location {
  lat: number
  lng: number
}

export interface UserExperiencePointBoost {
  description:      string
  experiencePoints: number
}
