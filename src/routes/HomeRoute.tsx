import { useState } from 'react'

export default function HomeRoute() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-svh items-center justify-center bg-khaki-beige-50 px-6 py-12 text-ash-brown-900">
      <section className="w-full max-w-xl rounded-3xl border border-dusty-taupe-200 bg-white p-8 shadow-xl shadow-ash-brown-950/10 sm:p-12">
        <span className="inline-flex rounded-full bg-chocolate-plum-100 px-3 py-1 text-sm font-semibold text-chocolate-plum-700">
          React · TypeScript · Tailwind CSS
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-chocolate-plum-900 sm:text-5xl">
          BodyLog
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-dusty-taupe-700">
          Das Grundgerüst steht. Die BodyLog-Farbpalette ist als Tailwind-Theme
          eingebunden und kann in allen Komponenten verwendet werden.
        </p>

        <button
          type="button"
          className="mt-8 rounded-xl bg-chocolate-plum-700 px-5 py-3 font-semibold text-white transition hover:bg-chocolate-plum-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chocolate-plum-600"
          onClick={() => setCount((currentCount) => currentCount + 1)}
        >
          Tailwind funktioniert: {count}
        </button>

        <div className="mt-10 grid grid-cols-4 gap-2" aria-label="BodyLog-Farbpalette">
          <div className="h-14 rounded-xl bg-khaki-beige-300" />
          <div className="h-14 rounded-xl bg-dusty-taupe-500" />
          <div className="h-14 rounded-xl bg-ash-brown-700" />
          <div className="h-14 rounded-xl bg-chocolate-plum-800" />
        </div>
      </section>
    </main>
  )
}
