import axios from 'axios'

function getCookie(name: string): string {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')
  return match ? match.pop()! : ''
}

export const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// CSRF token must be read fresh on every request — django.contrib.auth.login()
// rotates the token server-side, so caching the value would send a stale one.
client.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase()
  if (method && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    config.headers['X-CSRFToken'] = getCookie('csrftoken')
  }
  return config
})
