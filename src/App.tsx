import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import useToast from './components/toast/useToast';

function App() {
  //const [count, setCount] = useState(0);
  const { showToast, ToastStack } = useToast({ 
    position: 'bottom-right', 
    sticky: true,
    animate: 'pop'
  });

  return (
    <>
      {ToastStack}
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => showToast({
          type: 'info',
          message: "This is an info"
        })}>
          Show Info Toast
        </button>
        <button onClick={() => showToast({
          type: 'error',
          message: "This is an error message"
        })}>
          Show Error Toast
        </button>
        <button onClick={() => showToast({
          type: 'success',
          message: "This is a success message"
        })}>
          Show Success Toast
        </button>
        <button onClick={() => showToast({
          type: 'warn',
          message: "This is a warning.."
        })}>
          Show Warn Toast
        </button>
        
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
