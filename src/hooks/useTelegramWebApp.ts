import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        close: () => void
        sendData: (data: string) => void
        enableClosingConfirmation: () => void
        disableClosingConfirmation: () => void
        themeParams: Record<string, string>
        colorScheme: 'light' | 'dark'
        viewportHeight: number
        viewportStableHeight: number
        headerColor: string
        backgroundColor: string
        isExpanded: boolean
        isClosingConfirmationEnabled: boolean
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
          }
          chat?: {
            id: number
            type: string
          }
          query_id?: string
          auth_date: string
          hash: string
        }
      }
    }
  }
}

export interface TelegramUser {
  id: number
  firstName: string
  lastName?: string
  username?: string
  languageCode?: string
}

export interface TelegramChat {
  id: number
  type: string
}

export function useTelegramWebApp() {
  const [isInTelegram, setIsInTelegram] = useState(false)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [chat, setChat] = useState<TelegramChat | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const tg = window.Telegram?.WebApp

    if (tg) {
      setIsInTelegram(true)

      // Initialize the web app
      tg.ready()
      tg.expand()
      tg.enableClosingConfirmation()

      // Get user info
      if (tg.initDataUnsafe?.user) {
        setUser({
          id: tg.initDataUnsafe.user.id,
          firstName: tg.initDataUnsafe.user.first_name,
          lastName: tg.initDataUnsafe.user.last_name,
          username: tg.initDataUnsafe.user.username,
          languageCode: tg.initDataUnsafe.user.language_code,
        })
      }

      // Get chat info
      if (tg.initDataUnsafe?.chat) {
        setChat({
          id: tg.initDataUnsafe.chat.id,
          type: tg.initDataUnsafe.chat.type,
        })
      }

      setIsLoading(false)
    } else {
      setIsInTelegram(false)
      setIsLoading(false)
    }
  }, [])

  const closeApp = () => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.close()
    }
  }

  const sendData = (data: object | string) => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data)
      tg.sendData(jsonData)
    }
  }

  const expandApp = () => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.expand()
    }
  }

  const enableClosingConfirmation = () => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.enableClosingConfirmation()
    }
  }

  const disableClosingConfirmation = () => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.disableClosingConfirmation()
    }
  }

  return {
    isInTelegram,
    isLoading,
    user,
    chat,
    closeApp,
    sendData,
    expandApp,
    enableClosingConfirmation,
    disableClosingConfirmation,
    tg: window.Telegram?.WebApp,
  }
}
