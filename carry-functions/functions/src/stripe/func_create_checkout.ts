import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'
import { Service } from '../shared'
import StripeService, { getUsersStripeId } from '../shared/StripeService'
import { removeUndefinedParams, resError, resSuccess } from '../shared/Utils'
import collections from '../types/collections'

interface StripProduct extends Stripe.Response<Stripe.Product> {
  price?: Stripe.Response<Stripe.Price>
}

const func_create_checkout = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    params: {
      amount?: number
      currency: string
      info: {
        type: 'campaign' | 'tithe'
        eventId: string
        eventName: string
        groupId: string
        groupName: string
        campusId: string
        organisationId?: string // Support donate from guest
        productName?: string
      }
      returnUrl: string
    },
    context,
  ) => {
    const uid: string = context.auth?.uid || ''
    return await genCheckout(uid, params.amount, params.currency, params.info, params.returnUrl)
  },
)

export const genCheckout = async (
  uid: string,
  amount: number | undefined,
  currency: string,
  info: {
    type: 'campaign' | 'tithe'
    eventId: string
    eventName: string
    groupId: string
    groupName: string
    campusId: string
    campusName?: string
    organisationId?: string // Support donate from guest
    productName?: string
  },
  returnUrl: string,
) => {
  const userRef = firestore().collection(collections.USERS).doc(uid)
  const userDoc = await userRef.get()
  const user = userDoc.data() as Carry.User
  const organisationId = info.organisationId || user.organisation?.id || ''
  try {
    const stripeData = await getUsersStripeId(user, info.organisationId)
    if (!stripeData.success) return stripeData
    const { customerId, options } = stripeData.data

    if (info.campusId) {
      try {
        const campusData = (await (
          await firestore()
            .collection(`${collections.ORGANISATIONS}`)
            .doc(organisationId)
            .collection(collections.CAMPUS)
            .doc(info.campusId)
            .get()
        ).data()) as Carry.Campus
        info.campusName = campusData?.name || ''
      } catch (error: any) {
        logger.error('Campus not found', uid, amount, currency, info)
      }
    }

    const stripeProductRef = firestore()
      .collection(`${collections.ORGANISATIONS}`)
      .doc(organisationId)
      .collection(collections.DONATE_PRODUCTS)
      .doc(`${amount ? `${amount}-${currency.toUpperCase()}` : `custom-${currency.toUpperCase()}`}`)

    const stripeProductDoc = await stripeProductRef.get()
    let productPrice: StripProduct | undefined
    if (!stripeProductDoc.exists) {
      const product = await StripeService.products.create(
        {
          name: info.productName || 'Donation',
        },
        options,
      )
      if (!product) return resError('Product not found!')

      let price: Stripe.Response<Stripe.Price> | undefined
      if (amount) {
        price = await StripeService.prices.create(
          {
            currency: currency.toUpperCase(),
            unit_amount_decimal: `${amount}`,
            product: product.id,
          },
          options,
        )
      } else {
        price = await StripeService.prices.create(
          {
            currency: currency.toUpperCase(),
            custom_unit_amount: { enabled: true },
            product: product.id,
          },
          options,
        )
      }

      if (!price) return resError('Amount not found!')

      productPrice = { ...product, price }
      await stripeProductRef.set(productPrice)
    } else {
      productPrice = stripeProductDoc.data() as StripProduct
    }

    const code = uuidv4()

    const checkout = await StripeService.checkout.sessions.create(
      {
        success_url: returnUrl.startsWith('http') ? returnUrl : `https://${returnUrl}`,
        line_items: [
          {
            price: productPrice?.price?.id || '',
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer: customerId,
        payment_intent_data: {
          metadata: info,
        },
      },
      options,
    )

    await firestore()
      .collection(`${collections.CHECKOUTS}`)
      .doc(checkout.id)
      .set(
        removeUndefinedParams({
          ...checkout,
          requestOptions: removeUndefinedParams({
            uid,
            amount,
            currency,
            info: removeUndefinedParams(info),
          }),
          identifierCode: code,
        }),
      )

    return resSuccess('Create checkout success', {
      url: checkout.url,
      id: checkout.id,
      code: code,
    })
  } catch (e: any) {
    return resError(`Cannot generate checkout, ${e.message}`, uid)
  }
}

export interface StripCheckout extends Stripe.Response<Stripe.Checkout.Session> {
  requestOptions: {
    uid: string
    amount: number | undefined
    currency: string
    info: {
      type: 'campaign' | 'tithe'
      eventId: string
      eventName: string
      groupId: string
      groupName: string
      campusId: string
      campusName?: string
      organisationId: string // Support donate from guest
      productName?: string
    }
  }
  identifierCode: string
}

export default func_create_checkout
