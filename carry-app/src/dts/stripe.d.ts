export type Intent = {
  setupIntent: string
  ephemeralKey: string
  customer: string
}

export type CardType = {
  livemode: boolean
  customer: string
  id: string
  billing_details: {
    address: {
      postal_code: string | null
      country: string | null
      state: string | null
      line2: string | null
      city: string | null
      line1: string | null
    }
    phone: string | null
    name: string | null
    email: string | null
  }
  object: string
  card: {
    country: string
    exp_year: number
    checks: {
      address_postal_code_check: string | null
      cvc_check: string
      address_line1_check: string | null
    }
    networks: {
      available: string[]
      preferred: string | null
    }
    exp_month: number
    brand: string
    wallet: string | null
    funding: string
    three_d_secure_usage: {
      supported: true
    }
    last4: string
    generated_from: string | null
    fingerprint: string
  }
  created: number
  type: string
}
