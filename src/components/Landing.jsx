function Landing({ onNavigate }) {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
        Real people · Real life · Right nearby
      </span>

      <h1 className="mt-6 max-w-2xl text-4xl font-extrabold tracking-tight text-stone-900 sm:text-6xl">
        Hire a human for <span className="text-orange-600">anything</span>.
      </h1>

      <p className="mt-5 max-w-xl text-lg text-stone-600">
        Tutors, gym buddies, a plus-one for the wedding, a pretend partner for
        family dinner. Find someone near you and meet up in person.
      </p>

      <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <button
          onClick={() => onNavigate('nearby')}
          className="flex-1 rounded-xl bg-orange-600 px-6 py-4 font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
        >
          Browse nearby hires
        </button>
        <button
          onClick={() => onNavigate('chats')}
          className="flex-1 rounded-xl border border-stone-300 bg-white px-6 py-4 font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-100"
        >
          My chats
        </button>
      </div>
    </section>
  )
}

export default Landing
