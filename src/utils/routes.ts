/** True for /esim, /turkey-esim, /europe-esim, etc. */
export function isEsimRoute(pathname: string): boolean {
  return pathname === '/esim' || pathname.endsWith('-esim');
}
