interface Window {
  webkitSpeechRecognition: any
  SpeechRecognition: any
  google: {
    accounts: {
      oauth2: {
        initTokenClient: (config: any) => any
      }
    }
  }
}
