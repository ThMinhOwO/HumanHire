import { hires } from '../data/mock'
import Avatar from './Avatar'

function NearbyList() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="text-2xl font-bold text-stone-900">Nearby hires</h2>
      <p className="mt-1 text-stone-500">{hires.length} people within 3 km</p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {hires.map((hire) => (
          <li
            key={hire.id}
            className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <Avatar name={hire.name} color={hire.color} />
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">{hire.name}</p>
                <p className="truncate text-sm text-stone-500">{hire.service}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
              <span>📍 {hire.distance} km</span>
              <span>
                ★ {hire.rating} <span className="text-stone-400">({hire.reviews})</span>
              </span>
              <span className="font-semibold text-stone-900">${hire.rate}/hr</span>
            </div>

            <button className="mt-4 rounded-lg bg-stone-900 py-2 text-sm font-semibold text-white transition hover:bg-stone-700">
              Message
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default NearbyList
