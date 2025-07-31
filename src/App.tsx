import { Provider, defaultTheme } from '@adobe/react-spectrum'
import ConversationalInterface from './components/ConversationalInterface'
import './utils/IMS'

function App() {
  return (
    <Provider theme={defaultTheme}>
      <ConversationalInterface />
    </Provider>
  )
}

export default App
