export const providerStatus = error => Number(error?.status_code || error?.statusCode || 0);
export const isTemporaryProviderError = error => [500, 502, 503, 504].includes(providerStatus(error));

// Retry one explicit temporary server failure. Do not retry auth, billing,
// invalid/private links, or ambiguous timeouts that may already have been billed.
export async function withProviderRetry(operation, sleep = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  try { return await operation(); }
  catch (error) {
    if (!isTemporaryProviderError(error)) throw error;
    await sleep(1000);
    return operation();
  }
}
