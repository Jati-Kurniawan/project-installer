import { useCounterStore } from './stores/counter'
import './App.css'

function App() {
  const { count, increment, decrement } = useCounterStore()

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Welcome to test-react-app
        </h1>
        <div className="space-y-4">
          <p className="text-lg text-gray-600">
            Count: <span className="font-semibold text-blue-600">{count}</span>
          </p>
          <div className="space-x-4">
            <button 
              onClick={increment}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Increment
            </button>
            <button 
              onClick={decrement}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Decrement
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App