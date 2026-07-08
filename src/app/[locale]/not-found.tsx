import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="text-center py-24 space-y-6">
      <h1 className="font-display text-6xl font-black italic text-white uppercase">404</h1>
      <p className="font-mono text-xs text-white/40 uppercase tracking-widest">Pagina non trovata</p>
      <Link href="/">
        <Button>Torna alla home</Button>
      </Link>
    </div>
  );
}
