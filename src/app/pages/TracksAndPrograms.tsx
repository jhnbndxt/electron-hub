import { Link } from "react-router";
import { BookOpen, ChevronRight } from "lucide-react";
import { ELECTIVE_STRUCTURE } from "../../data/electives";

/** Public catalogue driven by the same structure used by assessment and enrollment. */
export function TracksAndPrograms() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-blue-950 px-6 py-10 text-white shadow-xl sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">Electron College</p>
        <h1 className="mt-3 text-4xl font-bold">Tracks and elective offerings</h1>
        <p className="mt-4 max-w-3xl text-blue-100">Choose a track, then a cluster. Each cluster has a fixed set of current electives.</p>
      </div>

      <div className="mt-8 space-y-8">
        {ELECTIVE_STRUCTURE.map(({ track, clusters }) => (
          <section key={track} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-slate-950">{track}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {clusters.map((cluster) => (
                <article key={cluster.name} className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <h3 className="font-bold text-blue-950">{cluster.name}</h3>
                  <ol className="mt-4 space-y-2 text-sm text-slate-700">
                    {cluster.electives.map((elective, index) => (
                      <li key={`${cluster.name}-${elective}`} className="flex gap-2"><span className="font-semibold text-blue-800">Elective {index + 1}:</span>{elective}</li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Link to="/dashboard/enrollment" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white hover:bg-blue-900">
        <BookOpen className="h-5 w-5" /> Start enrollment <ChevronRight className="h-5 w-5" />
      </Link>
    </main>
  );
}
