// Demo payments never contact a bank. Set PAYMENT_MODE=live (or CHARGILY_MODE=live)
// to disable simulation and use the hosted payment gateway.
export function demoPaymentsEnabled() {
  return process.env.PAYMENT_MODE !== 'live' && process.env.CHARGILY_MODE !== 'live';
}
