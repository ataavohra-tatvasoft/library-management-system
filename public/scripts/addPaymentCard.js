/* global document, alert, Stripe, fetch */
document.getElementById('payment-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const cardNumber = document.getElementById('cardNumber').value
  const cardBrand = document.getElementById('cardBrand').value
  const expirationMonth = document.getElementById('expirationMonth').value
  const expirationYear = document.getElementById('expirationYear').value
  const cvv = document.getElementById('cvv').value

  if (!cardNumber || !cardBrand || !expirationMonth || !expirationYear || !cvv) {
    alert('Please fill in all fields.')
    return
  }

  // Assuming you have Stripe initialized
  const stripe = Stripe('your-publishable-key-here')

  // Create a token using Stripe.js
  const { token, error } = await stripe.createToken({
    card: {
      number: cardNumber,
      exp_month: expirationMonth,
      exp_year: expirationYear,
      cvc: cvv
    }
  })

  if (error) {
    alert('Error generating token: ' + error.message)
    return
  }

  // Call your backend API to add the payment card
  // eslint-disable-next-line no-undef
  const response = await fetch(`/add-payment-card/${email}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cardNumber,
      cardBrand,
      expirationMonth,
      expirationYear,
      cvv,
      token: token.id
    })
  })

  const result = await response.json()

  if (response.ok) {
    alert('Payment card added successfully!')
  } else {
    alert('Error adding payment card: ' + result.message)
  }
})
