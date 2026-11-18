import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="font-display text-5xl text-pomodoro">404</p>
      <p className="mt-3 text-lg">We couldn&apos;t find that page. · No encontramos esa página.</p>
      <Link href="/" className="btn-primary mt-6">Menu · Menú</Link>
    </div>
  );
}
