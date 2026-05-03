/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      initData?: string;
      sendData: (data: string) => void;
      close: () => void;
    };
  };
}
