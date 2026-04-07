export default function PanelFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-6 border-t bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div>
            © {currentYear} - Painel Administrativo de Veículos
          </div>
        </div>
      </div>
    </footer>
  );
}