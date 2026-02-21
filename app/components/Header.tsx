import Link from "next/link";
import { marketDeco } from "../fonts";

export default function Header() {
  return (
    <header className="border-b bg-black text-white p-4">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-center px-4">
        <img src="/torqueLogo.png" alt="Torqueue Logo" className="h-15 w-15" />
        <Link
          href="/"
          className={`${marketDeco.className} text-4xl font-semibold`}
        >
          TORQUEUE
        </Link>
      </div>
    </header>
  );
}
