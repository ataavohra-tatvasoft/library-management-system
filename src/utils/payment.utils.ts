import Stripe from 'stripe'
import { envConfig } from '../config'
import { IUser } from '../interfaces'

async function createStripeCustomer(user: IUser): Promise<Stripe.Customer | null> {
  const stripe = new Stripe(String(envConfig.stripeApiKey))
  try {
    return await stripe.customers.create({
      name: `${user.firstname} ${user.lastname}`,
      email: user.email
    })
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    return null
  }
}

async function createStripePaymentMethod(
  stripeCustomer: Stripe.Customer,
  cardDetails: {
    // cardNumber: string;
    // expirationMonth: number;
    // expirationYear: number;
    // cvv: string;
    token: string
  }
): Promise<Stripe.PaymentMethod | null> {
  try {
    // const stripe = new Stripe(String(envConfig.stripeApiKey));
    // const paymentMethod =  await stripe.paymentMethods.create({
    //     type: 'card',
    //     card: {
    //         number: cardDetails.cardNumber,
    //         exp_month: cardDetails.expirationMonth,
    //         exp_year: cardDetails.expirationYear,
    //         cvc: cardDetails.cvv,
    //     },
    //     // customer: stripeCustomer.id,
    // });

    // const stripe = new Stripe(String(envConfig.stripeApiKey));
    // const token = await stripe.tokens.create({
    //     card: {
    //         number: cardDetails.cardNumber,
    //         exp_month: String(cardDetails.expirationMonth),
    //         exp_year: String(cardDetails.expirationYear),
    //         cvc: cardDetails.cvv,
    //     },
    // });

    const stripe = new Stripe(String(envConfig.stripeApiKey))
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: { token: cardDetails.token }
    })

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: stripeCustomer.id
    })

    return paymentMethod
  } catch (error: any) {
    console.error('Error creating Stripe payment method:', error.message)
    return null
  }
}

export default {
  createStripeCustomer,
  createStripePaymentMethod
}
