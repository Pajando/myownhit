/*
  PRICES — the only place prices live. Change a number, save, done.
  Shown on the pricing page (pricing.html / precios.html).
  Plain numbers in US dollars: 78, not "$78".

  LAUNCH PRICES: while "launch" has numbers, the page shows the regular price
  crossed out with the launch price next to it, plus "Launch prices... going up soon."
  To end the launch, change   launch: { ... }   to   launch: null
*/
window.PRICES = {
  currency: "USD",
  one: 78,      // 1 song, 3-4 minutes (regular)
  two: 145,     // 2 songs (regular)
  three: 197,   // 3 songs (regular)
  launch: { one: 49, two: 89, three: 129 }
};
