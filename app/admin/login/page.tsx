import { loginAdmin } from "../actions";

export default function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-cream px-4">
      <form action={loginAdmin} className="bg-stone rounded-2xl p-8 max-w-sm w-full shadow-sm">
        <h1 className="font-serif text-2xl mb-1 text-charcoal">AMIRA Admin</h1>
        <p className="text-sm opacity-60 mb-6 text-charcoal">Enter the admin password to continue.</p>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          className="w-full border border-hairline rounded-lg p-2.5 text-base mb-3"
        />
        {searchParams.error && <p className="text-sm text-red-600 mb-3">Incorrect password.</p>}
        <button type="submit" className="w-full bg-charcoal text-cream rounded-lg py-2.5 hover:bg-wine transition-colors">
          Sign in
        </button>
      </form>
    </div>
  );
}
