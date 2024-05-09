function timeout<T>(request: any, duration: number): Promise<T | undefined> {
  return new Promise((resolve: any) => {
    let timeout = setTimeout(() => {
      resolve()
    }, duration)

    request.then(
      (res: any) => {
        clearTimeout(timeout)
        resolve(res)
      },
      () => {
        clearTimeout(timeout)
        resolve(undefined)
      }
    )
  })
}

export function getWithTimeout<T>(
  api: string,
  headers?: any
): Promise<T | undefined> {
  return timeout(get<T>(api, headers), 60000)
}

export function get<T>(api: string, headers?: any): Promise<T | undefined> {
  return fetch(api, {
    method: 'get',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
  })
    .then((response) => {
      return response.json().then((data) => {
        return data as T
      })
    })
    .catch(() => {
      return undefined
    })
}
