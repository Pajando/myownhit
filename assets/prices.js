/*
  PRICES — the only place prices live. Change a number, save, done.
  Shown on the pricing page (pricing.html / precios.html).
  Plain numbers in US dollars: 78, not "$78".

  LAUNCH PRICES: while "launch" has numbers, the page shows the regular price
  crossed out with the launch price next to it, plus "Launch prices... going up soon."
  To end the launch, change   launch: { ... }   to   launch: null
  (and swap the Stripe payment links below for ones at the regular price)
*/
window.PRICES = {
  currency: "USD",
  one: 78,      // 1 song, 3-4 minutes (regular)
  two: 139,     // 2 songs (regular)
  three: 197,   // 3 songs (regular)
  launch: { one: 49, two: 89, three: 129 },

  // STRIPE PAYMENT LINKS: paste each link between the quotes (https://buy.stripe.com/...).
  // The thank-you screen shows a Pay button for the package they picked.
  // Make each link charge TODAY's price (the launch price while the launch is on).
  // Empty = no button; the screen says "You'll get an email with how to pay."
  payLinks: { one: "", two: "", three: "" }
};
