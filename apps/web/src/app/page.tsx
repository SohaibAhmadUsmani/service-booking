import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>Service Booking Platform</h1>
      <p>Monorepo scaffold — see docs/TEAM_ASSIGNMENTS.md for ownership.</p>
      <ul>
        <li>
          <Link href="/landing">Public landing (Ayyan)</Link>
        </li>
        <li>
          <Link href="/login">Auth (Muzammil)</Link>
        </li>
        <li>
          <Link href="/search">Customer search (Khadija)</Link>
        </li>
        <li>
          <Link href="/categories">Categories (Khadija)</Link>
        </li>
        <li>
          <Link href="/providers">Providers (Khadija)</Link>
        </li>
        <li>
          <Link href="/bookings">Bookings (Shanza)</Link>
        </li>
        <li>
          <Link href="/provider">Provider dashboard (Maira)</Link>
        </li>
        <li>
          <Link href="/admin">Admin (Aiman)</Link>
        </li>
      </ul>
    </main>
  );
}
