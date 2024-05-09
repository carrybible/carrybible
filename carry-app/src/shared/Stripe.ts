import { CardType } from '@dts/stripe'
import functions from '@react-native-firebase/functions'

async function requestIntent(
  amount: number,
  currency: string,
  info: {
    type: 'campaign' | 'tithe'
    eventId: string
    eventName: string
    groupId: string
    groupName: string
    campusId: string
    organisationId: string
  },
): Promise<
  | {
      setupIntent: string
      ephemeralKey: string
      customer: string
    }
  | undefined
> {
  const request = functions().httpsCallable('func_request_intent')
  const response = await request({ amount, currency, info })
  if (response.data.success) {
    return response.data.data
  } else {
    toast.error(response.data.message)
    devLog('Error request intent', response.data.message)
    return undefined
  }
}

async function requestCheckoutLink(
  amount: number | string | undefined,
  currency: string,
  info: {
    type: 'campaign' | 'tithe'
    eventId: string
    eventName: string
    groupId: string
    groupName: string
    campusId: string
    organisationId: string
    productName?: string
  },
  returnUrl: string,
): Promise<
  | {
      url: string
      id: string
      code: string
    }
  | undefined
> {
  const request = functions().httpsCallable('func_create_checkout')
  const response = await request({ amount, currency, info, returnUrl })
  if (response.data.success) {
    return response.data.data
  } else {
    toast.error(response.data.message)
    devLog('Error request checkout', response.data.message)
    return undefined
  }
}

async function getCards(organisationId: string): Promise<CardType[]> {
  const request = functions().httpsCallable('func_get_cards')
  const response = await request({ organisationId })
  if (response.data.success) {
    return response.data.data as CardType[]
  } else {
    toast.error(response.data.message)
    devLog('Error get cards', response.data.message)
    return []
  }
}

async function addCard(
  data: {
    number: string
    exp_month: number
    exp_year: number
    cvc: string
    name: string
  },
  organisationId: string,
): Promise<CardType | undefined> {
  const { number, exp_month, exp_year, cvc, name } = data
  const request = functions().httpsCallable('func_add_card')
  const response = await request({
    card: { number, exp_month, exp_year, cvc },
    details: {
      name,
    },
    organisationId,
  })
  if (response.data.success) {
    return response.data.data as CardType
  } else {
    toast.error(response.data.message)
    devLog('Error add card', response.data.message)
    return undefined
  }
}

async function updateCard(
  cardId: string,
  data: {
    exp_month: number
    exp_year: number
    name: string
  },
  organisationId: string,
): Promise<boolean> {
  const { exp_month, exp_year, name } = data
  const request = functions().httpsCallable('func_update_card')
  const response = await request({
    cardId,
    card: { exp_month, exp_year },
    details: { name },
    organisationId,
  })
  if (response.data.success) {
    return true
  } else {
    toast.error(response.data.message)
    devLog('Error update card', response.data.message)
    return false
  }
}

async function deleteCard(cardId: string, organisationId: string): Promise<boolean> {
  const request = functions().httpsCallable('func_delete_card')
  const response = await request({ cardId, organisationId })

  if (response.data.success) {
    return true
  } else {
    toast.error(response.data.message)
    devLog('Error delete card', response.data.message)
    return false
  }
}

export type RecordDonationProps = {
  campaignId?: string
  groupId?: string
  campusId?: string
  fundId?: string
  amount?: number
  currency: string
  transactionDetails: any
  organisationId: string
}

async function recordDonation(props: RecordDonationProps): Promise<boolean | string> {
  const request = functions().httpsCallable('func_make_donate')
  const response = await request(props)

  if (response.data.success && response.data.data.id) {
    return response.data.data.id
  } else {
    toast.error(response.data.message)
    devLog('Error make donate', response.data.message)
    return false
  }
}

async function updateEmailDonation(props: { donationId: string; email: string; organisationId: string }): Promise<boolean> {
  const request = functions().httpsCallable('func_update_donate')
  const response = await request(props)

  devLog('[Make donate]', response, props)
  if (response.data.success) {
    return true
  } else {
    toast.error(response.data.message)
    devLog('Error make donate', response.data.message)
    return false
  }
}

const mapCardBranch = brand => {
  switch (brand) {
    case 'amex':
      return {
        name: 'American Express',
        image: require('../assets/icons/american-express.png'),
      }
    case 'cartes_bancaires':
      return {
        name: 'CB',
        image: require('../assets/icons/cb.png'),
      }
    case 'diners':
      return {
        name: 'Diners Club',
        image: require('../assets/icons/diners-club.png'),
      }
    case 'discover':
      return {
        name: 'Discover',
        image: require('../assets/icons/discover.png'),
      }
    case 'jcb':
      return {
        name: 'JCB',
        image: require('../assets/icons/jcb.png'),
      }
    case 'mastercard':
      return {
        name: 'Mastercard',
        image: require('../assets/icons/mastercard.png'),
      }
    case 'visa':
      return {
        name: 'Visa',
        image: require('../assets/icons/visa.png'),
      }
    case 'unionpay':
      return {
        name: 'UnionPay',
        image: require('../assets/icons/unionpay.png'),
      }
    default:
      return {
        name: 'Unknown',
        image: require('../assets/icons/unknown-card.png'),
      }
  }
}

export default {
  getCards,
  addCard,
  updateCard,
  deleteCard,
  mapCardBranch,
  requestIntent,
  recordDonation,
  updateEmailDonation,
  requestCheckoutLink,
}
