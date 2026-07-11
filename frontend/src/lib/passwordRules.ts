export function getPasswordIssues(password: string): string[] {
  const issues: string[] = []
  if (password.length < 8) issues.push('At least 8 characters')
  if (!/[A-Z]/.test(password)) issues.push('One uppercase letter')
  if (!/[a-z]/.test(password)) issues.push('One lowercase letter')
  if (!/[0-9]/.test(password)) issues.push('One number')
  return issues
}
