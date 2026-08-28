'use client';
export default function PrintButton() {
  return (
    <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>
      Salvar em PDF
    </button>
  );
}
