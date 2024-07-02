import Stripe from 'stripe'
import { envConfig } from '../config'
import { IUser } from '../interfaces'

async function createStripeCustomer(user: IUser): Promise<Stripe.Customer | null> {
  const stripe = new Stripe(String(envConfig.stripeApiKey))

  try {
    const existingCustomer = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (existingCustomer.data.length > 0) {
      return existingCustomer.data[0]
    }

    const newCustomer = await stripe.customers.create({
      name: `${user.firstname} ${user.lastname}`,
      email: user.email
    })

    return newCustomer
  } catch (error) {
    console.error('Error creating/fetching Stripe customer:', error)
    return null
  }
}

async function createStripePaymentMethod(
  stripeCustomer: Stripe.Customer,
  cardDetails: {
    token: string
  }
): Promise<Stripe.PaymentMethod | null> {
  try {
    const stripe = new Stripe(String(envConfig.stripeApiKey))
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: { token: cardDetails.token }
    })

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: stripeCustomer.id
    })

    return paymentMethod
  } catch (error) {
    console.error('Error creating Stripe payment method:', error)
    return null
  }
}

export default {
  createStripeCustomer,
  createStripePaymentMethod
}
