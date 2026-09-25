// Razorpay's own integration docs require loading Checkout.js from their
// CDN at runtime (it opens a hosted, PCI-compliant payment UI rather than
// something that can be bundled) - this is the standard approach, not a
// workaround.
let loadPromise = null

export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the payment checkout script'))
    document.head.appendChild(script)
  })

  return loadPromise
}
