/* eslint-disable no-multi-spaces */
/* eslint-disable @typescript-eslint/key-spacing */

export interface MeResponse {
  user:          User
  starredStores: number[]
}

export interface User {
  id:                  number
  username:            string
  isCorporateCustomer: boolean
  experiencePoints:    number
  corporateNumber:     string
  corporateName:       string
  streetAddress:       string
  invoiceEmail:        string
  phoneNumber:         string
  firstName:           string
  rankLevel:           number
  lastName:            string
  zipCode:             string
  avatar:              Avatar
  email:               string
  city:                string
  ssn:                 string
  isAdmin:             boolean
  isEmployee:          boolean
  settings:            Settings
  storeSuggestions:    number[]
  storeWeights:        number[]
  paymentSuggestions:  number[]
  paymentWeights:      number[]
  shippingSuggestions: number[]
  shippingWeights:     number[]
  knighthood:          null
  showTitleTwo:        boolean
}

export interface Avatar {
  class: Class
}

export interface Class {
  id:    number
  title: string
}

export interface Settings {
  product_list_mode:               number
  no_focus_search:                 boolean
  send_reminder_mail:              boolean
  show_prices_excluding_vat:       boolean
  send_email_receipt:              boolean
  show_member_tutorial:            boolean
  print_waybill:                   boolean
  auto_open_admin_panel:           boolean
  default_to_admin_search:         boolean
  open_products_in_admin:          boolean
  show_member_prices_as_admin:     boolean
  open_classic_admin_in_new_tab:   boolean
  serious_business_mode:           boolean
  send_newsletter:                 boolean
  member_after_checkout:           boolean
  newsletter_option_modified_at:   number
  show_newsletter_popup:           boolean
  send_sms:                        boolean
  membership_cancelled_at:         number
  member_level_threshold_at:       number
  member_gained_xp_at:             number
  member_level_changed_at:         number
  member_class_changed_at:         number
  voyado_email_group:              number
  voyado_email_group_active:       number
  voyado_sms_option_modified_at:   number
  voyado_email_option_modified_at: number
  test_user:                       number
  notification_settings_level:     number
  update_achievement_request:      boolean
  b2b_no_invoice_fee:              boolean
  b2b_no_delivery_fee:             boolean
}
