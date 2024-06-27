/* eslint-disable no-undef */
// global document, alert, Stripe, fetch

document.addEventListener('DOMContentLoaded', () => {
  const stripe = Stripe(
    'pk_test_51PV91OI98oGzZ2rhhlIN1zSTzZ1CjyOjN48dks6cqt0u7Oeu4YOBv7E79JFTE6IMPJbGvUngfQm5OCOfBJB3b2uO00rZPlWkTm'
  )
  const elements = stripe.elements()

  const cardElement = elements.create('card', {
    style: {
      base: {
        color: '#32325d',
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#32325d'
        }
      },
      invalid: {
        fontFamily: 'Arial, sans-serif',
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    }
  })

  cardElement.mount('#card-element')

  document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault()

    const { token, error } = await stripe.createToken(cardElement)

    if (error) {
      alert('Error generating token: ' + error.message)
      return
    }

    // if (token) {
    //   alert('Your token is: ' + token.id)
    // }

    const response = await fetch(`<% =link %>`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
})
