export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return '₹' + amount.toLocaleString('en-IN');
  }
  return '$' + amount.toFixed(2);
}

export function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
