export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">ArchiCue</h1>
        <p className="text-xl text-foreground/80">Know the code before you sketch.</p>
      </header>

      <p className="text-lg leading-8">
        ArchiCue turns your site notes and client brief into a pre-design brief for Philippine projects.
        Every requirement links to the exact NBCP or Fire Code section and page, so you can check it
        yourself.
      </p>

      <section
        aria-label="Project input"
        className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-foreground/40 p-8 text-center"
      >
        <h2 className="text-lg font-semibold">Coming soon</h2>
        <p className="text-foreground/70">The project input form will go here.</p>
      </section>
    </main>
  );
}
