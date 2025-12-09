import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="py-8">
      <div className="container">
        <div className="flex justify-center items-center">
          <Logo />
        </div>
      </div>
    </header>
  );
}
