import { useCounterStore } from '../stores/counter'

export default function Home() {
  const { count, increment, decrement } = useCounterStore()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center">
          Welcome to test-nextjs-app
        </h1>
        <p className="mt-4 text-xl text-center">
          Get started by editing{' '}
          <code className="font-mono font-bold">src/app/page.tsx</code>
        </p>
        
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-2xl">Count: {count}</p>
          <div className="flex gap-4">
            <button
              onClick={increment}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Increment
            </button>
            <button
              onClick={decrement}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Decrement
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}